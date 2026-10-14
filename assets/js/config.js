// Supabase bağlantı ayarları.
// Project URL, Project ID'den türetildi (Settings → General).
// SUPABASE_ANON_KEY: Settings → API → "Publishable key" (yeni isimlendirmede
// eski "anon / public" anahtarının karşılığı).
// Bu anahtar herkese açık olacak şekilde tasarlanmıştır (RLS kuralları korur) —
// gizli tutulması gereken "Secret key" (eski "service_role") DEĞİLDİR, asla onu kullanma.
window.SUPABASE_URL = 'https://xqxjdegyyvvjrfvsvglf.supabase.co';
// Admin paneli "kullanıcı adı + şifre" ile girilir. Supabase Auth e-posta ister,
// bu yüzden kullanıcı adının sonuna bu alan adı eklenir (örn. "admin" →
// admin@masterface.com.tr). Supabase'de kullanıcıyı bu adresle oluşturun.
// Girişe "@" içeren bir değer yazılırsa olduğu gibi (tam e-posta) kullanılır.
window.ADMIN_EMAIL_DOMAIN = 'masterface.com.tr';
window.SUPABASE_ANON_KEY ='sb_publishable_qP5lQ0z6JinCG4YOykMfOQ_0AY0KJCP';
