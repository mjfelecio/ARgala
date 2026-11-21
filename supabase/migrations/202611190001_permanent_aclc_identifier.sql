-- Accept D10 without dropping legacy pilot records or changing the wire format.
create or replace function private.valid_travel_journal(value jsonb)
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
  if pg_catalog.jsonb_array_length(value->'bookmarks') > 1000 or pg_catalog.jsonb_array_length(value->'stamps') > 11 then return false; end if;
  for item in select x from pg_catalog.jsonb_array_elements(value->'bookmarks') x loop
    if pg_catalog.jsonb_typeof(item) <> 'object' or not (item ?& array['kind','id'])
      or item - array['kind','id']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(item->'kind') <> 'string' or pg_catalog.jsonb_typeof(item->'id') <> 'string' then return false; end if;
    if item->>'kind' = 'google' then
      if pg_catalog.length(item->>'id') not between 1 and 4096 or item->>'id' !~ '^[A-Za-z0-9_-]+$' then return false; end if;
    elsif item->>'kind' = 'featured' then
      if item->>'id' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','pilot-aclc']) then return false; end if;
    else return false; end if;
  end loop;
  if (select count(*) from pg_catalog.jsonb_array_elements(value->'bookmarks')) <>
    (select count(distinct (x->>'kind',x->>'id')) from pg_catalog.jsonb_array_elements(value->'bookmarks') x) then return false; end if;
  for item in select x from pg_catalog.jsonb_array_elements(value->'stamps') x loop
    if pg_catalog.jsonb_typeof(item) <> 'object' or not (item ?& array['destinationId','visitedAt'])
      or item - array['destinationId','visitedAt']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(item->'destinationId') <> 'string'
      or item->>'destinationId' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','pilot-aclc'])
      or pg_catalog.jsonb_typeof(item->'visitedAt') <> 'number' then return false; end if;
    stamp := (item->>'visitedAt')::numeric;
    if stamp < 1 or stamp > 9007199254740991 or stamp <> pg_catalog.trunc(stamp) then return false; end if;
  end loop;
  return (select count(*) from pg_catalog.jsonb_array_elements(value->'stamps')) =
    (select count(distinct x->>'destinationId') from pg_catalog.jsonb_array_elements(value->'stamps') x);
exception when others then return false;
end;
$$;

create or replace function private.valid_destination_manifest(value jsonb)
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
    or pg_catalog.jsonb_array_length(value->'destinations') > 11 then return false; end if;
  if (select count(*) <> count(distinct x->>'id') from pg_catalog.jsonb_array_elements(value->'destinations') x) then return false; end if;
  for destination in select x from pg_catalog.jsonb_array_elements(value->'destinations') x loop
    if pg_catalog.jsonb_typeof(destination) <> 'object' or not (destination ?& array['id','contentVersion','tiles'])
      or destination - array['id','contentVersion','tiles']::text[] <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(destination->'id') <> 'string'
      or destination->>'id' <> all(array['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','pilot-aclc'])
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
