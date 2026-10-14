// Masterface — app.js
// Supabase'den veri çeker; tablo boş/erişilemezse aşağıdaki varsayılan
// içerikle (şu an sitede olanla aynı) sorunsuz çalışır. Panelden yapılan
// her ekleme/silme/düzenleme otomatik olarak buraya yansır — hiçbir
// sayım veya liste bu dosyada sabit (hardcoded) değildir.

(function () {
  'use strict';

  // ───────────────────────── Supabase client ─────────────────────────
  var supabase = null;
  try {
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
        window.SUPABASE_ANON_KEY.indexOf('PASTE_') !== 0) {
      supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn('Supabase client başlatılamadı, varsayılan içerik kullanılacak.', e);
  }

  // Supabase geçici olarak yavaş/erişilemez olsa bile sayfa uzun süre
  // boş kalmasın diye her sorguya kısa bir zaman aşımı konur — süre
  // dolunca varsayılan içeriğe düşülür, Supabase toparlanınca normal çalışır.
  var FETCH_TIMEOUT_MS = 4000;
  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve({ data: null, error: new Error('timeout') }); }
      }, ms);
      promise.then(function (res) {
        if (!done) { done = true; clearTimeout(timer); resolve(res); }
      }).catch(function (e) {
        if (!done) { done = true; clearTimeout(timer); resolve({ data: null, error: e }); }
      });
    });
  }

  async function fetchTable(table, orderCol) {
    if (!supabase) return null;
    try {
      var q = supabase.from(table).select('*');
      if (orderCol) q = q.order(orderCol, { ascending: true });
      var res = await withTimeout(q, FETCH_TIMEOUT_MS);
      if (res.error) { console.warn('[' + table + ']', res.error.message || res.error); return null; }
      if (!res.data || !res.data.length) return null;
      return res.data;
    } catch (e) {
      console.warn('[' + table + '] fetch hatası', e);
      return null;
    }
  }

  // ───────────────────────── Varsayılan içerik ─────────────────────────
  // (Panel/Supabase henüz boşsa veya erişilemiyorsa bu içerik gösterilir.)
  var DEFAULTS = {
    site_texts: {
      hero_kicker: 'Etkinlik · Aktivasyon · Stand',
      hero_title: 'Markaları deneyime dönüştürüyoruz',
      hero_subtitle: 'Markaların hedef kitleleriyle buluştuğu her noktada yaratıcı fikirleri güçlü saha operasyonlarıyla hayata geçiriyoruz.',
      about_title: 'Fikirleri hayata, markaları sahaya taşıyoruz!',
      about_body_1: 'Markaları insanlarla buluşturan etkinlikler tasarlıyor, her fikri sahada özenle hayata geçiriyoruz. Planlamadan uygulamaya kadar tüm süreci üstleniyor; güçlü bir ekip, yaratıcı çözümler ve titiz koordinasyonla her detayın yerini bulmasını sağlıyoruz.',
      about_body_2: 'Amacımız, markanızın hikâyesini insanların katıldığı, deneyimlediği ve hatırladığı anlara dönüştürmek. İşimizin merkezine açık iletişimi, güveni ve birlikte üretmeyi koyuyoruz.',
      whatsapp_number: '905536872886',
      contact_address: 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / İstanbul',
      contact_phone_display: '0553 687 28 86',
      contact_phone_tel: '+905536872886',
      contact_email: 'info@masterface.com.tr',
      contact_instagram_handle: '@masterfaceagency',
      contact_instagram_url: 'https://www.instagram.com/masterfaceagency/',
      contact_map_url: 'https://www.google.com/maps/place/Talatpa%C5%9Fa,+G%C3%B6k+Sk.,+34400+Ka%C4%9F%C4%B1thane%2F%C4%B0stanbul,+T%C3%BCrkiye/@41.064673,28.961802,15z/data=!4m6!3m5!1s0x14cab72fcbedce9f:0x307774bdc1c2f5fb!8m2!3d41.064673!4d28.961802!16s%2Fg%2F1tdlq_h0?hl=en-US&entry=ttu&g_ep=EgoyMDI2MTAxMi4wIKXMDSoASAFQAw%3D%3D',
      footer_bottom: '© 2026 Masterface Etkinlik Ajansı. Tüm hakları saklıdır.'
    },
    logos: [
      { label: 'Yves Rocher', image_url: 'assets/logos/yves-rocher.webp' },
      { label: 'Dydo', image_url: 'assets/logos/dydo.webp' },
      { label: 'DAGİ', image_url: 'assets/logos/dagi.webp' },
      { label: 'Migros', image_url: 'assets/logos/migros.webp' },
      { label: 'Logo', image_url: 'assets/logos/logo.webp' },
      { label: 'Saka', image_url: 'assets/logos/saka.webp' },
      { label: 'One Kitchen', image_url: 'assets/logos/one-kitchen.webp' },
      { label: 'TEI', image_url: 'assets/logos/tei.webp' },
      { label: 'Dürümle', image_url: 'assets/logos/durumle.webp' },
      { label: 'Pizza Express', image_url: 'assets/logos/pizza-express.webp' },
      { label: 'Berqnet', image_url: 'assets/logos/berqnet.webp' },
      { label: 'Axost Güvenlik', image_url: 'assets/logos/axost-guvenlik.webp' },
      { label: 'DNSSense', image_url: 'assets/logos/dnssense.webp' },
      { label: 'Privia Security', image_url: 'assets/logos/privia-security.webp' },
      { label: 'Timus', image_url: 'assets/logos/timus.webp' },
      { label: 'Terra Pizza', image_url: 'assets/logos/terra-pizza.webp' }
    ],
    stats: [
      { value: '150+', label: 'Tamamlanan proje' },
      { value: '17+', label: 'Birlikte çalışılan marka' },
      { value: '60+', label: 'Saha operasyonu yapılan şehir' },
      { value: '2018', label: 'Kuruluş yılı' }
    ],
    services: [
      { title: 'Festival ve Etkinlik Yönetimi', description: 'Markanızın yer almak istediği festival ve etkinliklerde; organizatör görüşmelerinden alan anlaşmalarına, sözleşme süreçlerinden stand kurulumu ve personel yönetimine kadar tüm süreci sizin için yönetiyoruz.', image_url: null },
      { title: 'Roadshow ve Mobil Etkinlikler', description: 'Markanızı farklı şehirlerde, meydanlarda ve yaşam alanlarında tüketicilerle buluşturuyoruz. Ürün tanıtımı, sampling ve yaratıcı saha aktiviteleriyle dikkat çeken, enerjisi yüksek ve akılda kalıcı etkinlikler gerçekleştiriyoruz.', image_url: null },
      { title: 'Sampling ve Tadım Etkinlikleri', description: 'Markanızın ürünlerini doğru yerde, doğru zamanda, doğru hedef kitleyle buluşturuyoruz. Tadım aktiviteleri, ürün dağıtımları ve yaratıcı saha uygulamalarıyla tüketicilerin markanızı yakından tanımasını ve deneyimlemesini sağlıyoruz.', image_url: null },
      { title: 'Stand Tasarımı ve Üretimi', description: 'Markanızın kimliğini yansıtan, dikkat çekici ve işlevsel standlar tasarlıyor, üretiyor ve hayata geçiriyoruz. Fuar, festival ve etkinlik alanlarında tasarımdan üretime, kurulumdan söküme kadar tüm süreci yönetiyoruz.', image_url: null },
      { title: 'Kurumsal Etkinlikler ve Organizasyonlar', description: 'Şirket içi kutlamalardan yılbaşı partilerine, motivasyon etkinliklerinden özel davetlere kadar her anı unutulmaz bir deneyime dönüştürüyoruz. Çalışanları bir araya getiren, eğlenceyi ve ekip ruhunu ön plana çıkaran organizasyonlar tasarlıyoruz.', image_url: null },
      { title: 'Üniversite Şenlikleri ve Kariyer Günleri', description: 'Markanızı kampüslerin enerjisiyle buluşturuyoruz! Üniversite şenliklerinden kariyer günlerine, marka tanıtımlarından eğlenceli deneyim alanlarına kadar gençlerle doğrudan iletişim kurmanızı sağlayan etkinlikleri planlıyor ve hayata geçiriyoruz.', image_url: null },
      { title: 'Toplantı ve Organizasyon Yönetimi', description: 'Bayi toplantılarından lansmanlara, şirket buluşmalarından özel davetlere kadar tüm organizasyonlarınızı profesyonelce planlıyoruz. Mekân seçiminden teknik altyapıya, sahne ve dekorasyondan operasyon yönetimine kadar her detayı sizin için düşünüyoruz.', image_url: null }
    ],
    categories: [], // kategori adı doğrudan projects.category metninden türer (varsayılanda)
    projects: [
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'gvm6JGzLG2M' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: '2rlN-i-ts2g' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'w_sGq5_zeI8' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'aQkfNgB5ZPg' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'HCjoKcrBuXo' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'nuOHaFKKMI4' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'Ji5Fh_YlIGs' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'ZbptAG-sf7c' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: '3A6C587v42o' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'cBD6wzq2nB4' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'uvXkcouXBbE' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', youtube_id: 'SSytzQygDXc' }
    ],
    process_steps: [
      { title: 'Keşif ve brief', description: 'Markanızı, hedeflerinizi ve kitlenizi dinliyoruz. İhtiyaçlarınızı netleştirerek projenin yol haritasını birlikte oluşturuyoruz.' },
      { title: 'Konsept ve planlama', description: 'Hedeflerinize uygun yaratıcı bir konsept geliştiriyoruz. Mekân, ekip, bütçe ve takvimi tüm detaylarıyla planlıyoruz.' },
      { title: 'Saha operasyonu ve raporlama', description: 'Sahadaki tüm süreci koordine ediyor, planı hayata geçiriyoruz. Etkinlik sonunda sonuçları ve değerlendirmelerimizi sizinle paylaşıyoruz.' }
    ],
    social_links: [
      { platform: 'instagram', url: 'https://www.instagram.com/masterfaceagency/' }
    ],
    gallery_photos: (function () {
      var arr = [];
      for (var i = 1; i <= 46; i++) {
        arr.push({ image_url: 'assets/gallery/gallery-' + String(i).padStart(2, '0') + '.jpg' });
      }
      return arr;
    })(),
    // form_fields: "Etkinlik türü" seçenekleri services başlıklarından TÜRER —
    // burada sabit bir seçenek listesi YOK, render sırasında services'ten üretilir.
    form_fields: [
      { id: 'name', label: 'Adınız', type: 'text', required: true, width: 'half', sort_order: 1 },
      { id: 'email', label: 'E-posta', type: 'email', required: true, width: 'half', sort_order: 2 },
      { id: 'phone', label: 'Telefon', type: 'phone', required: false, width: 'half', sort_order: 3 },
      { id: 'eventType', label: 'Etkinlik türü', type: 'select', required: true, width: 'half', sort_order: 4 },
      { id: 'eventDate', label: 'Etkinlik tarihi', type: 'daterange', required: false, width: 'full', sort_order: 5 },
      { id: 'message', label: 'Mesajınız', type: 'textarea', required: false, width: 'full', sort_order: 6 }
    ]
  };

  // ───────────────────────── Veri yükleme ─────────────────────────
  async function loadData() {
    // Tüm tablolar paralel (tek seferde) çekilir — Supabase yavaş/erişilemez
    // olsa bile her tablo kendi 4sn'lik zaman aşımıyla bağımsız döner, bu
    // yüzden toplam bekleme süresi tabloların TOPLAMI değil, en yavaş
    // tekil sorgu kadar olur.
    var results = await Promise.all([
      fetchTable('site_texts'),
      fetchTable('logos', 'sort_order'),
      fetchTable('stats', 'sort_order'),
      fetchTable('services', 'sort_order'),
      fetchTable('process_steps', 'sort_order'),
      fetchTable('gallery_photos', 'sort_order'),
      fetchTable('form_fields', 'sort_order'),
      fetchTable('categories', 'sort_order'),
      fetchTable('projects', 'sort_order'),
      fetchTable('social_links', 'sort_order')
    ]);
    var siteTextsRows = results[0];
    var logos = results[1] || DEFAULTS.logos;
    var stats = results[2] || DEFAULTS.stats;
    var services = results[3] || DEFAULTS.services;
    var processSteps = results[4] || DEFAULTS.process_steps;
    var galleryPhotos = results[5] || DEFAULTS.gallery_photos;
    var formFields = results[6] || DEFAULTS.form_fields;
    var categoriesRows = results[7];
    var projectsRows = results[8];
    var socialLinks = results[9] || DEFAULTS.social_links;

    var site_texts = Object.assign({}, DEFAULTS.site_texts);
    if (siteTextsRows) {
      siteTextsRows.forEach(function (row) { if (row.key) site_texts[row.key] = row.value; });
    }

    var projects;
    if (projectsRows) {
      var catsById = {};
      (categoriesRows || []).forEach(function (c) { catsById[c.id] = c.label; });
      projects = projectsRows.map(function (p) {
        return {
          name: p.name || '[Proje adı]',
          brand: p.brand || '[Marka]',
          city: p.city || '[Şehir]',
          year: p.year || '[Yıl]',
          category: (p.category_id && catsById[p.category_id]) || '[Kategori]',
          youtube_id: p.youtube_id || ''
        };
      });
    } else {
      projects = DEFAULTS.projects;
    }

    return { site_texts: site_texts, logos: logos, stats: stats, services: services, processSteps: processSteps, galleryPhotos: galleryPhotos, formFields: formFields, projects: projects, socialLinks: socialLinks };
  }

  // ───────────────────────── Yardımcılar ─────────────────────────
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ───────────────────────── Render: Hero / Hakkımızda metinleri / İletişim ─────────────────────────
  function renderTexts(t) {
    var set = function (id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; };
    set('hero-kicker', escapeHtml(t.hero_kicker));
    set('hero-title', escapeHtml(t.hero_title));
    set('hero-subtitle', escapeHtml(t.hero_subtitle));
    set('about-title', escapeHtml(t.about_title));
    set('about-body-1', escapeHtml(t.about_body_1));
    set('about-body-2', escapeHtml(t.about_body_2));
    set('contact-address', t.contact_address);
    set('footer-bottom', escapeHtml(t.footer_bottom));

    var phone = document.getElementById('contact-phone');
    if (phone) { phone.href = 'tel:' + t.contact_phone_tel; phone.textContent = t.contact_phone_display; }
    var email = document.getElementById('contact-email');
    if (email) { email.href = 'mailto:' + t.contact_email; email.textContent = t.contact_email; }
    var insta = document.getElementById('contact-instagram');
    if (insta) { insta.href = t.contact_instagram_url; insta.textContent = t.contact_instagram_handle; }
    var map = document.getElementById('contact-map');
    if (map) map.href = t.contact_map_url;
    var wa = document.getElementById('whatsapp-fab');
    if (wa) wa.href = 'https://wa.me/' + t.whatsapp_number;
  }

  // ───────────────────────── Render: Sosyal medya ikonları ─────────────────────────
  var SOCIAL_ICONS = {
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"></circle></svg>',
    linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.25h4V23h-4V8.25zM8.5 8.25h3.83v2.02h.05c.53-1 1.84-2.06 3.78-2.06 4.04 0 4.79 2.66 4.79 6.12V23h-4v-6.84c0-1.63-.03-3.74-2.28-3.74-2.28 0-2.63 1.78-2.63 3.62V23h-4V8.25z"></path></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"></path></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.5v-7l6.3 3.5-6.3 3.5z"></path></svg>',
    tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.2v13.9a3 3 0 1 1-2.1-2.86V9.7a6.1 6.1 0 1 0 5.3 6.06V8.4a7.9 7.9 0 0 0 4.6 1.47V6.7a4.7 4.7 0 0 1-4.6-4.7z"></path></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2h3.3l-7.2 8.2L22.8 22h-6.6l-5.2-6.8L4.9 22H1.6l7.7-8.8L1.2 2h6.8l4.7 6.2L18.2 2zm-1.2 18h1.8L7.1 4H5.2l11.8 16z"></path></svg>'
  };

  function renderSocialLinks(links) {
    var wrap = document.getElementById('footer-social');
    if (!wrap) return;
    wrap.innerHTML = '';
    (links || []).forEach(function (s) {
      if (!s || !s.url || !s.platform) return;
      var a = el('a', 'social-icon');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', s.platform);
      a.innerHTML = SOCIAL_ICONS[s.platform] || SOCIAL_ICONS.instagram;
      wrap.appendChild(a);
    });
  }

  // ───────────────────────── Mobil menü (hamburger) ─────────────────────────
  function initNavToggle() {
    var btn = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ───────────────────────── Render: Logo marquee ─────────────────────────
  function renderLogos(logos) {
    var track = document.getElementById('logos-track');
    if (!track) return;
    track.innerHTML = '';
    function addSet(hidden) {
      logos.forEach(function (logo) {
        var box = el('div', 'logo-box');
        var img = el('img');
        img.src = logo.image_url;
        img.alt = hidden ? '' : (logo.label || '');
        if (hidden) img.setAttribute('aria-hidden', 'true');
        box.appendChild(img);
        track.appendChild(box);
      });
    }
    addSet(false);
    addSet(true);
  }

  // ───────────────────────── Render: Stats ─────────────────────────
  function renderStats(stats) {
    var grid = document.getElementById('stats-grid');
    if (!grid) return;
    grid.innerHTML = '';
    stats.forEach(function (s) {
      var item = el('div', 'stat-item');
      item.appendChild(el('div', 'value', escapeHtml(s.value)));
      item.appendChild(el('div', 'label', escapeHtml(s.label)));
      grid.appendChild(item);
    });
  }

  // ───────────────────────── Render: Services ─────────────────────────
  function renderServices(services) {
    var grid = document.getElementById('services-grid');
    if (!grid) return;
    grid.innerHTML = '';
    services.forEach(function (svc, i) {
      var card = el('article', 'service-card');
      var thumb = el('div', 'thumb');
      if (svc.image_url) {
        var img = el('img'); img.src = svc.image_url; img.alt = svc.title || '';
        thumb.appendChild(img);
      } else {
        thumb.textContent = '[Hizmet görseli / döngü video]';
      }
      card.appendChild(thumb);
      var head = el('div', 'head');
      head.appendChild(el('span', 'no', String(i + 1).padStart(2, '0')));
      head.appendChild(el('h3', null, escapeHtml(svc.title)));
      card.appendChild(head);
      card.appendChild(el('p', null, escapeHtml(svc.description)));
      grid.appendChild(card);
    });
    var cta = el('article', 'service-cta');
    cta.appendChild(el('h3', null, 'Başka bir ihtiyacınız mı var?'));
    var a = el('a', null, 'Teklif Alın →'); a.href = '#iletisim';
    cta.appendChild(a);
    grid.appendChild(cta);
  }

  // ───────────────────────── Render: Process ─────────────────────────
  function renderProcess(steps) {
    var grid = document.getElementById('process-grid');
    if (!grid) return;
    grid.innerHTML = '';
    steps.forEach(function (s, i) {
      var card = el('div', 'process-card');
      card.appendChild(el('div', 'no', String(i + 1).padStart(2, '0')));
      card.appendChild(el('h3', null, escapeHtml(s.title)));
      card.appendChild(el('p', null, escapeHtml(s.description)));
      grid.appendChild(card);
    });
  }

  // ───────────────────────── Render: Projects + filtre chip'leri ─────────────────────────
  var projectState = { filter: 'Tümü', allProjects: [] };

  function renderChipsAndProjects() {
    var chipsWrap = document.getElementById('chips');
    var grid = document.getElementById('projects-grid');
    if (!chipsWrap || !grid) return;

    var uniqueCats = Array.from(new Set(projectState.allProjects.map(function (p) { return p.category; })));
    var catList = ['Tümü'].concat(uniqueCats);

    chipsWrap.innerHTML = '';
    catList.forEach(function (c) {
      var btn = el('button', 'chip' + (c === projectState.filter ? ' active' : ''), escapeHtml(c));
      btn.type = 'button';
      btn.addEventListener('click', function () {
        projectState.filter = c;
        renderChipsAndProjects();
      });
      chipsWrap.appendChild(btn);
    });

    var filtered = projectState.filter === 'Tümü'
      ? projectState.allProjects
      : projectState.allProjects.filter(function (p) { return p.category === projectState.filter; });

    grid.innerHTML = '';
    filtered.forEach(function (p) {
      var thumb = p.youtube_id ? ('https://img.youtube.com/vi/' + p.youtube_id + '/hqdefault.jpg') : '';
      var url = p.youtube_id ? ('https://www.youtube.com/watch?v=' + p.youtube_id) : '#';
      var article = el('article', 'project-card');
      var a = el('a', 'thumb');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      var img = el('img'); img.src = thumb; img.alt = p.name;
      a.appendChild(img);
      a.appendChild(el('div', 'grad'));
      a.appendChild(el('div', 'cat', escapeHtml(p.category)));
      var play = el('div', 'play');
      play.innerHTML = '<span><svg width="20" height="20" viewBox="0 0 20 20" fill="#111113"><path d="M5 3l12 7-12 7V3z"></path></svg></span>';
      a.appendChild(play);
      article.appendChild(a);
      var meta = el('div', 'meta');
      meta.appendChild(el('h3', null, escapeHtml(p.name)));
      meta.appendChild(el('span', 'year', escapeHtml(p.year)));
      article.appendChild(meta);
      article.appendChild(el('div', 'sub', escapeHtml(p.brand) + ' · ' + escapeHtml(p.city)));
      grid.appendChild(article);
    });
  }

  function renderProjects(projects) {
    projectState.allProjects = projects;
    projectState.filter = 'Tümü';
    renderChipsAndProjects();
  }

  // ───────────────────────── Render: Hakkımızda galeri (kart yığını) ─────────────────────────
  var galleryState = { photos: [], index: 0 };
  var CARD_DEPTH_STYLE = [
    'transform:translate(0px,0px) scale(1) rotate(0deg);z-index:5;opacity:1;filter:none;',
    'transform:translate(20px,26px) scale(.94) rotate(4deg);z-index:4;opacity:1;filter:brightness(.82);',
    'transform:translate(38px,50px) scale(.88) rotate(8deg);z-index:3;opacity:.85;filter:brightness(.66);',
    'transform:translate(54px,72px) scale(.82) rotate(12deg);z-index:2;opacity:.6;filter:brightness(.52);'
  ];

  function renderGallery() {
    var stack = document.getElementById('card-stack');
    var count = document.getElementById('gallery-count');
    if (!stack) return;
    var total = galleryState.photos.length;
    if (!total) return;
    var idx = ((galleryState.index % total) + total) % total;
    stack.innerHTML = '';
    CARD_DEPTH_STYLE.forEach(function (depthStyle, d) {
      var photo = galleryState.photos[(idx + d) % total];
      var card = el('div', 'card');
      card.style.cssText = depthStyle;
      var img = el('img');
      img.src = photo.image_url;
      img.alt = 'Masterface sahadan kare';
      card.appendChild(img);
      card.addEventListener('click', function () { galleryState.index++; renderGallery(); });
      stack.appendChild(card);
    });
    if (count) count.textContent = (idx + 1) + ' / ' + total;
  }

  function initGallery(photos) {
    galleryState.photos = photos;
    galleryState.index = 0;
    renderGallery();
    var prev = document.getElementById('gallery-prev');
    var next = document.getElementById('gallery-next');
    if (prev) prev.addEventListener('click', function () { galleryState.index--; renderGallery(); });
    if (next) next.addEventListener('click', function () { galleryState.index++; renderGallery(); });
  }

  // ───────────────────────── Render: İletişim formu ─────────────────────────
  var formState = { singleDay: false };

  function fieldLabel(f) {
    return escapeHtml(f.label) + (f.required ? ' *' : '');
  }

  function renderForm(fields, services) {
    var wrap = document.getElementById('contact-fields');
    if (!wrap) return;
    wrap.innerHTML = '';

    // "Etkinlik türü" (select) seçenekleri her zaman services başlıklarından
    // türetilir — iki yerde ayrı ayrı tutulan bir liste YOK, bu yüzden
    // Hizmetlerimiz güncellendiğinde form otomatik senkron kalır.
    var serviceOptions = services.map(function (s) { return s.title; }).concat(['Diğer']);

    fields.forEach(function (f) {
      var widthClass = f.width === 'full' ? 'full' : 'half';

      if (f.type === 'daterange') {
        var block = el('div', 'field ' + widthClass);
        block.style.fontWeight = '600'; block.style.fontSize = '15px';
        var title = el('div', null, fieldLabel(f));
        title.style.marginBottom = '10px';
        block.appendChild(title);

        var checkRow = el('label', 'daterange-check');
        var checkbox = el('input');
        checkbox.type = 'checkbox';
        checkbox.checked = formState.singleDay;
        checkRow.appendChild(checkbox);
        checkRow.appendChild(document.createTextNode('Tek gün sürecek'));
        block.appendChild(checkRow);

        var dateArea = el('div');
        block.appendChild(dateArea);

        function renderDateArea() {
          dateArea.innerHTML = '';
          if (formState.singleDay) {
            var single = el('input');
            single.type = 'date'; single.name = f.id; single.style.width = '100%';
            dateArea.appendChild(single);
          } else {
            var row = el('div', 'fields-row');
            var startLabel = el('label', 'field half'); startLabel.style.fontSize = '13px';
            startLabel.appendChild(document.createTextNode('Başlangıç'));
            var start = el('input'); start.type = 'date'; start.name = f.id + 'Start';
            startLabel.appendChild(start);
            var endLabel = el('label', 'field half'); endLabel.style.fontSize = '13px';
            endLabel.appendChild(document.createTextNode('Bitiş'));
            var end = el('input'); end.type = 'date'; end.name = f.id + 'End';
            endLabel.appendChild(end);
            row.appendChild(startLabel); row.appendChild(endLabel);
            dateArea.appendChild(row);
          }
        }
        renderDateArea();
        checkbox.addEventListener('change', function () {
          formState.singleDay = checkbox.checked;
          renderDateArea();
        });
        wrap.appendChild(block);
        return;
      }

      var label = el('label', 'field ' + widthClass);
      label.appendChild(document.createTextNode(fieldLabel(f)));
      var input;
      if (f.type === 'select') {
        input = el('select');
        input.name = f.id;
        var opts = (f.options && f.options.length) ? f.options : serviceOptions;
        opts.forEach(function (opt) {
          var o = el('option', null, escapeHtml(opt));
          o.value = opt;
          input.appendChild(o);
        });
      } else if (f.type === 'textarea') {
        input = el('textarea');
        input.name = f.id;
        input.rows = 4;
      } else {
        input = el('input');
        input.type = f.type === 'phone' ? 'tel' : (f.type === 'email' ? 'email' : 'text');
        input.name = f.id;
      }
      if (f.required) input.required = true;
      label.appendChild(input);
      wrap.appendChild(label);
    });
  }

  function initFormSubmit(recipients) {
    var form = document.getElementById('contact-form');
    var feedback = document.getElementById('contact-feedback');
    var submitBtn = document.getElementById('contact-submit');
    if (!form) return;
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (field) {
        if (field.name) payload[field.name] = field.value;
      });
      if (feedback) feedback.innerHTML = '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Gönderiliyor…'; }
      try {
        if (supabase) {
          var res = await supabase.from('form_submissions').insert([{ payload: payload }]);
          if (res.error) throw res.error;
        } else {
          console.info('Supabase bağlı değil, form verisi gönderilmedi (test modu):', payload);
        }
        if (feedback) feedback.appendChild(el('div', 'form-note ok', 'Talebiniz alındı, en kısa sürede dönüş yapacağız.'));
        form.reset();
      } catch (err) {
        console.error(err);
        if (feedback) feedback.appendChild(el('div', 'form-note err', 'Bir şeyler ters gitti, lütfen tekrar deneyin veya WhatsApp üzerinden yazın.'));
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Teklif İste →'; }
      }
    });
  }

  // ───────────────────────── Başlat ─────────────────────────
  async function init() {
    var data = await loadData();
    renderTexts(data.site_texts);
    renderLogos(data.logos);
    renderStats(data.stats);
    renderServices(data.services);
    renderProcess(data.processSteps);
    renderProjects(data.projects);
    initGallery(data.galleryPhotos);
    renderForm(data.formFields, data.services);
    initFormSubmit();
    renderSocialLinks(data.socialLinks);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavToggle();
    init();
  });
})();
