-- ===== schema.sql =====
-- Masterface production şeması
-- Herkese açık (public) içerik tabloları: SELECT serbest, yazma sadece
-- authenticated (Supabase Auth ile giriş yapmış admin) kullanıcıya açık.

create extension if not exists "pgcrypto";

-- ÇOK DİL: `i18n` sütunu çeviri tutar. Ana dil Türkçe (normal sütunlar);
-- örn. services.i18n = {"en":{"title":"…","description":"…"},"de":{…}}.
-- Boş bırakılan çeviri Türkçe metne düşer. Mevcut veritabanı için: supabase/migrate-i18n.sql
-- Site metinlerinde çeviri ayrı anahtardır: hero_title_en, hero_title_de …

-- ───────────────────────── categories ─────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  i18n        jsonb
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
  created_at    timestamptz not null default now(),
  i18n        jsonb
);

-- ───────────────────────── services ───────────────────────────
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  i18n        jsonb
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
  sort_order  int  not null default 0,
  i18n        jsonb
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
  sort_order  int  not null default 0,
  i18n        jsonb
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
  sort_order  int  not null default 0,
  i18n        jsonb
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

-- ===== storage.sql =====
-- Gorsel yukleme icin acik (public) "media" kovasi. Tekrar calistirilabilir.
-- Herkes gorselleri okuyabilir (site gosterir); yukleme/silme sadece giris yapmis admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 8388608;

drop policy if exists "media public read" on storage.objects;
drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
create policy "media public read"  on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ===== mail.sql =====
-- Masterface — "Teklif İste" e-posta bildirimi
-- Supabase > SQL Editor'de BİR KEZ çalıştırın.
-- Çalışma şekli: form_submissions'a yeni kayıt düşünce bu tetikleyici,
-- Resend API'sine (pg_net ile) istek atar; alıcılar admin > Ayarlar'daki
-- "form_recipients" listesinden okunur. Yeni adres eklemek için SQL gerekmez.
-- API anahtarı ve gönderen adres admin > Ayarlar'dan girilir (settings tablosu
-- sadece giriş yapmış admin tarafından okunabilir).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key   text;
  v_from  text;
  v_to    jsonb;
  v_text  text := '';
  v_html  text := '';
  k       text;
  v       text;
  v_reply text;
begin
  select value #>> '{}' into v_key  from settings where key = 'mail_api_key';
  select value #>> '{}' into v_from from settings where key = 'mail_from';
  select value          into v_to   from settings where key = 'form_recipients';

  if v_key is null or v_key = '' or v_to is null or jsonb_array_length(v_to) = 0 then
    return new;  -- yapılandırılmamış: sadece kaydet, mail atma
  end if;
  if v_from is null or v_from = '' then
    v_from := 'Masterface Web <onboarding@resend.dev>';
  end if;

  for k, v in select key, value #>> '{}' from jsonb_each(new.payload) loop
    v_text := v_text || k || ': ' || coalesce(v, '') || E'\n';
    v_html := v_html || '<p><b>' || replace(replace(replace(k,'&','&amp;'),'<','&lt;'),'>','&gt;')
                     || ':</b><br>' || replace(replace(replace(coalesce(v,''),'&','&amp;'),'<','&lt;'),'>','&gt;') || '</p>';
    if v_reply is null and lower(k) like '%mail%' and v like '%@%' then v_reply := v; end if;
  end loop;

  begin
    perform net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
      body    := jsonb_strip_nulls(jsonb_build_object(
                   'from', v_from,
                   'to', v_to,
                   'subject', 'Yeni teklif talebi — masterface.com.tr',
                   'text', v_text,
                   'html', v_html,
                   'reply_to', v_reply))
    );
  exception when others then
    null;  -- mail hatası form kaydını asla engellemesin
  end;
  return new;
end;
$$;

drop trigger if exists trg_notify_form_submission on public.form_submissions;
create trigger trg_notify_form_submission
  after insert on public.form_submissions
  for each row execute function public.notify_form_submission();

