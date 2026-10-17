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
  // @defaults-start
  // Çeviriler: öğelerde `i18n: { en:{…}, de:{…} }`, site metinlerinde `anahtar_en` / `anahtar_de`.
  // Ana dil Türkçe'dir; çeviri boşsa Türkçe metin gösterilir.
  var PH_I18N = {
    en: { name: '[Project name]', brand: '[Brand]', city: '[City]', year: '[Year]', category: '[Category]' },
    de: { name: '[Projektname]', brand: '[Marke]', city: '[Stadt]', year: '[Jahr]', category: '[Kategorie]' }
  };
  var PH_PROJECT = { en: { name: PH_I18N.en.name, brand: PH_I18N.en.brand, city: PH_I18N.en.city, year: PH_I18N.en.year },
                     de: { name: PH_I18N.de.name, brand: PH_I18N.de.brand, city: PH_I18N.de.city, year: PH_I18N.de.year } };
  var PH_CATEGORY = { en: { label: PH_I18N.en.category }, de: { label: PH_I18N.de.category } };
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
      footer_bottom: '© 2026 Masterface Etkinlik Ajansı. Tüm hakları saklıdır.',
      hero_kicker_en: 'Events · Activation · Stands',
      hero_kicker_de: 'Events · Aktivierung · Messestände',
      hero_title_en: 'We turn brands into experiences',
      hero_title_de: 'Wir verwandeln Marken in Erlebnisse',
      hero_subtitle_en: 'At every point where brands meet their target audiences, we bring creative ideas to life through strong field operations.',
      hero_subtitle_de: 'Überall dort, wo Marken auf ihre Zielgruppen treffen, setzen wir kreative Ideen mit starker Umsetzung vor Ort um.',
      about_title_en: 'We bring ideas to life and brands to the field!',
      about_title_de: 'Wir bringen Ideen zum Leben und Marken ins Feld!',
      about_body_1_en: 'We design events that connect brands with people and carefully bring every idea to life on the ground. We take on the whole process from planning to execution; with a strong team, creative solutions and meticulous coordination, we make sure every detail falls into place.',
      about_body_1_de: 'Wir gestalten Events, die Marken mit Menschen zusammenbringen, und setzen jede Idee vor Ort mit Sorgfalt um. Wir übernehmen den gesamten Prozess von der Planung bis zur Umsetzung; mit einem starken Team, kreativen Lösungen und sorgfältiger Koordination sorgen wir dafür, dass jedes Detail sitzt.',
      about_body_2_en: 'Our goal is to turn your brand\'s story into moments people take part in, experience and remember. At the heart of our work are open communication, trust and creating together.',
      about_body_2_de: 'Unser Ziel ist es, die Geschichte Ihrer Marke in Momente zu verwandeln, an denen Menschen teilnehmen, die sie erleben und an die sie sich erinnern. Im Mittelpunkt unserer Arbeit stehen offene Kommunikation, Vertrauen und gemeinsames Schaffen.',
      contact_address_en: 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / Istanbul',
      contact_address_de: 'Talatpaşa Mh. Gök Sk. 5, 34400<br>Kağıthane / Istanbul',
      footer_bottom_en: '© 2026 Masterface Event Agency. All rights reserved.',
      footer_bottom_de: '© 2026 Masterface Eventagentur. Alle Rechte vorbehalten.'
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
      { value: '150+', label: 'Tamamlanan proje', i18n: { en: { label: 'Completed projects' }, de: { label: 'Abgeschlossene Projekte' } } },
      { value: '17+', label: 'Birlikte çalışılan marka', i18n: { en: { label: 'Brands we work with' }, de: { label: 'Betreute Marken' } } },
      { value: '60+', label: 'Saha operasyonu yapılan şehir', i18n: { en: { label: 'Cities with field operations' }, de: { label: 'Städte mit Einsätzen vor Ort' } } },
      { value: '2018', label: 'Kuruluş yılı', i18n: { en: { label: 'Year founded' }, de: { label: 'Gründungsjahr' } } }
    ],
    services: [
      { title: 'Festival ve Etkinlik Yönetimi', description: 'Markanızın yer almak istediği festival ve etkinliklerde; organizatör görüşmelerinden alan anlaşmalarına, sözleşme süreçlerinden stand kurulumu ve personel yönetimine kadar tüm süreci sizin için yönetiyoruz.', image_url: null, i18n: { en: { title: 'Festival and Event Management', description: 'We manage the entire process for the festivals and events your brand wants to be part of: from organizer negotiations and space agreements to contracts, stand setup and staff management.' }, de: { title: 'Festival- und Eventmanagement', description: 'Für die Festivals und Events, bei denen Ihre Marke präsent sein möchte, übernehmen wir den gesamten Prozess: von Gesprächen mit den Veranstaltern und Flächenvereinbarungen über Verträge bis zu Standaufbau und Personalmanagement.' } } },
      { title: 'Roadshow ve Mobil Etkinlikler', description: 'Markanızı farklı şehirlerde, meydanlarda ve yaşam alanlarında tüketicilerle buluşturuyoruz. Ürün tanıtımı, sampling ve yaratıcı saha aktiviteleriyle dikkat çeken, enerjisi yüksek ve akılda kalıcı etkinlikler gerçekleştiriyoruz.', image_url: null, i18n: { en: { title: 'Roadshows and Mobile Events', description: 'We bring your brand to consumers in different cities, squares and public spaces. With product launches, sampling and creative field activities, we deliver high-energy, memorable events that grab attention.' }, de: { title: 'Roadshows und mobile Events', description: 'Wir bringen Ihre Marke in verschiedenen Städten, auf Plätzen und in Lebensräumen zu den Konsumenten. Mit Produktpräsentationen, Sampling und kreativen Aktionen vor Ort realisieren wir aufmerksamkeitsstarke, energiegeladene und einprägsame Events.' } } },
      { title: 'Sampling ve Tadım Etkinlikleri', description: 'Markanızın ürünlerini doğru yerde, doğru zamanda, doğru hedef kitleyle buluşturuyoruz. Tadım aktiviteleri, ürün dağıtımları ve yaratıcı saha uygulamalarıyla tüketicilerin markanızı yakından tanımasını ve deneyimlemesini sağlıyoruz.', image_url: null, i18n: { en: { title: 'Sampling and Tasting Events', description: 'We connect your products with the right audience at the right place and time. Tasting activities, product distribution and creative field executions let consumers get to know and experience your brand up close.' }, de: { title: 'Sampling und Verkostungen', description: 'Wir bringen Ihre Produkte zur richtigen Zeit am richtigen Ort zur richtigen Zielgruppe. Mit Verkostungen, Produktverteilungen und kreativen Aktionen vor Ort erleben Konsumenten Ihre Marke hautnah.' } } },
      { title: 'Stand Tasarımı ve Üretimi', description: 'Markanızın kimliğini yansıtan, dikkat çekici ve işlevsel standlar tasarlıyor, üretiyor ve hayata geçiriyoruz. Fuar, festival ve etkinlik alanlarında tasarımdan üretime, kurulumdan söküme kadar tüm süreci yönetiyoruz.', image_url: null, i18n: { en: { title: 'Stand Design and Production', description: 'We design, produce and realize eye-catching, functional stands that reflect your brand identity. At trade fairs, festivals and event venues we manage everything from design to production, installation to dismantling.' }, de: { title: 'Standdesign und Standbau', description: 'Wir entwerfen, produzieren und realisieren auffällige, funktionale Stände, die Ihre Markenidentität widerspiegeln. Auf Messen, Festivals und Eventflächen betreuen wir alles von Design und Produktion bis zu Aufbau und Abbau.' } } },
      { title: 'Kurumsal Etkinlikler ve Organizasyonlar', description: 'Şirket içi kutlamalardan yılbaşı partilerine, motivasyon etkinliklerinden özel davetlere kadar her anı unutulmaz bir deneyime dönüştürüyoruz. Çalışanları bir araya getiren, eğlenceyi ve ekip ruhunu ön plana çıkaran organizasyonlar tasarlıyoruz.', image_url: null, i18n: { en: { title: 'Corporate Events and Organizations', description: 'From in-house celebrations to New Year\'s parties, from motivation events to private invitations, we turn every moment into an unforgettable experience. We design events that bring employees together and put fun and team spirit first.' }, de: { title: 'Firmenevents und Organisation', description: 'Von internen Feiern über Silvesterpartys bis zu Motivationsevents und privaten Einladungen verwandeln wir jeden Moment in ein unvergessliches Erlebnis. Wir gestalten Veranstaltungen, die Mitarbeitende zusammenbringen und Spaß sowie Teamgeist in den Mittelpunkt stellen.' } } },
      { title: 'Üniversite Şenlikleri ve Kariyer Günleri', description: 'Markanızı kampüslerin enerjisiyle buluşturuyoruz! Üniversite şenliklerinden kariyer günlerine, marka tanıtımlarından eğlenceli deneyim alanlarına kadar gençlerle doğrudan iletişim kurmanızı sağlayan etkinlikleri planlıyor ve hayata geçiriyoruz.', image_url: null, i18n: { en: { title: 'University Festivals and Career Days', description: 'We bring your brand together with the energy of campuses! From university festivals to career days, from brand presentations to fun experience areas, we plan and run events that let you communicate directly with young people.' }, de: { title: 'Uni-Festivals und Karrieretage', description: 'Wir bringen Ihre Marke mit der Energie der Campus zusammen! Von Uni-Festivals über Karrieretage und Markenpräsentationen bis zu spaßigen Erlebnisflächen planen und realisieren wir Events, mit denen Sie direkt mit jungen Menschen in Kontakt treten.' } } },
      { title: 'Toplantı ve Organizasyon Yönetimi', description: 'Bayi toplantılarından lansmanlara, şirket buluşmalarından özel davetlere kadar tüm organizasyonlarınızı profesyonelce planlıyoruz. Mekân seçiminden teknik altyapıya, sahne ve dekorasyondan operasyon yönetimine kadar her detayı sizin için düşünüyoruz.', image_url: null, i18n: { en: { title: 'Meeting and Event Management', description: 'From dealer meetings to launches, company gatherings to private invitations, we plan all your events professionally. From venue selection to technical infrastructure, stage and decoration to operations management, we think of every detail for you.' }, de: { title: 'Meeting- und Eventmanagement', description: 'Von Händlertreffen über Produktlaunches und Firmentreffen bis zu privaten Einladungen planen wir all Ihre Veranstaltungen professionell. Von der Locationwahl über Technik und Bühne bis zu Dekoration und Operations kümmern wir uns um jedes Detail.' } } }
    ],
    categories: [], // kategori adı doğrudan projects.category metninden türer (varsayılanda)
    projects: [
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'gvm6JGzLG2M' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: '2rlN-i-ts2g' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'w_sGq5_zeI8' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'aQkfNgB5ZPg' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'HCjoKcrBuXo' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'nuOHaFKKMI4' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'Ji5Fh_YlIGs' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'ZbptAG-sf7c' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: '3A6C587v42o' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'cBD6wzq2nB4' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'uvXkcouXBbE' },
      { name: '[Proje adı]', brand: '[Marka]', city: '[Şehir]', year: '[Yıl]', category: '[Kategori]', category_i18n: PH_CATEGORY, i18n: PH_PROJECT, youtube_id: 'SSytzQygDXc' }
    ],
    process_steps: [
      { title: 'Keşif ve brief', description: 'Markanızı, hedeflerinizi ve kitlenizi dinliyoruz. İhtiyaçlarınızı netleştirerek projenin yol haritasını birlikte oluşturuyoruz.', i18n: { en: { title: 'Discovery and brief', description: 'We listen to your brand, goals and audience. We clarify your needs and build the project roadmap together.' }, de: { title: 'Kennenlernen und Briefing', description: 'Wir hören Ihnen zu: Marke, Ziele und Zielgruppe. Wir schärfen Ihre Anforderungen und erarbeiten gemeinsam den Fahrplan des Projekts.' } } },
      { title: 'Konsept ve planlama', description: 'Hedeflerinize uygun yaratıcı bir konsept geliştiriyoruz. Mekân, ekip, bütçe ve takvimi tüm detaylarıyla planlıyoruz.', i18n: { en: { title: 'Concept and planning', description: 'We develop a creative concept that fits your goals. We plan venue, team, budget and schedule in full detail.' }, de: { title: 'Konzept und Planung', description: 'Wir entwickeln ein kreatives Konzept, das zu Ihren Zielen passt. Location, Team, Budget und Zeitplan planen wir bis ins Detail.' } } },
      { title: 'Saha operasyonu ve raporlama', description: 'Sahadaki tüm süreci koordine ediyor, planı hayata geçiriyoruz. Etkinlik sonunda sonuçları ve değerlendirmelerimizi sizinle paylaşıyoruz.', i18n: { en: { title: 'Field operations and reporting', description: 'We coordinate the entire process on site and bring the plan to life. After the event we share the results and our evaluations with you.' }, de: { title: 'Umsetzung vor Ort und Reporting', description: 'Wir koordinieren den gesamten Ablauf vor Ort und setzen den Plan um. Nach dem Event teilen wir Ergebnisse und Auswertungen mit Ihnen.' } } }
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
      { id: 'name', label: 'Adınız', i18n: { en: { label: 'Your name' }, de: { label: 'Ihr Name' } }, type: 'text', required: true, width: 'half', sort_order: 1 },
      { id: 'email', label: 'E-posta', i18n: { en: { label: 'Email' }, de: { label: 'E-Mail' } }, type: 'email', required: true, width: 'half', sort_order: 2 },
      { id: 'phone', label: 'Telefon', i18n: { en: { label: 'Phone' }, de: { label: 'Telefon' } }, type: 'phone', required: false, width: 'half', sort_order: 3 },
      { id: 'eventType', label: 'Etkinlik türü', i18n: { en: { label: 'Event type' }, de: { label: 'Veranstaltungsart' } }, type: 'select', required: true, width: 'half', sort_order: 4 },
      { id: 'eventDate', label: 'Etkinlik tarihi', i18n: { en: { label: 'Event date' }, de: { label: 'Veranstaltungsdatum' } }, type: 'daterange', required: false, width: 'full', sort_order: 5 },
      { id: 'message', label: 'Mesajınız', i18n: { en: { label: 'Your message' }, de: { label: 'Ihre Nachricht' } }, type: 'textarea', required: false, width: 'full', sort_order: 6 }
    ]
  };
  // @defaults-end

  // ───────────────────────── Diller + arayüz metinleri ─────────────────────────
  var LANGS = [
    { code: 'tr', short: 'TR', name: 'Türkçe' },
    { code: 'en', short: 'EN', name: 'English' },
    { code: 'de', short: 'DE', name: 'Deutsch' }
  ];
  var UI = {
    tr: {
      title: 'Masterface | Markaları deneyime dönüştürüyoruz',
      meta: 'Masterface — etkinlik, aktivasyon ve stand ajansı. Fikirleri hayata, markaları sahaya taşıyoruz.',
      menu: 'Menü', nav_projects: 'Projeler', nav_services: 'Hizmetler', nav_about: 'Hakkımızda', nav_refs: 'Referanslar', nav_contact: 'İletişim',
      cta_quote: 'Teklif Al', lang_label: 'Dil',
      hero_cta1: 'Projelerimizi İncele', hero_cta2: 'Görüşme Talep Et',
      logos_label: 'Birlikte çalıştığımız markalar',
      services_kicker: 'Hizmetlerimiz', services_h2: 'Fikirden sahaya, tüm süreç tek ekipte',
      svc_cta_title: 'Başka bir ihtiyacınız mı var?', svc_cta_link: 'Teklif Alın →', svc_placeholder: '[Hizmet görseli / döngü video]',
      projects_kicker: 'Projeler', projects_h2: 'Sahada ürettiklerimiz', all: 'Tümü',
      process_kicker: 'Nasıl çalışıyoruz', process_h2: 'Üç adımda uçtan uca yönetim',
      about_kicker: 'Hakkımızda', gal_prev: 'Önceki', gal_next: 'Sonraki', gal_alt: 'Masterface sahadan kare',
      contact_kicker: 'İletişim', contact_h2: 'Etkinliğinizi birlikte planlayalım',
      k_address: 'Adres', k_phone: 'Telefon', k_email: 'E-posta', k_instagram: 'Instagram', map_link: "Google Haritalar'da görüntüle",
      single_day: 'Tek gün sürecek', start: 'Başlangıç', end: 'Bitiş', other: 'Diğer',
      submit: 'Teklif İste →', sending: 'Gönderiliyor…', ok: 'Talebiniz alındı, en kısa sürede dönüş yapacağız.',
      err: 'Bir şeyler ters gitti, lütfen tekrar deneyin veya WhatsApp üzerinden yazın.',
      wa: 'WhatsApp ile yazın', footer_tag: 'Markaları deneyime dönüştürüyoruz', privacy: 'Gizlilik ve KVKK'
    },
    en: {
      title: 'Masterface | We turn brands into experiences',
      meta: 'Masterface — event, activation and stand agency. We bring ideas to life and brands to the field.',
      menu: 'Menu', nav_projects: 'Projects', nav_services: 'Services', nav_about: 'About', nav_refs: 'References', nav_contact: 'Contact',
      cta_quote: 'Get a Quote', lang_label: 'Language',
      hero_cta1: 'See Our Projects', hero_cta2: 'Request a Meeting',
      logos_label: 'Brands we work with',
      services_kicker: 'Our Services', services_h2: 'From idea to field, the whole process in one team',
      svc_cta_title: 'Need something else?', svc_cta_link: 'Get a Quote →', svc_placeholder: '[Service image / loop video]',
      projects_kicker: 'Projects', projects_h2: 'What we create in the field', all: 'All',
      process_kicker: 'How we work', process_h2: 'End-to-end management in three steps',
      about_kicker: 'About Us', gal_prev: 'Previous', gal_next: 'Next', gal_alt: 'Masterface field photo',
      contact_kicker: 'Contact', contact_h2: "Let's plan your event together",
      k_address: 'Address', k_phone: 'Phone', k_email: 'Email', k_instagram: 'Instagram', map_link: 'View on Google Maps',
      single_day: 'One day only', start: 'Start', end: 'End', other: 'Other',
      submit: 'Request a Quote →', sending: 'Sending…', ok: "We've received your request and will get back to you shortly.",
      err: 'Something went wrong. Please try again or write to us on WhatsApp.',
      wa: 'Message us on WhatsApp', footer_tag: 'We turn brands into experiences', privacy: 'Privacy Policy'
    },
    de: {
      title: 'Masterface | Wir verwandeln Marken in Erlebnisse',
      meta: 'Masterface — Agentur für Events, Aktivierung und Messestände. Wir bringen Ideen zum Leben und Marken ins Feld.',
      menu: 'Menü', nav_projects: 'Projekte', nav_services: 'Leistungen', nav_about: 'Über uns', nav_refs: 'Referenzen', nav_contact: 'Kontakt',
      cta_quote: 'Angebot anfordern', lang_label: 'Sprache',
      hero_cta1: 'Unsere Projekte ansehen', hero_cta2: 'Gespräch anfragen',
      logos_label: 'Marken, mit denen wir arbeiten',
      services_kicker: 'Unsere Leistungen', services_h2: 'Von der Idee bis zum Einsatz — der ganze Prozess in einem Team',
      svc_cta_title: 'Sie haben einen anderen Bedarf?', svc_cta_link: 'Angebot anfordern →', svc_placeholder: '[Leistungsbild / Loop-Video]',
      projects_kicker: 'Projekte', projects_h2: 'Was wir vor Ort umsetzen', all: 'Alle',
      process_kicker: 'So arbeiten wir', process_h2: 'Ganzheitliches Management in drei Schritten',
      about_kicker: 'Über uns', gal_prev: 'Zurück', gal_next: 'Weiter', gal_alt: 'Masterface Foto vom Einsatz',
      contact_kicker: 'Kontakt', contact_h2: 'Planen wir Ihr Event gemeinsam',
      k_address: 'Adresse', k_phone: 'Telefon', k_email: 'E-Mail', k_instagram: 'Instagram', map_link: 'In Google Maps ansehen',
      single_day: 'Eintägig', start: 'Beginn', end: 'Ende', other: 'Sonstiges',
      submit: 'Angebot anfragen →', sending: 'Wird gesendet…', ok: 'Ihre Anfrage ist eingegangen. Wir melden uns in Kürze.',
      err: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns über WhatsApp.',
      wa: 'Per WhatsApp schreiben', footer_tag: 'Wir verwandeln Marken in Erlebnisse', privacy: 'Datenschutz'
    }
  };

  var state = { lang: 'tr', data: null, filter: '__all', singleDay: false };
  var LANG_KEY = 'mf_lang';

  function isLang(c) { return LANGS.some(function (l) { return l.code === c; }); }
  function getInitialLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && isLang(q)) return q;
    } catch (e) {}
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && isLang(saved)) return saved;
    } catch (e) {}
    return 'tr'; // ana dil
  }
  function ui(key) { return (UI[state.lang] && UI[state.lang][key]) || UI.tr[key] || ''; }
  // Kayıt alanı: dil Türkçe değilse item.i18n[dil][alan], boşsa Türkçe alan
  function L(item, field) {
    if (!item) return '';
    if (state.lang !== 'tr' && item.i18n && item.i18n[state.lang]) {
      var v = item.i18n[state.lang][field];
      if (v != null && String(v).trim() !== '') return v;
    }
    return item[field];
  }
  // Site metni: dil Türkçe değilse `anahtar_en` / `anahtar_de`, boşsa Türkçe
  function T(key) {
    var t = state.data.site_texts;
    if (state.lang !== 'tr') {
      var v = t[key + '_' + state.lang];
      if (v != null && String(v).trim() !== '') return v;
    }
    return t[key];
  }

  // ───────────────────────── Veri yükleme ─────────────────────────
  async function loadData() {
    // Tüm tablolar paralel çekilir; her biri kendi zaman aşımıyla bağımsız döner.
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
      (categoriesRows || []).forEach(function (c) { catsById[c.id] = c; });
      projects = projectsRows.map(function (p) {
        var cat = p.category_id && catsById[p.category_id];
        var i18n = JSON.parse(JSON.stringify(p.i18n || {}));
        ['en', 'de'].forEach(function (lg) {
          i18n[lg] = i18n[lg] || {};
          ['name', 'brand', 'city', 'year'].forEach(function (f) {
            if (!p[f] && !i18n[lg][f]) i18n[lg][f] = PH_I18N[lg][f];
          });
        });
        return {
          name: p.name || '[Proje adı]',
          brand: p.brand || '[Marka]',
          city: p.city || '[Şehir]',
          year: p.year || '[Yıl]',
          category: (cat && cat.label) || '[Kategori]',
          category_i18n: cat ? (cat.i18n || {}) : PH_CATEGORY,
          i18n: i18n,
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

  // ───────────────────────── Statik metinler (data-i18n) ─────────────────────────
  function applyStaticI18n() {
    document.documentElement.lang = state.lang;
    document.title = ui('title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', ui('meta'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (n) {
      n.textContent = ui(n.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (n) {
      n.setAttribute('aria-label', ui(n.getAttribute('data-i18n-aria')));
    });
    // map linkinde ikon korunur, sadece metin düğümü değişir (data-i18n span içinde)
    var cur = document.getElementById('lang-current');
    if (cur) cur.textContent = state.lang.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll('#lang-menu [data-lang]'), function (b) {
      var on = b.getAttribute('data-lang') === state.lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // ───────────────────────── Render: Hero / Hakkımızda metinleri / İletişim ─────────────────────────
  function renderTexts() {
    var set = function (id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; };
    set('hero-kicker', escapeHtml(T('hero_kicker')));
    set('hero-title', escapeHtml(T('hero_title')));
    set('hero-subtitle', escapeHtml(T('hero_subtitle')));
    set('about-title', escapeHtml(T('about_title')));
    set('about-body-1', escapeHtml(T('about_body_1')));
    set('about-body-2', escapeHtml(T('about_body_2')));
    set('contact-address', T('contact_address'));
    set('footer-bottom', escapeHtml(T('footer_bottom')));

    var t = state.data.site_texts;
    var phone = document.getElementById('contact-phone');
    if (phone) { phone.href = 'tel:' + t.contact_phone_tel; phone.textContent = t.contact_phone_display; }
    var email = document.getElementById('contact-email');
    if (email) { email.href = 'mailto:' + t.contact_email; email.textContent = t.contact_email; }
    var insta = document.getElementById('contact-instagram');
    if (insta) { insta.href = t.contact_instagram_url; insta.textContent = t.contact_instagram_handle; }
    var map = document.getElementById('contact-map');
    if (map) map.href = t.contact_map_url;
    // Harita gömme: koordinat Google Haritalar bağlantısındaki "@enlem,boylam" kısmından alınır;
    // yoksa adres metniyle aranır. Sadece adres değiştiyse iframe yeniden yüklenir.
    var frame = document.getElementById('contact-map-frame');
    if (frame) {
      var m = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(t.contact_map_url || '');
      var q = m ? (m[1] + ',' + m[2]) : encodeURIComponent(String(t.contact_address || '').replace(/<br\s*\/?>/gi, ', '));
      var src = 'https://maps.google.com/maps?q=' + q + '&z=15&hl=' + state.lang + '&output=embed';
      if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    }
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
    function closeNav() {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  // ───────────────────────── Dil seçici (açılır menü) ─────────────────────────
  function initLangSwitch() {
    var box = document.getElementById('lang-switch');
    var btn = document.getElementById('lang-btn');
    if (!box || !btn) return;
    function setOpen(o) {
      box.classList.toggle('open', o);
      btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!box.classList.contains('open')); });
    Array.prototype.forEach.call(box.querySelectorAll('[data-lang]'), function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-lang'));
        setOpen(false);
      });
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  function setLang(code) {
    if (!isLang(code) || code === state.lang) return;
    state.lang = code;
    try { localStorage.setItem(LANG_KEY, code); } catch (e) {}
    renderAll();
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
    startMarquee(track);
  }

  // Kayan logolar: JS ile (GPU transform) akar; parmak/fare ile sürüklenebilir, bırakınca devam eder.
  var marqueeRAF = null;
  function startMarquee(track) {
    if (marqueeRAF) cancelAnimationFrame(marqueeRAF);
    var host = track.parentNode;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var x = 0, vel = 0, SPEED = 40, dragging = false, hover = false, lastX = 0, lastT = 0, half = 0, prev = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    track.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', measure); });
    function wrap() { if (half > 0) { x = ((x % half) + half) % half - half; } }
    function draw() { track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; }
    x = -0.01; wrap(); draw();
    host.onpointerdown = function (e) {
      dragging = true; vel = 0; lastX = e.clientX; lastT = performance.now();
      host.classList.add('dragging');
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    host.onpointermove = function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - lastX, dt = Math.max(now - lastT, 1);
      x += dx; vel = dx / dt * 1000; lastX = e.clientX; lastT = now; wrap(); draw();
    };
    function end() { dragging = false; host.classList.remove('dragging'); }
    host.onpointerup = end; host.onpointercancel = end;
    host.onmouseenter = function () { hover = true; };
    host.onmouseleave = function () { hover = false; };
    function tick(t) {
      var dt = prev ? Math.min((t - prev) / 1000, 0.05) : 0; prev = t;
      if (!dragging) {
        if (Math.abs(vel) > SPEED) vel *= Math.pow(0.04, dt); // sürükleme ivmesi yavaşça söner
        else if (!reduce && !hover) vel = -SPEED;
        else vel = 0;
        x += vel * dt; wrap(); draw();
      }
      marqueeRAF = requestAnimationFrame(tick);
    }
    marqueeRAF = requestAnimationFrame(tick);
  }

  // ───────────────────────── Render: Stats ─────────────────────────
  function renderStats(stats) {
    var grid = document.getElementById('stats-grid');
    if (!grid) return;
    grid.innerHTML = '';
    stats.forEach(function (s) {
      var item = el('div', 'stat-item');
      item.appendChild(el('div', 'value', escapeHtml(s.value)));
      item.appendChild(el('div', 'label', escapeHtml(L(s, 'label'))));
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
        var img = el('img'); img.src = svc.image_url; img.alt = L(svc, 'title') || '';
        thumb.appendChild(img);
      } else {
        thumb.textContent = ui('svc_placeholder');
      }
      card.appendChild(thumb);
      var head = el('div', 'head');
      head.appendChild(el('span', 'no', String(i + 1).padStart(2, '0')));
      head.appendChild(el('h3', null, escapeHtml(L(svc, 'title'))));
      card.appendChild(head);
      card.appendChild(el('p', null, escapeHtml(L(svc, 'description'))));
      grid.appendChild(card);
    });
    var cta = el('article', 'service-cta');
    cta.appendChild(el('h3', null, escapeHtml(ui('svc_cta_title'))));
    var a = el('a', null, escapeHtml(ui('svc_cta_link'))); a.href = '#iletisim';
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
      card.appendChild(el('h3', null, escapeHtml(L(s, 'title'))));
      card.appendChild(el('p', null, escapeHtml(L(s, 'description'))));
      grid.appendChild(card);
    });
  }

  // ───────────────────────── Render: Projects + filtre chip'leri ─────────────────────────
  // Filtre anahtarı dilden bağımsız (Türkçe kategori adı) — dil değişince seçim korunur.
  function catLabel(p) {
    return L({ label: p.category, i18n: p.category_i18n }, 'label');
  }

  function renderChipsAndProjects() {
    var chipsWrap = document.getElementById('chips');
    var grid = document.getElementById('projects-grid');
    if (!chipsWrap || !grid) return;
    var all = state.data.projects;

    var cats = [];
    var seen = {};
    all.forEach(function (p) {
      if (!seen[p.category]) { seen[p.category] = true; cats.push({ key: p.category, label: catLabel(p) }); }
    });
    if (state.filter !== '__all' && !seen[state.filter]) state.filter = '__all';
    var chipList = [{ key: '__all', label: ui('all') }].concat(cats);

    chipsWrap.innerHTML = '';
    chipList.forEach(function (c) {
      var btn = el('button', 'chip' + (c.key === state.filter ? ' active' : ''), escapeHtml(c.label));
      btn.type = 'button';
      btn.addEventListener('click', function () {
        state.filter = c.key;
        renderChipsAndProjects();
      });
      chipsWrap.appendChild(btn);
    });

    var filtered = state.filter === '__all' ? all : all.filter(function (p) { return p.category === state.filter; });

    grid.innerHTML = '';
    filtered.forEach(function (p) {
      var thumb = p.youtube_id ? ('https://img.youtube.com/vi/' + p.youtube_id + '/hqdefault.jpg') : '';
      var url = p.youtube_id ? ('https://www.youtube.com/watch?v=' + p.youtube_id) : '#';
      var article = el('article', 'project-card');
      var a = el('a', 'thumb');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      var img = el('img'); img.src = thumb; img.alt = L(p, 'name');
      a.appendChild(img);
      a.appendChild(el('div', 'grad'));
      a.appendChild(el('div', 'cat', escapeHtml(catLabel(p))));
      var play = el('div', 'play');
      play.innerHTML = '<span><svg width="20" height="20" viewBox="0 0 20 20" fill="#111113"><path d="M5 3l12 7-12 7V3z"></path></svg></span>';
      a.appendChild(play);
      article.appendChild(a);
      var meta = el('div', 'meta');
      meta.appendChild(el('h3', null, escapeHtml(L(p, 'name'))));
      meta.appendChild(el('span', 'year', escapeHtml(L(p, 'year'))));
      article.appendChild(meta);
      article.appendChild(el('div', 'sub', escapeHtml(L(p, 'brand')) + ' · ' + escapeHtml(L(p, 'city'))));
      grid.appendChild(article);
    });
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
      img.alt = ui('gal_alt');
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
  function fieldLabel(f) {
    return escapeHtml(L(f, 'label')) + (f.required ? ' *' : '');
  }

  function renderForm() {
    var wrap = document.getElementById('contact-fields');
    if (!wrap) return;
    var fields = state.data.formFields;
    var services = state.data.services;

    // Dil değişince yazılmış değerler kaybolmasın
    var saved = {};
    Array.prototype.forEach.call(wrap.querySelectorAll('[name]'), function (n) { saved[n.name] = n.value; });
    wrap.innerHTML = '';

    // "Etkinlik türü" seçenekleri services'ten türer. Gönderilen değer her zaman
    // Türkçe başlıktır (panelde tutarlı görünsün); ekranda seçili dildeki ad görünür.
    var serviceOptions = services.map(function (s) { return { value: s.title, label: L(s, 'title') }; })
      .concat([{ value: 'Diğer', label: ui('other') }]);

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
        checkbox.checked = state.singleDay;
        checkRow.appendChild(checkbox);
        checkRow.appendChild(document.createTextNode(ui('single_day')));
        block.appendChild(checkRow);

        var dateArea = el('div');
        block.appendChild(dateArea);

        var renderDateArea = function () {
          dateArea.innerHTML = '';
          if (state.singleDay) {
            var single = el('input');
            single.type = 'date'; single.name = f.id; single.style.width = '100%';
            if (saved[f.id]) single.value = saved[f.id];
            dateArea.appendChild(single);
          } else {
            var row = el('div', 'fields-row');
            var startLabel = el('label', 'field half'); startLabel.style.fontSize = '13px';
            startLabel.appendChild(document.createTextNode(ui('start')));
            var start = el('input'); start.type = 'date'; start.name = f.id + 'Start';
            if (saved[f.id + 'Start']) start.value = saved[f.id + 'Start'];
            startLabel.appendChild(start);
            var endLabel = el('label', 'field half'); endLabel.style.fontSize = '13px';
            endLabel.appendChild(document.createTextNode(ui('end')));
            var end = el('input'); end.type = 'date'; end.name = f.id + 'End';
            if (saved[f.id + 'End']) end.value = saved[f.id + 'End'];
            endLabel.appendChild(end);
            row.appendChild(startLabel); row.appendChild(endLabel);
            dateArea.appendChild(row);
          }
        };
        renderDateArea();
        checkbox.addEventListener('change', function () {
          state.singleDay = checkbox.checked;
          saved = {};
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
        var opts = (f.options && f.options.length)
          ? f.options.map(function (o) { return { value: o, label: o }; })
          : serviceOptions;
        opts.forEach(function (opt) {
          var o = el('option', null, escapeHtml(opt.label));
          o.value = opt.value;
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
      if (saved[f.id] != null) input.value = saved[f.id];
      label.appendChild(input);
      wrap.appendChild(label);
    });
  }

  function initFormSubmit() {
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
      payload.lang = state.lang; // talebin hangi dilde geldiği panelde görünür
      if (feedback) feedback.innerHTML = '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = ui('sending'); }
      try {
        if (supabase) {
          var res = await supabase.from('form_submissions').insert([{ payload: payload }]);
          if (res.error) throw res.error;
        } else {
          console.info('Supabase bağlı değil, form verisi gönderilmedi (test modu):', payload);
        }
        if (feedback) feedback.appendChild(el('div', 'form-note ok', escapeHtml(ui('ok'))));
        form.reset();
      } catch (err) {
        console.error(err);
        if (feedback) feedback.appendChild(el('div', 'form-note err', escapeHtml(ui('err'))));
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = ui('submit'); }
      }
    });
  }

  // ───────────────────────── Tümünü çiz (dil değişince de çağrılır) ─────────────────────────
  function renderAll() {
    var d = state.data;
    applyStaticI18n();
    if (!d) return;
    renderTexts();
    renderStats(d.stats);
    renderServices(d.services);
    renderProcess(d.processSteps);
    renderChipsAndProjects();
    renderGallery();
    renderForm();
    var fb = document.getElementById('contact-feedback');
    if (fb) fb.innerHTML = '';
  }

  // ───────────────────────── Başlat ─────────────────────────
  function defaultsData() {
    return { site_texts: DEFAULTS.site_texts, logos: DEFAULTS.logos, stats: DEFAULTS.stats, services: DEFAULTS.services, processSteps: DEFAULTS.process_steps, galleryPhotos: DEFAULTS.gallery_photos, formFields: DEFAULTS.form_fields, projects: DEFAULTS.projects, socialLinks: DEFAULTS.social_links };
  }

  async function init() {
    // Türkçe dışı bir dil seçiliyse, veri gelene kadar Türkçe metin parlamasın diye
    // önce varsayılan (çevrili) içerikle çiz.
    if (state.lang !== 'tr') { state.data = defaultsData(); renderAll(); }
    state.data = await loadData();
    if (window.MF_THEME) { // panelden seçilen renk teması
      var theme = MF_THEME.fromTexts(state.data.site_texts);
      MF_THEME.apply(theme); MF_THEME.cache(theme);
    }
    renderLogos(state.data.logos);
    initGallery(state.data.galleryPhotos);
    initFormSubmit();
    renderSocialLinks(state.data.socialLinks);
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.lang = getInitialLang();
    applyStaticI18n();   // veri gelmeden menü/başlıklar seçili dilde görünsün
    initNavToggle();
    initLangSwitch();
    init();
  });
})();
