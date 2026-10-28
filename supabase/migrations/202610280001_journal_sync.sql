-- Identifier-only user state. No provider display data, coordinates or attestation.
create schema if not exists private;

create function private.valid_travel_journal(value jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare item jsonb; stamp numeric;
begin
  if value is null or pg_catalog.jsonb_typeof(value) <> 'object'
    or not (value ?& array['version','bookmarks','stamps'])
    or value - array['version','bookmarks','stamps']::text[] <> '{}'::jsonb
    or value->'version' <> '1'::jsonb
    or pg_catalog.jsonb_typeof(value->'bookmarks') <> 'array'
    or pg_catalog.jsonb_typeof(value->'stamps') <> 'array'
    or pg_catalog.octet_length(value::text) > 1048576 then return false; end if;
  if pg_catalog.jsonb_array_length(value->'bookmarks') > 1000 or pg_catalog.jsonb_array_length(value->'stamps') > 10 then return false; end if;
  for item in select x from pg_catalog.jsonb_array_elements(value->'bookmarks') x loop
    if pg_catalog.jsonb_typeof(item) <> 'object' or not (item ?& array['kind','id'])
      or item - array['kind','id']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(item->'kind') <> 'string' or pg_catalog.jsonb_typeof(item->'id') <> 'string' then return false; end if;
    if item->>'kind' = 'google' then
      if pg_catalog.length(item->>'id') not between 1 and 4096 or item->>'id' !~ '^[A-Za-z0-9_-]+$' then return false; end if;
    elsif item->>'kind' = 'featured' then
      if item->>'id' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','pilot-aclc']) then return false; end if;
    else return false; end if;
  end loop;
  if (select count(*) from pg_catalog.jsonb_array_elements(value->'bookmarks')) <>
    (select count(distinct (x->>'kind',x->>'id')) from pg_catalog.jsonb_array_elements(value->'bookmarks') x) then return false; end if;
  for item in select x from pg_catalog.jsonb_array_elements(value->'stamps') x loop
    if pg_catalog.jsonb_typeof(item) <> 'object' or not (item ?& array['destinationId','visitedAt'])
      or item - array['destinationId','visitedAt']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(item->'destinationId') <> 'string'
      or item->>'destinationId' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','pilot-aclc'])
      or pg_catalog.jsonb_typeof(item->'visitedAt') <> 'number' then return false; end if;
    stamp := (item->>'visitedAt')::numeric;
    if stamp < 1 or stamp > 9007199254740991 or stamp <> pg_catalog.trunc(stamp) then return false; end if;
  end loop;
  return (select count(*) from pg_catalog.jsonb_array_elements(value->'stamps')) =
    (select count(distinct x->>'destinationId') from pg_catalog.jsonb_array_elements(value->'stamps') x);
exception when others then return false;
end;
$$;
revoke all on function private.valid_travel_journal(jsonb) from public, anon, authenticated;

create table public.account_journals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"version":1,"bookmarks":[],"stamps":[]}'::jsonb check (private.valid_travel_journal(payload)),
  revision bigint not null default 0 check (revision between 0 and 9007199254740991)
);
create table public.journal_sync_clients (
  user_id uuid not null references public.account_journals(user_id) on delete cascade,
  client_id uuid not null,
  last_sequence bigint not null default 0 check (last_sequence between 0 and 9007199254740991),
  last_request_id uuid,
  last_digest text,
  primary key (user_id,client_id)
);
alter table public.account_journals enable row level security;
alter table public.journal_sync_clients enable row level security;
revoke all on public.account_journals, public.journal_sync_clients from public, anon, authenticated;
grant select on public.account_journals, public.journal_sync_clients to authenticated;
create policy journal_owner_read on public.account_journals for select to authenticated using (user_id = (select auth.uid()));
create policy journal_client_owner_read on public.journal_sync_clients for select to authenticated using (user_id = (select auth.uid()));

create function private.sync_travel_journal(p_client_id uuid, p_request_id uuid, p_sequence bigint, p_revision bigint, p_journal jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_row public.account_journals%rowtype;
  client_row public.journal_sync_clients%rowtype;
  digest text;
  outcome text;
  stamps jsonb;
  next_payload jsonb;
begin
  if owner_id is null then raise exception using errcode = '42501', message = 'Journal authentication required'; end if;
  if p_client_id is null or p_request_id is null or p_sequence is null or p_sequence not between 1 and 9007199254740991
    or p_revision is null or p_revision not between 0 and 9007199254740991
    or not private.valid_travel_journal(p_journal) then
    raise exception using errcode = '22023', message = 'Invalid journal request';
  end if;
  insert into public.account_journals(user_id) values (owner_id) on conflict do nothing;
  select * into strict current_row from public.account_journals where user_id = owner_id for update;
  insert into public.journal_sync_clients(user_id,client_id) values (owner_id,p_client_id) on conflict do nothing;
  select * into strict client_row from public.journal_sync_clients where user_id = owner_id and client_id = p_client_id;
  digest := pg_catalog.md5(p_revision::text || ':' || p_journal::text);
  if p_sequence <= client_row.last_sequence then
    -- Replays return the latest snapshot, not an obsolete saved response.
    outcome := case when p_sequence = client_row.last_sequence and p_request_id = client_row.last_request_id and digest = client_row.last_digest then 'applied' else 'reset' end;
  elsif p_sequence <> client_row.last_sequence + 1 then
    outcome := 'reset';
  elsif p_revision <> current_row.revision then
    outcome := 'conflict';
  else
    -- Passport is monotonic first-visit state, not a server GPS attestation.
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('destinationId',destination_id,'visitedAt',visited_at) order by destination_id),'[]'::jsonb)
      into stamps from (
        select x->>'destinationId' destination_id, min((x->>'visitedAt')::numeric) visited_at
        from pg_catalog.jsonb_array_elements((current_row.payload->'stamps') || (p_journal->'stamps')) x group by x->>'destinationId'
      ) visits;
    next_payload := pg_catalog.jsonb_build_object('version',1,'bookmarks',p_journal->'bookmarks','stamps',stamps);
    if next_payload <> current_row.payload then
      if current_row.revision = 9007199254740991 then raise exception using errcode = '22023', message = 'Journal revision exhausted'; end if;
      update public.account_journals set payload=next_payload, revision=revision+1 where user_id=owner_id returning * into current_row;
    end if;
    update public.journal_sync_clients set last_sequence=p_sequence,last_request_id=p_request_id,last_digest=digest where user_id=owner_id and client_id=p_client_id;
    outcome := 'applied';
  end if;
  return pg_catalog.jsonb_build_object('status',outcome,'sequence',p_sequence,'requestId',p_request_id,'revision',current_row.revision,'journal',current_row.payload);
end;
$$;
revoke all on function private.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb) to authenticated;

-- Only the invoker wrapper is exposed through the Data API; private is not exposed.
create function public.sync_travel_journal(p_client_id uuid, p_request_id uuid, p_sequence bigint, p_revision bigint, p_journal jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.sync_travel_journal(p_client_id,p_request_id,p_sequence,p_revision,p_journal);
$$;
revoke all on function public.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.sync_travel_journal(uuid,uuid,bigint,bigint,jsonb) to authenticated;
