create table if not exists public.chart_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  snapshot jsonb not null,
  snapshot_hash text not null,
  source text not null default 'manual',
  source_updated_at timestamptz,
  archived_at timestamptz not null default now()
);

create unique index if not exists chart_archives_user_snapshot_hash_key
  on public.chart_archives(user_id, snapshot_hash);

create index if not exists chart_archives_user_archived_at_idx
  on public.chart_archives(user_id, archived_at desc);

alter table public.chart_archives enable row level security;

drop policy if exists "Users can read their chart archives" on public.chart_archives;
create policy "Users can read their chart archives"
  on public.chart_archives for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their chart archives" on public.chart_archives;
create policy "Users can create their chart archives"
  on public.chart_archives for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their chart archives" on public.chart_archives;
create policy "Users can update their chart archives"
  on public.chart_archives for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their chart archives" on public.chart_archives;
create policy "Users can delete their chart archives"
  on public.chart_archives for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.chart_archives to authenticated;
