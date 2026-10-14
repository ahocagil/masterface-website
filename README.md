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
3. **Authentication → Users** kısmından panel için bir admin kullanıcı (e-posta + şifre) oluşturun — bu, `/admin` paneline giriş yapacak hesaptır.
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

## Notlar

- "Etkinlik türü" seçimi, Hizmetlerimiz tablosundaki başlıklardan otomatik türer — iki yerde ayrı ayrı tutulan bir liste yoktur.
- Form gönderimleri `form_submissions` tablosuna yazılır ve panelin "Gelen Talepler" sekmesinden görüntülenir/silinebilir. Hangi e-posta adres(ler)ine bildirim gitmesi gerektiği "Ayarlar" sekmesinden ayarlanır (e-posta gönderimi için ayrıca bir entegrasyon — örn. Supabase Edge Function + e-posta servisi — kurulması gerekir, bu depo sadece hedef adres listesini saklar).
