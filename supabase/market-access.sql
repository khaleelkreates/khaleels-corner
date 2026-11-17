-- Run once in the Invoreview SQL Editor. Existing Invoreview tables are untouched.
begin;
create table if not exists public.market_businesses (
  id uuid primary key default gen_random_uuid(),
  source_id text unique not null,
  name text not null,
  catalogue_limit integer not null default 5 check (catalogue_limit = 5)
);
create table if not exists public.market_accounts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  role text not null check (role in ('owner','manager','seller')),
  business_id uuid references public.market_businesses(id),
  code_hash text unique,
  active boolean not null default true,
  revision integer not null default 0,
  check ((role = 'seller') = (business_id is not null))
);
create table if not exists public.market_sessions (
  token_hash text primary key,
  account_id uuid not null references public.market_accounts(id) on delete cascade,
  account_revision integer not null,
  expires_at timestamptz not null default now() + interval '8 hours'
);
create unique index if not exists market_one_owner on public.market_accounts(role) where role='owner';
create table if not exists public.market_access_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.market_accounts(id),
  target_id uuid references public.market_accounts(id),
  event text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.market_access_attempts (
  bucket text primary key,
  attempts integer not null default 1,
  created_at timestamptz not null default now()
);
alter table public.market_businesses enable row level security;
alter table public.market_accounts enable row level security;
alter table public.market_sessions enable row level security;
alter table public.market_access_audit enable row level security;
alter table public.market_access_attempts enable row level security;
revoke all on public.market_businesses, public.market_accounts, public.market_sessions,
  public.market_access_audit, public.market_access_attempts from anon, authenticated;
grant all on public.market_businesses, public.market_accounts, public.market_sessions,
  public.market_access_audit, public.market_access_attempts to service_role;
grant usage on sequence public.market_access_audit_id_seq to service_role;

create or replace function public.market_allow_attempt(bucket_key text)
returns boolean language plpgsql set search_path = public as $$
declare total integer;
begin
  delete from market_access_attempts where created_at < now() - interval '1 day';
  delete from market_sessions where expires_at < now();
  insert into market_access_attempts(bucket) values(bucket_key)
    on conflict(bucket) do update set attempts = market_access_attempts.attempts + 1
    returning attempts into total;
  return total <= 10;
end;
$$;
create or replace function public.market_current_account(session_hash text)
returns table(id uuid,label text,role text,business_id uuid)
language sql stable set search_path = public as $$
  select a.id,a.label,a.role,a.business_id from market_accounts a
  join market_sessions s on s.account_id=a.id
  where s.token_hash=session_hash and s.expires_at>now()
    and s.account_revision=a.revision and a.active;
$$;
create or replace function public.market_login(access_hash text,session_hash text)
returns table(id uuid,label text,role text,business_id uuid)
language plpgsql set search_path = public as $$
declare account market_accounts;
begin
  select * into account from market_accounts a where a.code_hash=access_hash and a.active for update;
  if not found then return; end if;
  insert into market_sessions(token_hash,account_id,account_revision)
    values(session_hash,account.id,account.revision);
  return query select account.id,account.label,account.role,account.business_id;
end;
$$;
create or replace function public.market_rotate_access(actor_id uuid,target_id uuid,new_hash text)
returns void language plpgsql set search_path = public as $$
declare actor market_accounts; target market_accounts;
begin
  select * into actor from market_accounts a where a.id=actor_id and a.active;
  select * into target from market_accounts a where a.id=target_id for update;
  if actor.id is null or target.id is null or not
    (actor.role='owner' or (actor.role='manager' and target.role='seller')) then
    raise exception 'Permission denied';
  end if;
  update market_accounts set code_hash=new_hash,revision=revision+1 where id=target_id;
  delete from market_sessions where account_id=target_id;
  insert into market_access_audit(actor_id,target_id,event) values(actor_id,target_id,'code_reset');
end;
$$;
create or replace function public.market_create_account(actor_id uuid,account_label text,account_role text,shop_id uuid)
returns uuid language plpgsql set search_path = public as $$
declare result uuid;
begin
  if not exists(select 1 from market_accounts where id=actor_id and active and role='owner')
    or account_role not in ('seller','manager') then raise exception 'Permission denied'; end if;
  insert into market_accounts(label,role,business_id) values(account_label,account_role,shop_id) returning id into result;
  insert into market_access_audit(actor_id,target_id,event) values(actor_id,result,'account_created');
  return result;
end;
$$;
revoke all on function public.market_allow_attempt(text),
  public.market_current_account(text),public.market_login(text,text),
  public.market_rotate_access(uuid,uuid,text),public.market_create_account(uuid,text,text,uuid)
  from public,anon,authenticated;
grant execute on function public.market_allow_attempt(text),
  public.market_current_account(text),public.market_login(text,text),
  public.market_rotate_access(uuid,uuid,text),public.market_create_account(uuid,text,text,uuid)
  to service_role;
create or replace function public.market_set_active(actor_id uuid,target_id uuid,enabled boolean)
returns void language plpgsql set search_path = public as $$
begin
  if not exists(select 1 from market_accounts where id=actor_id and role='owner' and active)
    or not exists(select 1 from market_accounts where id=target_id and role<>'owner') then
    raise exception 'Permission denied';
  end if;
  update market_accounts set active=enabled,revision=revision+1 where id=target_id;
  delete from market_sessions where account_id=target_id;
  insert into market_access_audit(actor_id,target_id,event)
    values(actor_id,target_id,case when enabled then 'access_enabled' else 'access_disabled' end);
end;
$$;
revoke all on function public.market_set_active(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.market_set_active(uuid,uuid,boolean) to service_role;
commit;
