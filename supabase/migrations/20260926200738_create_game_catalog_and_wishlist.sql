-- ============================================================
-- games: conceptual title-level catalog entry (no platform/edition here)
-- ============================================================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artwork_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Any authenticated user can read the catalog"
  on public.games for select
  to authenticated
  using (true);

-- No insert/update/delete policy: only the admin (service-role) client
-- can write here, since this is shared catalog data, not user-owned data.

create trigger set_games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ============================================================
-- game_provider_mapping: the actual trackable store product/SKU
-- ============================================================
create table public.game_provider_mapping (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  provider text not null default 'mock',
  provider_product_id text not null,
  platform text not null,
  edition text,
  region text not null default 'IN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_product_id, region)
);

create index idx_game_provider_mapping_game_id
  on public.game_provider_mapping (game_id);

alter table public.game_provider_mapping enable row level security;

create policy "Any authenticated user can read provider mappings"
  on public.game_provider_mapping for select
  to authenticated
  using (true);

-- No insert/update/delete policy here either — same reasoning as `games`.

create trigger set_game_provider_mapping_updated_at
  before update on public.game_provider_mapping
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_wishlist: per-user tracked store products + optional custom target
-- ============================================================
create table public.user_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_provider_mapping_id uuid not null references public.game_provider_mapping (id) on delete cascade,
  custom_target_price numeric(10, 2)
    check (custom_target_price is null or custom_target_price >= 0),
  added_at timestamptz not null default now(),
  unique (user_id, game_provider_mapping_id)
);

create index idx_user_wishlist_user_id
  on public.user_wishlist (user_id);

alter table public.user_wishlist enable row level security;

create policy "Users can view own wishlist"
  on public.user_wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own wishlist rows"
  on public.user_wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wishlist rows"
  on public.user_wishlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own wishlist rows"
  on public.user_wishlist for delete
  using (auth.uid() = user_id);