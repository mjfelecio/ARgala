"""Verify the migration in an isolated, disposable PostgreSQL cluster."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
bin_dir = Path(subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
with tempfile.TemporaryDirectory(prefix='argala-pg-') as directory:
    def run(command, **kwargs):
        return subprocess.run(command, check=True, capture_output=True, text=True, **kwargs)
    run([str(bin_dir / 'initdb'), '-D', directory, '-A', 'trust', '-U', 'argala_test'])
    run([str(bin_dir / 'pg_ctl'), '-D', directory, '-l', str(Path(directory) / 'server.log'), '-o', f"-F -k {directory} -p 55437 -h ''", '-w', 'start'])
    try:
        command = [str(bin_dir / 'psql'), '-h', directory, '-p', '55437', '-U', 'argala_test', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At']
        user_id = '00000000-0000-4000-8000-000000000001'
        fixture = f"CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key); INSERT INTO auth.users VALUES ('{user_id}');"
        migration = (root / 'supabase/migrations/202610170001_google_request_limits.sql').read_text()
        run(command, input=fixture + migration)
        def consume(_):
            return run(command, input=f"SELECT public.consume_google_request('{user_id}');").stdout.strip()
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(consume, range(32)))
        assert results.count('t') == 30 and results.count('f') == 2, results
        privileges = run(command, input="SELECT has_function_privilege('anon','public.consume_google_request(uuid)','EXECUTE'), has_function_privilege('authenticated','public.consume_google_request(uuid)','EXECUTE'), has_function_privilege('service_role','public.consume_google_request(uuid)','EXECUTE');").stdout.strip()
        assert privileges == 'f|f|t', privileges
        run(command, input="UPDATE private.google_request_limits SET window_start=clock_timestamp()-interval '61 seconds';")
        assert consume(None) == 't'
        assert run(command, input='SELECT request_count FROM private.google_request_limits;').stdout.strip() == '1'
        print('PostgreSQL limiter: 32 concurrent calls → 30 allowed, 2 denied; privileges and window reset passed.')
    finally:
        run([str(bin_dir / 'pg_ctl'), '-D', directory, '-m', 'immediate', '-w', 'stop'])
