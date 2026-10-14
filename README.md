# Masterface — Website

Masterface etkinlik ajansı için statik frontend + Supabase backend + yönetim paneli.

## Yapı

```
index.html              → Ana sayfa (tüm içerik Supabase'den çekilir, yoksa varsayılan içerikle çalışır)
admin/index.html         → Yönetim paneli (/admin) — Supabase Auth ile giriş
assets/css/style.css     → Ana sayfa stilleri
assets/js/config.js       → Supabase bağlantı bilgileri (URL + anon key)
assets/js/app.js          → Ana sayfa veri çekme + render mantığı
admin/js/admin.js         → Panel CRUD mantığı
supabase/schema.sql        → Veritabanı şeması + RLS politikaları
assets/video, assets/gallery, assets/logos, assets/logo.svg → Gerçek medya varlıkları
```

## Kurulum

### 1) Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde projeyi açın (proje zaten oluşturuldu).
2. **SQL Editor** üzerinden `supabase/schema.sql` dosyasının tamamını çalıştırın. Bu, tüm tabloları ve RLS (satır bazlı güvenlik) politikalarını oluşturur.
   Ardından `supabase/seed.sql` dosyasını çalıştırarak sitedeki mevcut içeriği tablolara aktarın (panelde düzenlenebilir hale gelir). Bu dosya `node supabase/gen-seed.js > supabase/seed.sql` ile `app.js` içindeki varsayılan içerikten üretilir; tabloları boşaltıp yeniden doldurur, dolu bir veritabanında çalıştırmayın.
3. **Authentication → Users → Add user → Create new user** ile panel için bir admin kullanıcı oluşturun (**Auto Confirm User** kutusunu işaretleyin). Panel girişi *kullanıcı adı + şifre* ile yapılır; Supabase e-posta biçimi istediği için e-posta alanına `kullaniciadi@masterface.com.tr` yazın (alan adı `assets/js/config.js` içindeki `ADMIN_EMAIL_DOMAIN` ile aynı olmalı). Örn. `admin@masterface.com.tr` oluşturduysanız giriş ekranına sadece `admin` yazarsınız. Bu adrese gerçek bir posta kutusu gerekmez.
4. **Project Settings → API** sayfasından **anon / public** anahtarı kopyalayın.
5. `assets/js/config.js` içindeki `SUPABASE_ANON_KEY` değerini bu anahtarla değiştirin. (`SUPABASE_URL` zaten proje adresinize göre ayarlı.)

> `anon` anahtarı herkese açık olacak şekilde tasarlanmıştır (RLS kuralları korur). **`service_role` anahtarını hiçbir zaman** istemci tarafı kodda kullanmayın.

### 2) İçerik girişi

`/admin` adresine gidip adım 3'te oluşturduğunuz hesapla giriş yapın. Tüm bölümler (Site Metinleri, Projeler, Hizmetler, Logolar, Rakamlar, Galeri, Süreç, İletişim Formu Alanları, Ayarlar) buradan yönetilir.

Supabase tabloları boşken site, bu depodaki varsayılan (demo) içerikle görüntülenir — panelden ilk veriler girildiği anda otomatik olarak gerçek veriye geçer.

### 3) Yayınlama (Cloudflare Pages)

Bu depo doğrudan statik dosyalardan oluşur (build adımı yoktur):

- **Framework preset:** None
- **Build command:** (boş bırakın)
- **Build output directory:** `/`

GitHub reposunu Cloudflare Pages'e bağladıktan sonra her `main` dalına yapılan push otomatik olarak yeniden yayınlanır.

### 4) Kendi hosting ve alan adına taşıma (canlı test sonrası)

Site tamamen statik olduğu için herhangi bir hostinge (cPanel, Plesk, FTP, Netlify vb.) yüklenebilir — sunucuda PHP/Node gerekmez:

1. Depodaki dosyaları (`index.html`, `admin/`, `assets/`) hostingin web kök klasörüne (`public_html`) yükleyin. `supabase/` klasörü ve `README.md` yüklenmek zorunda değildir.
2. Site alan adının **kökünde** (`masterface.com.tr/`) çalışmalıdır; görsel yolları `/assets/...` biçimindedir, alt klasöre kurulursa görseller kırılır.
3. Veritabanı/panel Supabase'de kaldığı için taşınacak bir veri yoktur; `assets/js/config.js` içindeki `SUPABASE_URL` ve anahtar aynı kalır. Panel yeni alan adında `masterface.com.tr/admin/` adresinden açılır.
4. HTTPS açık olmalıdır (hosting panelinden SSL). Supabase tarafında ek CORS ayarı gerekmez.
5. Taşıma sonrası eski `*.pages.dev` adresi kapatılabilir; Supabase → Authentication → URL Configuration → **Site URL** alanını yeni alan adıyla güncelleyin.

## Notlar

- "Etkinlik türü" seçimi, Hizmetlerimiz tablosundaki başlıklardan otomatik türer — iki yerde ayrı ayrı tutulan bir liste yoktur.
- Form gönderimleri `form_submissions` tablosuna yazılır ve panelin "Gelen Talepler" sekmesinden görüntülenir/silinebilir. Hangi e-posta adres(ler)ine bildirim gitmesi gerektiği "Ayarlar" sekmesinden ayarlanır (e-posta gönderimi için ayrıca bir entegrasyon — örn. Supabase Edge Function + e-posta servisi — kurulması gerekir, bu depo sadece hedef adres listesini saklar).
