-- Masterface production şeması
-- Herkese açık (public) içerik tabloları: SELECT serbest, yazma sadece
-- authenticated (Supabase Auth ile giriş yapmış admin) kullanıcıya açık.

create extension if not exists "pgcrypto";

-- ───────────────────────── categories ─────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── projects ───────────────────────────
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  city          text,
  year          text,
  category_id   uuid references categories(id) on delete set null,
  youtube_id    text,            -- video kimliği (thumb + link otomatik türer)
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);

-- ───────────────────────── services ───────────────────────────
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── logos (referanslar) ─────────────────
create table if not exists logos (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  image_url   text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── stats (rakamlar) ────────────────────
create table if not exists stats (
  id          uuid primary key default gen_random_uuid(),
  value       text not null,
  label       text not null,
  sort_order  int  not null default 0
);

-- ───────────────────────── gallery (hakkımızda slider) ─────────
create table if not exists gallery_photos (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  sort_order  int  not null default 0
);

-- ───────────────────────── process_steps (süreç) ───────────────
create table if not exists process_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  sort_order  int  not null default 0
);

-- ───────────────────────── site_texts (düz metin alanları) ─────
-- key/value: hero_title, hero_subtitle, about_title, about_body_1,
-- about_body_2, whatsapp_number, contact_address, contact_phone,
-- contact_email, contact_instagram, footer_company_name vb.
create table if not exists site_texts (
  key         text primary key,
  value       text not null default ''
);

-- ───────────────────────── form_fields (iletişim formu) ────────
create table if not exists form_fields (
  id          text primary key,         -- 'name', 'email', 'eventDate' ...
  label       text not null,
  type        text not null,            -- text | email | phone | select | textarea | daterange
  required    boolean not null default false,
  width       text not null default 'half', -- half | full
  options     jsonb,                    -- select tipi için seçenekler
  sort_order  int  not null default 0
);

-- ───────────────────────── social_links (footer sosyal medya) ───
create table if not exists social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,  -- instagram | linkedin | facebook | youtube | tiktok | x
  url         text not null,
  sort_order  int  not null default 0
);

-- ───────────────────────── settings (tekil ayarlar) ─────────────
-- form_recipients: jsonb string[] — "Teklif İste" bildirimi kime gitsin
create table if not exists settings (
  key   text primary key,
  value jsonb not null
);

-- ───────────────────────── form_submissions (gelen talepler) ───
create table if not exists form_submissions (
  id          uuid primary key default gen_random_uuid(),
  payload     jsonb not null,
  created_at  timestamptz not null default now(),
  notified    boolean not null default false
);

-- ═══════════════════════ Row Level Security ════════════════════
alter table categories      enable row level security;
alter table projects        enable row level security;
alter table services        enable row level security;
alter table logos           enable row level security;
alter table stats           enable row level security;
alter table gallery_photos  enable row level security;
alter table process_steps   enable row level security;
alter table site_texts      enable row level security;
alter table form_fields     enable row level security;
alter table social_links    enable row level security;
alter table settings        enable row level security;
alter table form_submissions enable row level security;

-- Herkes (anon) okuyabilir
create policy "public read" on categories      for select using (true);
create policy "public read" on projects        for select using (true);
create policy "public read" on services        for select using (true);
create policy "public read" on logos           for select using (true);
create policy "public read" on stats           for select using (true);
create policy "public read" on gallery_photos  for select using (true);
create policy "public read" on process_steps   for select using (true);
create policy "public read" on site_texts      for select using (true);
create policy "public read" on form_fields     for select using (true);
create policy "public read" on social_links    for select using (true);
-- settings tablosu form_recipients gibi hassas alanlar içerebileceğinden
-- genel okunabilir DEĞİL; sadece admin (authenticated) okur/yazar.

-- Sadece giriş yapmış (authenticated = admin) kullanıcı yazabilir
create policy "admin write" on categories      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on projects        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on services        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on logos           for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on stats           for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on gallery_photos  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on process_steps   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on site_texts      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on form_fields     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on social_links    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all"   on settings        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Form gönderimi: herkes INSERT edebilir (ziyaretçi formu dolduruyor),
-- ama sadece admin okuyabilir/silebilir.
create policy "public insert" on form_submissions for insert with check (true);
create policy "admin read"    on form_submissions for select using (auth.role() = 'authenticated');
create policy "admin delete"  on form_submissions for delete using (auth.role() = 'authenticated');
