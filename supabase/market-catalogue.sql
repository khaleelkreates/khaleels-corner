begin;
alter table public.market_businesses add column if not exists profile jsonb not null default '{}';
alter table public.market_businesses add column if not exists items jsonb not null default '[]';
alter table public.market_businesses add column if not exists published_profile jsonb;
alter table public.market_businesses add column if not exists published_items jsonb;
alter table public.market_businesses add column if not exists version integer not null default 0;
create table if not exists public.market_media (
  id uuid primary key,
  business_id uuid not null references public.market_businesses(id),
  path text unique not null,
  bytes integer not null check(bytes between 1 and 409600),
  state text not null default 'pending' check(state in ('pending','ready','deleting')),
  created_at timestamptz not null default now()
);
alter table public.market_media enable row level security;
revoke all on public.market_media from anon,authenticated;
grant all on public.market_media to service_role;

create or replace function public.market_check_editor(session_hash text,shop_id uuid)
returns void language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from market_current_account(session_hash) a
    where a.role='owner' or (a.role='seller' and a.business_id=shop_id)) then
    raise exception 'Editor access required' using errcode='42501';
  end if;
end;
$$;

create or replace function public.market_reserve_image(session_hash text,shop_id uuid,image_id uuid,image_bytes integer)
returns setof public.market_media language plpgsql set search_path=public as $$
declare previous market_media;
begin
  perform market_check_editor(session_hash,shop_id);
  perform 1 from market_businesses where id=shop_id for update;
  if not found then raise exception 'Business unavailable'; end if;
  select * into previous from market_media where id=image_id;
  if found then
    if previous.business_id<>shop_id or previous.bytes<>image_bytes or previous.state='deleting' then
      raise exception 'Upload conflict' using errcode='40001';
    end if;
    return query select * from market_media where id=image_id;
    return;
  end if;
  if image_bytes<1 or image_bytes>409600 then raise exception 'Photo exceeds 400 KB'; end if;
  if (select count(*) from market_media where business_id=shop_id)>=24
    or (select coalesce(sum(bytes),0) from market_media where business_id=shop_id)+image_bytes>10485760 then
    raise exception 'Shop image allowance reached';
  end if;
  insert into market_media(id,business_id,path,bytes)
    values(image_id,shop_id,shop_id::text||'/'||image_id::text||'.webp',image_bytes);
  return query select * from market_media where id=image_id;
end;
$$;

create or replace function public.market_finish_image(session_hash text,shop_id uuid,image_id uuid)
returns void language plpgsql set search_path=public as $$
begin
  perform market_check_editor(session_hash,shop_id);
  perform 1 from market_businesses where id=shop_id for update;
  update market_media set state='ready' where id=image_id and business_id=shop_id and state='pending';
end;
$$;

create or replace function public.market_save_catalogue(
 session_hash text,shop_id uuid,shop_profile jsonb,shop_items jsonb,expected_version integer,make_public boolean)
returns integer language plpgsql set search_path=public as $$
declare shop market_businesses; item jsonb; image text; next_version integer; images jsonb;
begin
  perform market_check_editor(session_hash,shop_id);
  select * into shop from market_businesses where id=shop_id for update;
  if not found then raise exception 'Business unavailable'; end if;
  if shop.version<>expected_version then raise exception 'A newer edit exists. Reload before saving.' using errcode='40001'; end if;
  if jsonb_typeof(shop_items)<>'array' or jsonb_array_length(shop_items)>5 then raise exception 'Maximum five catalogue items'; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(shop_items))<>jsonb_array_length(shop_items)
    then raise exception 'Duplicate catalogue item'; end if;
  images=jsonb_build_array(shop_profile->>'logo',shop_profile->>'flyer');
  for item in select value from jsonb_array_elements(shop_items) loop
    if jsonb_typeof(item->'photos')<>'array' or jsonb_array_length(item->'photos')>2
      then raise exception 'Maximum two photos per item'; end if;
    images=images||(item->'photos');
  end loop;
  for image in select value from jsonb_array_elements_text(images) loop
    if image is not null and not exists(
      select 1 from market_media where id::text=image and business_id=shop_id and state='ready')
      then raise exception 'Photo is not available for this shop'; end if;
  end loop;
  -- Imported flyer URLs are preserved from the server-side migration.
  shop_profile=jsonb_set(shop_profile,'{legacyGallery}',coalesce(shop.profile->'legacyGallery','[]'));
  next_version=shop.version+1;
  update market_businesses set profile=shop_profile,items=shop_items,version=next_version,
    name=shop_profile->>'name',
    published_profile=case when make_public then shop_profile else published_profile end,
    published_items=case when make_public then shop_items else published_items end
    where id=shop_id;
  return next_version;
end;
$$;

create or replace function public.market_claim_unused_images(session_hash text,shop_id uuid,discard_id uuid default null)
returns setof public.market_media language plpgsql set search_path=public as $$
declare shop market_businesses;
begin
  perform market_check_editor(session_hash,shop_id);
  select * into shop from market_businesses where id=shop_id for update;
  return query update market_media m set state='deleting'
    where m.business_id=shop_id
      and (m.id=discard_id or m.created_at<now()-interval '1 day' or m.state='deleting')
      and position(m.id::text in (shop.profile::text||shop.items::text||
        coalesce(shop.published_profile::text,'')||coalesce(shop.published_items::text,'')))=0
    returning m.*;
end;
$$;
revoke all on function public.market_check_editor(text,uuid),
 public.market_reserve_image(text,uuid,uuid,integer),public.market_finish_image(text,uuid,uuid),
 public.market_save_catalogue(text,uuid,jsonb,jsonb,integer,boolean),
 public.market_claim_unused_images(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.market_check_editor(text,uuid),
 public.market_reserve_image(text,uuid,uuid,integer),public.market_finish_image(text,uuid,uuid),
 public.market_save_catalogue(text,uuid,jsonb,jsonb,integer,boolean),
 public.market_claim_unused_images(text,uuid,uuid) to service_role;
commit;
