-- Reviewed curated text only. No provider cache, geographic authority or app publication API.
create schema if not exists private;

create function private.valid_destination_locales(value jsonb, maximum integer)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare locale text; item jsonb;
begin
  if value is null or pg_catalog.jsonb_typeof(value) <> 'object'
    or not (value ?& array['en','ja','ko']) or value - array['en','ja','ko']::text[] <> '{}'::jsonb then return false; end if;
  foreach locale in array array['en','ja','ko'] loop
    item := value->locale;
    if pg_catalog.jsonb_typeof(item) <> 'object' or not (item ?& array['value','approvalReference'])
      or item - array['value','approvalReference']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(item->'value') <> 'string' or pg_catalog.jsonb_typeof(item->'approvalReference') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(item->>'value')) not between 1 and maximum
      or pg_catalog.length(pg_catalog.btrim(item->>'approvalReference')) not between 1 and 500 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create function private.valid_destination_manifest(value jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare destination jsonb; tile jsonb; revision numeric;
begin
  if value is null or pg_catalog.jsonb_typeof(value) <> 'object'
    or not (value ?& array['schemaVersion','catalogVersion','revision','approvalStatus','destinations'])
    or value - array['schemaVersion','catalogVersion','revision','approvalStatus','destinations']::text[] <> '{}'::jsonb
    or value->'schemaVersion' <> '1'::jsonb or value->'catalogVersion' <> '1'::jsonb
    or value->'approvalStatus' <> '"approved"'::jsonb
    or pg_catalog.jsonb_typeof(value->'revision') <> 'number'
    or pg_catalog.jsonb_typeof(value->'destinations') <> 'array'
    or pg_catalog.octet_length(value::text) > 524288 then return false; end if;
  revision := (value->>'revision')::numeric;
  if revision < 1 or revision > 9007199254740991 or revision <> pg_catalog.trunc(revision)
    or pg_catalog.jsonb_array_length(value->'destinations') > 10 then return false; end if;
  if (select count(*) <> count(distinct x->>'id') from pg_catalog.jsonb_array_elements(value->'destinations') x) then return false; end if;
  for destination in select x from pg_catalog.jsonb_array_elements(value->'destinations') x loop
    if pg_catalog.jsonb_typeof(destination) <> 'object' or not (destination ?& array['id','contentVersion','tiles'])
      or destination - array['id','contentVersion','tiles']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(destination->'id') <> 'string'
      or destination->>'id' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','pilot-aclc'])
      or pg_catalog.jsonb_typeof(destination->'contentVersion') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(destination->>'contentVersion')) not between 1 and 80
      or pg_catalog.jsonb_typeof(destination->'tiles') <> 'array'
      or pg_catalog.jsonb_array_length(destination->'tiles') not between 1 and 12 then return false; end if;
    if (select count(*) <> count(distinct x->>'id') from pg_catalog.jsonb_array_elements(destination->'tiles') x)
      or (select count(*) from pg_catalog.jsonb_array_elements(destination->'tiles') x where x->>'role'='overview') <> 1
      or (select count(*) from pg_catalog.jsonb_array_elements(destination->'tiles') x where x->>'role'='history') > 1 then return false; end if;
    for tile in select x from pg_catalog.jsonb_array_elements(destination->'tiles') x loop
      if pg_catalog.jsonb_typeof(tile) <> 'object' or not (tile ?& array['id','title','body'])
        or tile - array['id','role','title','body']::text[] <> '{}'::jsonb
        or pg_catalog.jsonb_typeof(tile->'id') <> 'string' or tile->>'id' !~ '^[A-Za-z0-9_-]{1,80}$'
        or (tile ? 'role' and (pg_catalog.jsonb_typeof(tile->'role') <> 'string' or tile->>'role' not in ('overview','history')))
        or not private.valid_destination_locales(tile->'title',200)
        or not private.valid_destination_locales(tile->'body',6000) then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table private.destination_content (
  singleton boolean primary key default true check (singleton),
  manifest jsonb not null check (private.valid_destination_manifest(manifest)),
  revision bigint generated always as ((manifest->>'revision')::bigint) stored
);
alter table private.destination_content enable row level security;
alter table private.destination_content force row level security;
revoke all on private.destination_content from public, anon, authenticated;

create function private.destination_revision_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.manifest is distinct from old.manifest and (new.manifest->>'revision')::numeric <= old.revision then
    raise exception using errcode='22023', message='Content revision must increase';
  end if;
  return new;
end;
$$;
create trigger destination_revision_guard before update on private.destination_content
for each row execute function private.destination_revision_guard();

create function private.read_destination_content()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  return (select manifest from private.destination_content where singleton);
end;
$$;
create function public.get_destination_content()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.read_destination_content();
$$;
revoke all on function private.valid_destination_locales(jsonb,integer), private.valid_destination_manifest(jsonb),
  private.destination_revision_guard(), private.read_destination_content(), public.get_destination_content() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.read_destination_content(), public.get_destination_content() to authenticated;
-- Intentionally no seed. Actual editorial approval/publication is a separate owner operation.
