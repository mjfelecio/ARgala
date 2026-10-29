"""Real content SQL/RPC privileges in an isolated cluster, never hosted Supabase."""
from pathlib import Path
import json
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
binary = Path(subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
with tempfile.TemporaryDirectory(prefix='argala-content-pg-') as directory:
    def run(command, **kwargs):
        return subprocess.run(command, check=True, capture_output=True, text=True, **kwargs)
    run([str(binary / 'initdb'), '-D', directory, '-A', 'trust', '-U', 'argala_test'])
    run([str(binary / 'pg_ctl'), '-D', directory, '-l', str(Path(directory) / 'server.log'), '-o', f"-F -k {directory} -p 55440 -h ''", '-w', 'start'])
    command = [str(binary / 'psql'), '-h', directory, '-p', '55440', '-U', 'argala_test', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At']
    def sql(value):
        return run(command, input=value).stdout.strip()
    def denied(statement):
        try:
            sql(statement)
        except subprocess.CalledProcessError:
            return
        raise AssertionError('Expected SQL rejection')
    owner = '00000000-0000-4000-8000-000000000001'
    authenticated = f"SET request.jwt.claim.sub='{owner}'; SET ROLE authenticated; "
    try:
        sql("""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key);
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
        """)
        for migration in sorted((root / 'supabase/migrations').glob('*.sql')):
            sql(migration.read_text())
        # RED before implementation must fail here, not silently exercise only old migrations.
        assert sql("SELECT to_regprocedure('public.get_destination_content()') IS NOT NULL;") == 't'
        assert sql(authenticated + 'SELECT public.get_destination_content() IS NULL;').splitlines()[-1] == 't'
        denied('SET ROLE anon; SELECT public.get_destination_content();')
        denied('SET ROLE authenticated; SELECT public.get_destination_content();')
        denied(authenticated + 'SELECT * FROM private.destination_content;')
        locales = {locale: {'value': 'Synthetic SQL fixture', 'approvalReference': 'synthetic-test-only'} for locale in ['en', 'ja', 'ko']}
        artifact = {'schemaVersion': 1, 'catalogVersion': 1, 'revision': 1, 'approvalStatus': 'approved', 'destinations': [
            {'id': 'pilot-aclc', 'contentVersion': 'test-1', 'tiles': [{'id': 'overview', 'role': 'overview', 'title': locales, 'body': locales}]}
        ]}
        def literal(value):
            return "'" + json.dumps(value).replace("'", "''") + "'::jsonb"
        for invalid in [dict(artifact, approvalStatus='draft'), dict(artifact, revision=0), dict(artifact, schemaVersion=2),
                        dict(artifact, destinations=artifact['destinations'] * 2), dict(artifact, media=[{'source': 1}]),
                        dict(artifact, destinations=[dict(artifact['destinations'][0], center={'latitude': 1, 'longitude': 1})]),
                        dict(artifact, destinations=[dict(artifact['destinations'][0], id=None)]),
                        dict(artifact, destinations=[dict(artifact['destinations'][0], tiles=[artifact['destinations'][0]['tiles'][0], dict(artifact['destinations'][0]['tiles'][0], id='facts', role=None)])]),
                        dict(artifact, destinations=[dict(artifact['destinations'][0], tiles=[dict(artifact['destinations'][0]['tiles'][0], body={'en': locales['en']})])])]:
            denied('INSERT INTO private.destination_content(manifest) VALUES (' + literal(invalid) + ');')
        denied(authenticated + 'INSERT INTO private.destination_content(manifest) VALUES (' + literal(artifact) + ');')
        sql('INSERT INTO private.destination_content(manifest) VALUES (' + literal(artifact) + ');')
        assert json.loads(sql(authenticated + 'SELECT public.get_destination_content();').splitlines()[-1]) == artifact
        for operation in ["UPDATE private.destination_content SET manifest='{}'", 'DELETE FROM private.destination_content', 'TRUNCATE private.destination_content']:
            denied(authenticated + operation)
        denied('UPDATE private.destination_content SET manifest=' + literal(dict(artifact, destinations=[])) + ';')
        withdrawal = dict(artifact, revision=2, destinations=[])
        sql('UPDATE private.destination_content SET manifest=' + literal(withdrawal) + ';')
        assert json.loads(sql(authenticated + 'SELECT public.get_destination_content();').splitlines()[-1]) == withdrawal
        privileges = sql("SELECT has_function_privilege('anon','public.consume_google_request(uuid)','EXECUTE'),has_function_privilege('authenticated','public.consume_google_request(uuid)','EXECUTE'),has_function_privilege('service_role','public.consume_google_request(uuid)','EXECUTE'),has_function_privilege('authenticated','public.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb)','EXECUTE');")
        assert privileges == 'f|f|t|t', privileges
        rls = sql("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='private.destination_content'::regclass;")
        assert rls == 't|t', rls
        print('Content SQL passed: no seed, auth-only read, denied client publication, validated artifact, monotonic withdrawal, preserved journal/limiter grants.')
    finally:
        run([str(binary / 'pg_ctl'), '-D', directory, '-m', 'immediate', '-w', 'stop'])
