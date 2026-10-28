"""Exercise the real journal migration/RPC in an isolated PostgreSQL cluster."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
bin_dir = Path(subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
user_a = '00000000-0000-4000-8000-000000000001'
user_b = '00000000-0000-4000-8000-000000000002'
client_a = '10000000-0000-4000-8000-000000000001'
client_b = '10000000-0000-4000-8000-000000000002'
empty = {'version': 1, 'bookmarks': [], 'stamps': []}
ref = {'kind': 'google', 'id': 'ChIJ_test'}
with tempfile.TemporaryDirectory(prefix='argala-journal-pg-') as directory:
    def run(command, **kwargs):
        return subprocess.run(command, check=True, capture_output=True, text=True, **kwargs)
    run([str(bin_dir / 'initdb'), '-D', directory, '-A', 'trust', '-U', 'argala_test'])
    run([str(bin_dir / 'pg_ctl'), '-D', directory, '-l', str(Path(directory) / 'server.log'), '-o', f"-F -k {directory} -p 55439 -h ''", '-w', 'start'])
    command = [str(bin_dir / 'psql'), '-h', directory, '-p', '55439', '-U', 'argala_test', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-At']
    def sql(text):
        return run(command, input=text).stdout.strip()
    def as_user(user, text):
        return sql(f"SET request.jwt.claim.sub = '{user}'; SET ROLE authenticated; {text}").splitlines()[-1]
    def request(user, client, seq, rev, payload, rid=None):
        rid = rid or f'20000000-0000-4000-8000-{seq:012d}'
        body = json.dumps(payload).replace("'", "''")
        return json.loads(as_user(user, f"SELECT public.sync_travel_journal('{client}','{rid}',{seq},{rev},'{body}'::jsonb);"))
    def denied(user, text):
        try:
            as_user(user, text)
            raise AssertionError('Expected SQL rejection')
        except subprocess.CalledProcessError:
            pass
    try:
        fixture = f"""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key);
        INSERT INTO auth.users VALUES ('{user_a}'),('{user_b}');
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        GRANT USAGE ON SCHEMA auth TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;
        """
        sql(fixture + (root / 'supabase/migrations/202610170001_google_request_limits.sql').read_text() + (root / 'supabase/migrations/202610280001_journal_sync.sql').read_text())
        privileges = sql("SELECT has_function_privilege('anon','public.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb)','EXECUTE'),has_function_privilege('authenticated','public.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb)','EXECUTE');")
        assert privileges == 'f|t', privileges
        limiter = sql("SELECT has_function_privilege('anon','public.consume_google_request(uuid)','EXECUTE'),has_function_privilege('authenticated','public.consume_google_request(uuid)','EXECUTE'),has_function_privilege('service_role','public.consume_google_request(uuid)','EXECUTE');")
        assert limiter == 'f|f|t', limiter
        denied(user_a, 'SELECT * FROM private.google_request_limits;')
        denied('', f"SELECT public.sync_travel_journal('{client_a}','30000000-0000-4000-8000-000000000001',1,0,'{json.dumps(empty)}');")
        saved = {**empty, 'bookmarks': [ref]}
        first = request(user_a, client_a, 1, 0, saved)
        assert first['status'] == 'applied' and first['revision'] == 1
        assert request(user_b, client_a, 1, 0, empty)['journal'] == empty
        assert as_user(user_b, f"SELECT count(*) FROM public.account_journals WHERE user_id='{user_a}';") == '0'
        assert as_user(user_b, f"SELECT count(*) FROM public.journal_sync_clients WHERE user_id='{user_a}';") == '0'
        denied(user_a, f"UPDATE public.account_journals SET revision=99 WHERE user_id='{user_a}';")
        denied(user_a, f"INSERT INTO public.journal_sync_clients(user_id,client_id) VALUES ('{user_b}','{client_b}');")
        conflict = request(user_a, client_b, 1, 0, empty)
        assert conflict['status'] == 'conflict' and conflict['journal']['bookmarks'] == [ref]
        removed = request(user_a, client_b, 1, 1, empty)
        assert removed['status'] == 'applied' and removed['revision'] == 2
        replay = request(user_a, client_a, 1, 0, saved)
        assert replay['status'] == 'applied' and replay['revision'] == 2 and replay['journal']['bookmarks'] == [], replay
        assert request(user_a, client_a, 1, 2, saved, rid='30000000-0000-4000-8000-000000000001')['status'] == 'reset'
        assert request(user_a, client_a, 5, 2, saved)['status'] == 'reset'
        stamped = {**empty, 'stamps': [{'destinationId': 'D01', 'visitedAt': 200}]}
        request(user_a, client_a, 2, 2, stamped)
        # A later snapshot cannot delete existing earned progress; earlier visit wins.
        newer = request(user_a, client_a, 3, 3, {**empty, 'stamps': [{'destinationId': 'D01', 'visitedAt': 100}]})
        assert newer['journal']['stamps'] == [{'destinationId': 'D01', 'visitedAt': 100}]
        retained = request(user_a, client_a, 4, 4, empty)
        assert retained['journal']['stamps'] == newer['journal']['stamps']
        assert retained['revision'] == 4
        bads = [
            {**empty, 'coordinates': [0, 0]}, {**empty, 'version': 2},
            {**empty, 'bookmarks': [ref, ref]},
            {**empty, 'bookmarks': [{**ref, 'name': 'provider content'}]},
            {**empty, 'bookmarks': [{'kind':'featured','id':'unknown'}]},
            {**empty, 'bookmarks': [{'kind':'google','id':'x'*4097}]},
            {**empty, 'stamps':[{'destinationId':'D01','visitedAt':-1}]},
            {**empty, 'stamps':[{'destinationId':'D01','visitedAt':1.5}]},
            {**empty, 'stamps':[{'destinationId':'D01','visitedAt':1,'latitude':0}]},
        ]
        for bad in bads:
            denied(user_a, f"SELECT public.sync_travel_journal('{client_a}','40000000-0000-4000-8000-000000000001',5,4,'{json.dumps(bad)}'::jsonb);")
        huge = {**empty, 'bookmarks':[{'kind':'google','id':f'ChIJ_{i}_'+'x'*2000} for i in range(600)]}
        denied(user_a, f"SELECT public.sync_travel_journal('{client_a}','40000000-0000-4000-8000-000000000002',5,4,'{json.dumps(huge)}'::jsonb);")
        assert as_user(user_a, 'SELECT revision FROM public.account_journals;') == '4'
        # Rejected fresh namespaces must not allocate permanent receipt rows.
        before = int(as_user(user_a, 'SELECT count(*) FROM public.journal_sync_clients;'))
        for index in range(16):
            cid = f'60000000-0000-4000-8000-{index:012d}'
            assert request(user_a,cid,999,4,empty)['status'] == 'reset'
            assert request(user_a,cid,1,0,empty)['status'] == 'conflict'
        assert int(as_user(user_a, 'SELECT count(*) FROM public.journal_sync_clients;')) == before
        def concurrent(index):
            cid = f'50000000-0000-4000-8000-{index:012d}'
            return request(user_a, cid, 1, 4, {**empty, 'bookmarks':[{'kind':'google','id':f'ChIJ_{index}'}]})
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(concurrent, range(8)))
        assert [x['status'] for x in results].count('applied') == 1, results
        assert [x['status'] for x in results].count('conflict') == 7, results
        # Admission is bounded under the account lock, without evicting replay receipts.
        snapshot = json.loads(as_user(user_a, 'SELECT payload FROM public.account_journals;'))
        existing = int(as_user(user_a, 'SELECT count(*) FROM public.journal_sync_clients;'))
        for index in range(127-existing):
            cid = f'70000000-0000-4000-8000-{index:012d}'
            assert request(user_a,cid,1,5,snapshot)['status'] == 'applied'
        def admit(index):
            try:
                cid=f'80000000-0000-4000-8000-{index:012d}'
                return request(user_a,cid,1,5,snapshot)['status']
            except subprocess.CalledProcessError as error:
                assert '54000' in error.stderr, error.stderr
                return 'capacity'
        with ThreadPoolExecutor(max_workers=8) as executor:
            admissions=list(executor.map(admit,range(8)))
        assert admissions.count('applied') == 1 and admissions.count('capacity') == 7, admissions
        assert int(as_user(user_a, 'SELECT count(*) FROM public.journal_sync_clients;')) == 128
        # Existing client requests and replays remain available at capacity.
        assert request(user_a,client_a,5,5,snapshot)['status'] == 'applied'
        assert request(user_a,client_a,5,5,snapshot)['status'] == 'applied'
        sql(f"DELETE FROM auth.users WHERE id='{user_a}';")
        assert sql(f"SELECT count(*) FROM public.account_journals WHERE user_id='{user_a}';") == '0'
        assert sql(f"SELECT count(*) FROM public.journal_sync_clients WHERE user_id='{user_a}';") == '0'
        print('Journal PostgreSQL: auth/RLS, payload limits, revision conflicts, replay/deletion, stamps, client reset, eight concurrent writers and account cascade passed.')
    finally:
        run([str(bin_dir / 'pg_ctl'), '-D', directory, '-m', 'immediate', '-w', 'stop'])
