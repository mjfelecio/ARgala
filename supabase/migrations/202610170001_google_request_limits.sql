-- Shared across all Edge instances. No coordinates, provider content or history.
create schema if not exists private;
create table private.google_request_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null check (request_count between 1 and 31)
);
alter table private.google_request_limits enable row level security;
revoke all on private.google_request_limits from public, anon, authenticated;

create or replace function public.consume_google_request(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  count_after integer;
  now_at timestamptz := clock_timestamp();
begin
  insert into private.google_request_limits as limits (user_id, window_start, request_count)
  values (p_user_id, now_at, 1)
  on conflict (user_id) do update set
    request_count = case when limits.window_start <= now_at - interval '1 minute' then 1 else least(limits.request_count + 1, 31) end,
    window_start = case when limits.window_start <= now_at - interval '1 minute' then now_at else limits.window_start end
  returning request_count into count_after;
  return count_after <= 30;
end;
$$;
revoke all on function public.consume_google_request(uuid) from public, anon, authenticated;
grant execute on function public.consume_google_request(uuid) to service_role;
