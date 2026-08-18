-- Paquete de besos ilimitados — schema de Supabase
-- Ejecutar completo en el SQL Editor de un proyecto nuevo de Supabase

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  wattpad_username text unique not null,
  created_at timestamptz default now()
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  stop_type text not null check (stop_type in ('puerto', 'evento')),
  tag text,
  title text not null,
  card_number integer,
  character_name text,
  card_image_url text,
  content_markdown text,
  is_active boolean default true,
  sort_order integer,
  created_at timestamptz default now()
);

create table achievement_links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  achievement_id uuid references achievements on delete cascade,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  achievement_id uuid references achievements on delete cascade,
  link_code text,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

alter table users enable row level security;
alter table achievements enable row level security;
alter table achievement_links enable row level security;
alter table user_achievements enable row level security;

create policy "public select active achievements" on achievements
  for select using (is_active = true);
create policy "admin select all achievements" on achievements
  for select using (true);
create policy "admin insert achievements" on achievements
  for insert with check (true);
create policy "admin update achievements" on achievements
  for update using (true);
create policy "admin delete achievements" on achievements
  for delete using (true);

create policy "public select active links" on achievement_links
  for select using (is_active = true);
create policy "admin select all links" on achievement_links
  for select using (true);
create policy "admin insert links" on achievement_links
  for insert with check (true);
create policy "admin update links" on achievement_links
  for update using (true);

create policy "open insert users" on users
  for insert with check (true);
create policy "open select users" on users
  for select using (true);

create policy "open insert user_achievements" on user_achievements
  for insert with check (true);
create policy "open select user_achievements" on user_achievements
  for select using (true);

-- Bucket de storage para las imágenes (crear también desde el dashboard de Storage,
-- o dejar que este insert lo cree si tu plan lo permite)
insert into storage.buckets (id, name, public)
values ('achievement-images', 'achievement-images', true)
on conflict (id) do nothing;

create policy "public read achievement-images" on storage.objects
  for select using (bucket_id = 'achievement-images');
create policy "open insert achievement-images" on storage.objects
  for insert with check (bucket_id = 'achievement-images');