-- ===== seed.sql =====
-- Masterface seed: sitedeki mevcut icerik. Tablolari bosaltip yeniden doldurur.
begin;
delete from projects; delete from categories; delete from services; delete from logos; delete from stats;
delete from gallery_photos; delete from process_steps; delete from site_texts; delete from form_fields;
insert into site_texts (key, value) values
  ('hero_kicker', 'Etkinlik · Aktivasyon · Stand'),
  ('hero_title', 'Markaları deneyime dönüştürüyoruz'),
  ('hero_subtitle', 'Markaların hedef kitleleriyle buluştuğu her noktada yaratıcı fikirleri güçlü saha operasyonlarıyla hayata geçiriyoruz.'),
  ('about_title', 'Fikirleri hayata, markaları sahaya taşıyoruz!'),
  ('about_body_1', 'Markaları insanlarla buluşturan etkinlikler tasarlıyor, her fikri sahada özenle hayata geçiriyoruz. Planlamadan uygulamaya kadar tüm süreci üstleniyor; güçlü bir ekip, yaratıcı çözümler ve titiz koordinasyonla her detayın yerini bulmasını sağlıyoruz.'),
  ('about_body_2', 'Amacımız, markanızın hikâyesini insanların katıldığı, deneyimlediği ve hatırladığı anlara dönüştürmek. İşimizin merkezine açık iletişimi, güveni ve birlikte üretmeyi koyuyoruz.'),
  ('whatsapp_number', '905536872886'),
  ('contact_address', 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / İstanbul'),
  ('contact_phone_display', '0553 687 28 86'),
  ('contact_phone_tel', '+905536872886'),
  ('contact_email', 'info@masterface.com.tr'),
  ('contact_instagram_handle', '@masterfaceagency'),
  ('contact_instagram_url', 'https://www.instagram.com/masterfaceagency/'),
  ('contact_map_url', 'https://www.google.com/maps/place/Talatpa%C5%9Fa,+G%C3%B6k+Sk.,+34400+Ka%C4%9F%C4%B1thane%2F%C4%B0stanbul,+T%C3%BCrkiye/@41.064673,28.961802,15z/data=!4m6!3m5!1s0x14cab72fcbedce9f:0x307774bdc1c2f5fb!8m2!3d41.064673!4d28.961802!16s%2Fg%2F1tdlq_h0?hl=en-US&entry=ttu&g_ep=EgoyMDI2MTAxMi4wIKXMDSoASAFQAw%3D%3D'),
  ('footer_bottom', '© 2026 Masterface Etkinlik Ajansı. Tüm hakları saklıdır.'),
  ('hero_kicker_en', 'Events · Activation · Stands'),
  ('hero_kicker_de', 'Events · Aktivierung · Messestände'),
  ('hero_title_en', 'We turn brands into experiences'),
  ('hero_title_de', 'Wir verwandeln Marken in Erlebnisse'),
  ('hero_subtitle_en', 'At every point where brands meet their target audiences, we bring creative ideas to life through strong field operations.'),
  ('hero_subtitle_de', 'Überall dort, wo Marken auf ihre Zielgruppen treffen, setzen wir kreative Ideen mit starker Umsetzung vor Ort um.'),
  ('about_title_en', 'We bring ideas to life and brands to the field!'),
  ('about_title_de', 'Wir bringen Ideen zum Leben und Marken ins Feld!'),
  ('about_body_1_en', 'We design events that connect brands with people and carefully bring every idea to life on the ground. We take on the whole process from planning to execution; with a strong team, creative solutions and meticulous coordination, we make sure every detail falls into place.'),
  ('about_body_1_de', 'Wir gestalten Events, die Marken mit Menschen zusammenbringen, und setzen jede Idee vor Ort mit Sorgfalt um. Wir übernehmen den gesamten Prozess von der Planung bis zur Umsetzung; mit einem starken Team, kreativen Lösungen und sorgfältiger Koordination sorgen wir dafür, dass jedes Detail sitzt.'),
  ('about_body_2_en', 'Our goal is to turn your brand''s story into moments people take part in, experience and remember. At the heart of our work are open communication, trust and creating together.'),
  ('about_body_2_de', 'Unser Ziel ist es, die Geschichte Ihrer Marke in Momente zu verwandeln, an denen Menschen teilnehmen, die sie erleben und an die sie sich erinnern. Im Mittelpunkt unserer Arbeit stehen offene Kommunikation, Vertrauen und gemeinsames Schaffen.'),
  ('contact_address_en', 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / Istanbul'),
  ('contact_address_de', 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / Istanbul'),
  ('footer_bottom_en', '© 2026 Masterface Event Agency. All rights reserved.'),
  ('footer_bottom_de', '© 2026 Masterface Eventagentur. Alle Rechte vorbehalten.');
insert into logos (label, image_url, sort_order) values
  ('Yves Rocher', '/assets/logos/yves-rocher.webp', 1),
  ('Dydo', '/assets/logos/dydo.webp', 2),
  ('DAGİ', '/assets/logos/dagi.webp', 3),
  ('Migros', '/assets/logos/migros.webp', 4),
  ('Logo', '/assets/logos/logo.webp', 5),
  ('Saka', '/assets/logos/saka.webp', 6),
  ('One Kitchen', '/assets/logos/one-kitchen.webp', 7),
  ('TEI', '/assets/logos/tei.webp', 8),
  ('Dürümle', '/assets/logos/durumle.webp', 9),
  ('Pizza Express', '/assets/logos/pizza-express.webp', 10),
  ('Berqnet', '/assets/logos/berqnet.webp', 11),
  ('Axost Güvenlik', '/assets/logos/axost-guvenlik.webp', 12),
  ('DNSSense', '/assets/logos/dnssense.webp', 13),
  ('Privia Security', '/assets/logos/privia-security.webp', 14),
  ('Timus', '/assets/logos/timus.webp', 15),
  ('Terra Pizza', '/assets/logos/terra-pizza.webp', 16);
insert into stats (value, label, sort_order, i18n) values
  ('150+', 'Tamamlanan proje', 1, '{"en":{"label":"Completed projects"},"de":{"label":"Abgeschlossene Projekte"}}'::jsonb),
  ('17+', 'Birlikte çalışılan marka', 2, '{"en":{"label":"Brands we work with"},"de":{"label":"Betreute Marken"}}'::jsonb),
  ('60+', 'Saha operasyonu yapılan şehir', 3, '{"en":{"label":"Cities with field operations"},"de":{"label":"Städte mit Einsätzen vor Ort"}}'::jsonb),
  ('2018', 'Kuruluş yılı', 4, '{"en":{"label":"Year founded"},"de":{"label":"Gründungsjahr"}}'::jsonb);
insert into services (title, description, image_url, sort_order, i18n) values
  ('Festival ve Etkinlik Yönetimi', 'Markanızın yer almak istediği festival ve etkinliklerde; organizatör görüşmelerinden alan anlaşmalarına, sözleşme süreçlerinden stand kurulumu ve personel yönetimine kadar tüm süreci sizin için yönetiyoruz.', null, 1, '{"en":{"title":"Festival and Event Management","description":"We manage the entire process for the festivals and events your brand wants to be part of: from organizer negotiations and space agreements to contracts, stand setup and staff management."},"de":{"title":"Festival- und Eventmanagement","description":"Für die Festivals und Events, bei denen Ihre Marke präsent sein möchte, übernehmen wir den gesamten Prozess: von Gesprächen mit den Veranstaltern und Flächenvereinbarungen über Verträge bis zu Standaufbau und Personalmanagement."}}'::jsonb),
  ('Roadshow ve Mobil Etkinlikler', 'Markanızı farklı şehirlerde, meydanlarda ve yaşam alanlarında tüketicilerle buluşturuyoruz. Ürün tanıtımı, sampling ve yaratıcı saha aktiviteleriyle dikkat çeken, enerjisi yüksek ve akılda kalıcı etkinlikler gerçekleştiriyoruz.', null, 2, '{"en":{"title":"Roadshows and Mobile Events","description":"We bring your brand to consumers in different cities, squares and public spaces. With product launches, sampling and creative field activities, we deliver high-energy, memorable events that grab attention."},"de":{"title":"Roadshows und mobile Events","description":"Wir bringen Ihre Marke in verschiedenen Städten, auf Plätzen und in Lebensräumen zu den Konsumenten. Mit Produktpräsentationen, Sampling und kreativen Aktionen vor Ort realisieren wir aufmerksamkeitsstarke, energiegeladene und einprägsame Events."}}'::jsonb),
  ('Sampling ve Tadım Etkinlikleri', 'Markanızın ürünlerini doğru yerde, doğru zamanda, doğru hedef kitleyle buluşturuyoruz. Tadım aktiviteleri, ürün dağıtımları ve yaratıcı saha uygulamalarıyla tüketicilerin markanızı yakından tanımasını ve deneyimlemesini sağlıyoruz.', null, 3, '{"en":{"title":"Sampling and Tasting Events","description":"We connect your products with the right audience at the right place and time. Tasting activities, product distribution and creative field executions let consumers get to know and experience your brand up close."},"de":{"title":"Sampling und Verkostungen","description":"Wir bringen Ihre Produkte zur richtigen Zeit am richtigen Ort zur richtigen Zielgruppe. Mit Verkostungen, Produktverteilungen und kreativen Aktionen vor Ort erleben Konsumenten Ihre Marke hautnah."}}'::jsonb),
  ('Stand Tasarımı ve Üretimi', 'Markanızın kimliğini yansıtan, dikkat çekici ve işlevsel standlar tasarlıyor, üretiyor ve hayata geçiriyoruz. Fuar, festival ve etkinlik alanlarında tasarımdan üretime, kurulumdan söküme kadar tüm süreci yönetiyoruz.', null, 4, '{"en":{"title":"Stand Design and Production","description":"We design, produce and realize eye-catching, functional stands that reflect your brand identity. At trade fairs, festivals and event venues we manage everything from design to production, installation to dismantling."},"de":{"title":"Standdesign und Standbau","description":"Wir entwerfen, produzieren und realisieren auffällige, funktionale Stände, die Ihre Markenidentität widerspiegeln. Auf Messen, Festivals und Eventflächen betreuen wir alles von Design und Produktion bis zu Aufbau und Abbau."}}'::jsonb),
  ('Kurumsal Etkinlikler ve Organizasyonlar', 'Şirket içi kutlamalardan yılbaşı partilerine, motivasyon etkinliklerinden özel davetlere kadar her anı unutulmaz bir deneyime dönüştürüyoruz. Çalışanları bir araya getiren, eğlenceyi ve ekip ruhunu ön plana çıkaran organizasyonlar tasarlıyoruz.', null, 5, '{"en":{"title":"Corporate Events and Organizations","description":"From in-house celebrations to New Year''s parties, from motivation events to private invitations, we turn every moment into an unforgettable experience. We design events that bring employees together and put fun and team spirit first."},"de":{"title":"Firmenevents und Organisation","description":"Von internen Feiern über Silvesterpartys bis zu Motivationsevents und privaten Einladungen verwandeln wir jeden Moment in ein unvergessliches Erlebnis. Wir gestalten Veranstaltungen, die Mitarbeitende zusammenbringen und Spaß sowie Teamgeist in den Mittelpunkt stellen."}}'::jsonb),
  ('Üniversite Şenlikleri ve Kariyer Günleri', 'Markanızı kampüslerin enerjisiyle buluşturuyoruz! Üniversite şenliklerinden kariyer günlerine, marka tanıtımlarından eğlenceli deneyim alanlarına kadar gençlerle doğrudan iletişim kurmanızı sağlayan etkinlikleri planlıyor ve hayata geçiriyoruz.', null, 6, '{"en":{"title":"University Festivals and Career Days","description":"We bring your brand together with the energy of campuses! From university festivals to career days, from brand presentations to fun experience areas, we plan and run events that let you communicate directly with young people."},"de":{"title":"Uni-Festivals und Karrieretage","description":"Wir bringen Ihre Marke mit der Energie der Campus zusammen! Von Uni-Festivals über Karrieretage und Markenpräsentationen bis zu spaßigen Erlebnisflächen planen und realisieren wir Events, mit denen Sie direkt mit jungen Menschen in Kontakt treten."}}'::jsonb),
  ('Toplantı ve Organizasyon Yönetimi', 'Bayi toplantılarından lansmanlara, şirket buluşmalarından özel davetlere kadar tüm organizasyonlarınızı profesyonelce planlıyoruz. Mekân seçiminden teknik altyapıya, sahne ve dekorasyondan operasyon yönetimine kadar her detayı sizin için düşünüyoruz.', null, 7, '{"en":{"title":"Meeting and Event Management","description":"From dealer meetings to launches, company gatherings to private invitations, we plan all your events professionally. From venue selection to technical infrastructure, stage and decoration to operations management, we think of every detail for you."},"de":{"title":"Meeting- und Eventmanagement","description":"Von Händlertreffen über Produktlaunches und Firmentreffen bis zu privaten Einladungen planen wir all Ihre Veranstaltungen professionell. Von der Locationwahl über Technik und Bühne bis zu Dekoration und Operations kümmern wir uns um jedes Detail."}}'::jsonb);
insert into process_steps (title, description, sort_order, i18n) values
  ('Keşif ve brief', 'Markanızı, hedeflerinizi ve kitlenizi dinliyoruz. İhtiyaçlarınızı netleştirerek projenin yol haritasını birlikte oluşturuyoruz.', 1, '{"en":{"title":"Discovery and brief","description":"We listen to your brand, goals and audience. We clarify your needs and build the project roadmap together."},"de":{"title":"Kennenlernen und Briefing","description":"Wir hören Ihnen zu: Marke, Ziele und Zielgruppe. Wir schärfen Ihre Anforderungen und erarbeiten gemeinsam den Fahrplan des Projekts."}}'::jsonb),
  ('Konsept ve planlama', 'Hedeflerinize uygun yaratıcı bir konsept geliştiriyoruz. Mekân, ekip, bütçe ve takvimi tüm detaylarıyla planlıyoruz.', 2, '{"en":{"title":"Concept and planning","description":"We develop a creative concept that fits your goals. We plan venue, team, budget and schedule in full detail."},"de":{"title":"Konzept und Planung","description":"Wir entwickeln ein kreatives Konzept, das zu Ihren Zielen passt. Location, Team, Budget und Zeitplan planen wir bis ins Detail."}}'::jsonb),
  ('Saha operasyonu ve raporlama', 'Sahadaki tüm süreci koordine ediyor, planı hayata geçiriyoruz. Etkinlik sonunda sonuçları ve değerlendirmelerimizi sizinle paylaşıyoruz.', 3, '{"en":{"title":"Field operations and reporting","description":"We coordinate the entire process on site and bring the plan to life. After the event we share the results and our evaluations with you."},"de":{"title":"Umsetzung vor Ort und Reporting","description":"Wir koordinieren den gesamten Ablauf vor Ort und setzen den Plan um. Nach dem Event teilen wir Ergebnisse und Auswertungen mit Ihnen."}}'::jsonb);
insert into gallery_photos (image_url, sort_order) values
  ('/assets/gallery/gallery-01.jpg', 1),
  ('/assets/gallery/gallery-02.jpg', 2),
  ('/assets/gallery/gallery-03.jpg', 3),
  ('/assets/gallery/gallery-04.jpg', 4),
  ('/assets/gallery/gallery-05.jpg', 5),
  ('/assets/gallery/gallery-06.jpg', 6),
  ('/assets/gallery/gallery-07.jpg', 7),
  ('/assets/gallery/gallery-08.jpg', 8),
  ('/assets/gallery/gallery-09.jpg', 9),
  ('/assets/gallery/gallery-10.jpg', 10),
  ('/assets/gallery/gallery-11.jpg', 11),
  ('/assets/gallery/gallery-12.jpg', 12),
  ('/assets/gallery/gallery-13.jpg', 13),
  ('/assets/gallery/gallery-14.jpg', 14),
  ('/assets/gallery/gallery-15.jpg', 15),
  ('/assets/gallery/gallery-16.jpg', 16),
  ('/assets/gallery/gallery-17.jpg', 17),
  ('/assets/gallery/gallery-18.jpg', 18),
  ('/assets/gallery/gallery-19.jpg', 19),
  ('/assets/gallery/gallery-20.jpg', 20),
  ('/assets/gallery/gallery-21.jpg', 21),
  ('/assets/gallery/gallery-22.jpg', 22),
  ('/assets/gallery/gallery-23.jpg', 23),
  ('/assets/gallery/gallery-24.jpg', 24),
  ('/assets/gallery/gallery-25.jpg', 25),
  ('/assets/gallery/gallery-26.jpg', 26),
  ('/assets/gallery/gallery-27.jpg', 27),
  ('/assets/gallery/gallery-28.jpg', 28),
  ('/assets/gallery/gallery-29.jpg', 29),
  ('/assets/gallery/gallery-30.jpg', 30),
  ('/assets/gallery/gallery-31.jpg', 31),
  ('/assets/gallery/gallery-32.jpg', 32),
  ('/assets/gallery/gallery-33.jpg', 33),
  ('/assets/gallery/gallery-34.jpg', 34),
  ('/assets/gallery/gallery-35.jpg', 35),
  ('/assets/gallery/gallery-36.jpg', 36),
  ('/assets/gallery/gallery-37.jpg', 37),
  ('/assets/gallery/gallery-38.jpg', 38),
  ('/assets/gallery/gallery-39.jpg', 39),
  ('/assets/gallery/gallery-40.jpg', 40),
  ('/assets/gallery/gallery-41.jpg', 41),
  ('/assets/gallery/gallery-42.jpg', 42),
  ('/assets/gallery/gallery-43.jpg', 43),
  ('/assets/gallery/gallery-44.jpg', 44),
  ('/assets/gallery/gallery-45.jpg', 45),
  ('/assets/gallery/gallery-46.jpg', 46);
insert into projects (name, brand, city, year, youtube_id, sort_order, i18n) values
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'gvm6JGzLG2M', 1, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', '2rlN-i-ts2g', 2, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'w_sGq5_zeI8', 3, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'aQkfNgB5ZPg', 4, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'HCjoKcrBuXo', 5, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'nuOHaFKKMI4', 6, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'Ji5Fh_YlIGs', 7, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'ZbptAG-sf7c', 8, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', '3A6C587v42o', 9, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'cBD6wzq2nB4', 10, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'uvXkcouXBbE', 11, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb),
  ('[Proje adı]', '[Marka]', '[Şehir]', '[Yıl]', 'SSytzQygDXc', 12, '{"en":{"name":"[Project name]","brand":"[Brand]","city":"[City]","year":"[Year]"},"de":{"name":"[Projektname]","brand":"[Marke]","city":"[Stadt]","year":"[Jahr]"}}'::jsonb);
insert into form_fields (id, label, type, required, width, options, sort_order, i18n) values
  ('name', 'Adınız', 'text', true, 'half', null, 1, '{"en":{"label":"Your name"},"de":{"label":"Ihr Name"}}'::jsonb),
  ('email', 'E-posta', 'email', true, 'half', null, 2, '{"en":{"label":"Email"},"de":{"label":"E-Mail"}}'::jsonb),
  ('phone', 'Telefon', 'phone', false, 'half', null, 3, '{"en":{"label":"Phone"},"de":{"label":"Telefon"}}'::jsonb),
  ('eventType', 'Etkinlik türü', 'select', true, 'half', null, 4, '{"en":{"label":"Event type"},"de":{"label":"Veranstaltungsart"}}'::jsonb),
  ('eventDate', 'Etkinlik tarihi', 'daterange', false, 'full', null, 5, '{"en":{"label":"Event date"},"de":{"label":"Veranstaltungsdatum"}}'::jsonb),
  ('message', 'Mesajınız', 'textarea', false, 'full', null, 6, '{"en":{"label":"Your message"},"de":{"label":"Ihre Nachricht"}}'::jsonb);
insert into settings (key, value) values ('form_recipients', '["info@masterface.com.tr"]'::jsonb) on conflict (key) do nothing;
commit;

