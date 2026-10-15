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
supabase/migrate-i18n.sql   → Mevcut veritabanına çok dil (TR/EN/DE) ekler, veri silmez
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

**Çok dil (TR / EN / DE):** Site Türkçe (ana dil), İngilizce ve Almanca sunulur; ziyaretçi menüdeki açılır dil seçiciden değiştirir, seçim hatırlanır (`?lang=en` ile de açılır). Yeni kurulumda `schema.sql` zaten çeviri sütunlarını (`i18n`) içerir. **Daha önce kurulmuş bir veritabanında** SQL Editor'da bir kez `supabase/migrate-i18n.sql` çalıştırın (sütunları ekler, mevcut içeriğin EN/DE çevirilerini doldurur, hiçbir veriyi silmez). Çevirileri değiştirmek için `app.js` içindeki `DEFAULTS` düzenlenip `node supabase/gen-i18n.js > supabase/migrate-i18n.sql` ile yeniden üretilebilir; günlük kullanımda panelden yönetilir.

**Görsel yükleme:** Panelde Hizmetler, Logolar ve Galeri'deki görsel alanında "Görsel yükle" butonu vardır; dosya Supabase Storage'daki herkese açık `media` kovasına yüklenir ve adresi kendiliğinden yazılır. Kova yeni kurulumda `supabase/storage.sql` ile oluşturulur (bir kez çalıştırın). Görseller Supabase'de durduğu için siteyi başka hostinge taşırken ayrıca taşımak gerekmez.

**Renk teması:** Panelde "Renkler" sekmesinden 6 ana renk (iki koyu zemin, koyu zemindeki yazı, vurgu, açık bölüm zemini ve yazısı) seçilir veya hazır temalardan biri uygulanır; önizleme canlıdır ve okunabilirlik uyarısı verir. Diğer tüm tonlar (kenarlık, soluk yazı, vurgu üstündeki siyah/beyaz yazı vb.) `assets/js/theme.js` kurallarıyla otomatik türetilir. Renkler `site_texts` tablosunda `theme_*` anahtarlarıyla saklanır, ek SQL gerekmez; "Varsayılana dön" kayıtları siler.

### 2) İçerik girişi

`/admin` adresine gidip adım 3'te oluşturduğunuz hesapla giriş yapın. Tüm bölümler (Site Metinleri — Türkçe/English/Deutsch sekmeli; Hizmetler, Projeler, Kategoriler, Rakamlar, Süreç ve Form alanlarında kayıt düzenlerken "Çeviriler" kutusu; boş bırakılan çeviri Türkçe gösterilir, Site Metinleri, Projeler, Hizmetler, Logolar, Rakamlar, Galeri, Süreç, İletişim Formu Alanları, Ayarlar) buradan yönetilir.

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

- Forma yazılan talepler hangi dilde geldiyse `lang` alanıyla birlikte "Gelen Talepler"de görünür; "Etkinlik türü" değeri dilden bağımsız olarak Türkçe başlık olarak kaydedilir.
- "Etkinlik türü" seçimi, Hizmetlerimiz tablosundaki başlıklardan otomatik türer — iki yerde ayrı ayrı tutulan bir liste yoktur.
- Form gönderimleri `form_submissions` tablosuna yazılır ve panelin "Gelen Talepler" sekmesinden görüntülenir/silinebilir. Aynı anda `supabase/mail.sql` tetikleyicisi, "Ayarlar"daki tüm alıcı adreslere Resend üzerinden e-posta gönderir. Kurulum: `supabase/mail.sql`'i SQL Editor'de bir kez çalıştırın; resend.com'da hesap açıp masterface.com.tr alan adını doğrulayın (DNS'e SPF/DKIM kayıtları), API anahtarını ve gönderen adresi panel > Ayarlar'a girin. Backend Supabase'te kaldığı için hosting taşınsa da çalışmaya devam eder.

## Yeni Supabase projesine taşıma (müşteri hesabı)
1. supabase.com'da yeni proje oluştur (bölge: Frankfurt/eu-central-1 önerilir, güçlü bir DB şifresi kaydet).
2. SQL Editor'de `supabase/setup-all.sql` dosyasının tamamını yapıştırıp çalıştır (şema + depolama + mail tetikleyicisi + başlangıç verisi). "Potential issue" uyarısı çıkarsa Run query.
3. Authentication → Users → Add user: `admin@masterface.com.tr` + şifre, **Auto Confirm User** işaretli.
4. Settings → API'den Project URL ve Publishable key'i al, `assets/js/config.js` içindeki `SUPABASE_URL` / `SUPABASE_ANON_KEY` değerlerine yaz.
5. Authentication → URL Configuration: Site URL'yi `https://masterface.com.tr` yap.
6. /admin → Ayarlar'a Resend anahtarını ve gönderen adresi gir.
