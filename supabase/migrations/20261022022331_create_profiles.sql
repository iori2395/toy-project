-- One profile row per auth user, readable and editable only by its owner.
create table public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  primary key (id)
);

alter table public.profiles enable row level security;

-- New tables are no longer exposed to the Data API automatically, and older
-- projects may still apply broad default grants. Reset and grant only what
-- the app needs: owners read their row and change display_name only.
revoke all on table public.profiles from anon, authenticated;
grant select, update (display_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create the profile row whenever Supabase Auth creates a user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

-- Only the trigger should run this; keep it off the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
