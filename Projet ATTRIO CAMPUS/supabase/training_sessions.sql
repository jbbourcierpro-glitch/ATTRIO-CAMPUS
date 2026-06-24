create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_entry_id text not null,
  saved_at timestamptz not null default timezone('utc'::text, now()),
  scenario_id text not null,
  scenario_title text not null,
  persona_name text not null,
  persona_title text not null default '',
  training_path_id text not null default '',
  training_path_title text not null default '',
  difficulty text not null default '',
  score integer not null default 0,
  max_score integer not null default 80,
  percentage integer not null default 0,
  process_percentage integer not null default 0,
  expression_percentage integer not null default 0,
  grade text not null default '',
  attempts integer not null default 0,
  help_requests_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint training_sessions_user_entry_unique unique (user_id, client_entry_id)
);

create index if not exists training_sessions_user_saved_at_idx
  on public.training_sessions (user_id, saved_at desc);

create or replace function public.set_training_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_training_sessions_updated_at on public.training_sessions;

create trigger set_training_sessions_updated_at
before update on public.training_sessions
for each row
execute function public.set_training_sessions_updated_at();

alter table public.training_sessions enable row level security;

drop policy if exists "Users can read their training sessions" on public.training_sessions;
create policy "Users can read their training sessions"
on public.training_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their training sessions" on public.training_sessions;
create policy "Users can insert their training sessions"
on public.training_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their training sessions" on public.training_sessions;
create policy "Users can update their training sessions"
on public.training_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their training sessions" on public.training_sessions;
create policy "Users can delete their training sessions"
on public.training_sessions
for delete
to authenticated
using (auth.uid() = user_id);
