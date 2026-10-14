// Masterface — admin.js
// Supabase Auth ile giriş + tüm içerik tabloları için CRUD arayüzü.
// Not: RLS politikaları sadece "authenticated" kullanıcıya yazma izni verir,
// bu dosyadaki her insert/update/delete bu nedenle önce giriş gerektirir.

(function () {
  'use strict';

  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.indexOf('PASTE_') === 0) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML = '<div style="padding:60px;text-align:center;font-family:sans-serif">' +
        'Supabase bağlantısı yapılandırılmamış. <code>assets/js/config.js</code> içindeki ' +
        '<code>SUPABASE_ANON_KEY</code> değerini ayarlayın.</div>';
    });
    return;
  }

  var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  // ───────────────────────── DOM yardımcıları ─────────────────────────
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
  function slugify(s) {
    return String(s || '').toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('field-' + Date.now());
  }

  // ───────────────────────── Auth ─────────────────────────
  var loginScreen = document.getElementById('login-screen');
  var adminApp = document.getElementById('admin-app');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var logoutBtn = document.getElementById('logout-btn');

  function showApp() { loginScreen.hidden = true; adminApp.hidden = false; initPanels(); }
  function showLogin() { loginScreen.hidden = false; adminApp.hidden = true; }

  sb.auth.getSession().then(function (res) {
    if (res.data && res.data.session) showApp(); else showLogin();
  });
  sb.auth.onAuthStateChange(function (_event, session) {
    if (session) showApp(); else showLogin();
  });

  loginForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    loginError.textContent = '';
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    var btn = document.getElementById('login-submit');
    btn.disabled = true; btn.textContent = 'Giriş yapılıyor…';
    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    btn.disabled = false; btn.textContent = 'Giriş Yap';
    if (res.error) loginError.textContent = 'Giriş başarısız: ' + res.error.message;
  });

  logoutBtn.addEventListener('click', async function () {
    await sb.auth.signOut();
  });

  // ───────────────────────── Sekme yönlendirme ─────────────────────────
  var nav = document.getElementById('admin-nav');
  var root = document.getElementById('panel-root');
  var CURRENT_TAB = 'site_texts';

  nav.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-tab]');
    if (!btn) return;
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    CURRENT_TAB = btn.dataset.tab;
    renderTab(CURRENT_TAB);
  });

  function initPanels() { renderTab(CURRENT_TAB); }

  function renderTab(tab) {
    root.innerHTML = '<div class="loading">Yükleniyor…</div>';
    var fn = PANELS[tab];
    if (fn) fn(); else root.innerHTML = '<div class="empty-note">Bilinmeyen sekme.</div>';
  }

  // ───────────────────────── Genel CRUD motoru ─────────────────────────
  // config: { table, orderCol, title(item), subtitle(item), image(item),
  //           fields:[{name,label,type,options?}], label, hint, idType: 'uuid'|'text' }
  function genericPanel(config) {
    return async function () {
      var rows = [];
      try {
        var q = sb.from(config.table).select('*');
        if (config.orderCol) q = q.order(config.orderCol, { ascending: true });
        var res = await q;
        if (res.error) throw res.error;
        rows = res.data || [];
      } catch (e) {
        root.innerHTML = '<div class="form-note err">Veri alınamadı: ' + escapeHtml(e.message) + '</div>';
        return;
      }

      var extra = config.extraData ? await config.extraData() : {};

      var wrap = el('div', 'panel');
      wrap.appendChild(el('h2', null, escapeHtml(config.label)));
      if (config.hint) wrap.appendChild(el('p', 'hint', escapeHtml(config.hint)));

      var editHost = el('div');
      wrap.appendChild(editHost);

      var addBtn = el('button', 'btn-primary add-btn', '+ Yeni Ekle');
      addBtn.addEventListener('click', function () {
        renderEditForm(editHost, config, null, extra, function () { renderTab(CURRENT_TAB); });
      });
      wrap.appendChild(addBtn);

      var list = el('div');
      if (!rows.length) {
        list.appendChild(el('div', 'empty-note', 'Henüz içerik yok. Yukarıdaki butonla ekleyin.'));
      }
      rows.forEach(function (item, idx) {
        var card = el('div', 'item-card');
        if (config.image) {
          var src = config.image(item);
          if (src) {
            var img = el('img', 'thumb');
            img.src = src;
            card.appendChild(img);
          }
        }
        var main = el('div', 'main');
        main.appendChild(el('strong', null, escapeHtml(config.title(item))));
        if (config.subtitle) {
          var sub = config.subtitle(item);
          if (sub) main.appendChild(el('p', null, escapeHtml(sub)));
        }
        card.appendChild(main);

        var actions = el('div', 'item-actions');
        if (config.orderCol) {
          var up = el('button', null, '↑');
          up.disabled = idx === 0;
          up.addEventListener('click', function () { swapOrder(config, rows, idx, idx - 1); });
          var down = el('button', null, '↓');
          down.disabled = idx === rows.length - 1;
          down.addEventListener('click', function () { swapOrder(config, rows, idx, idx + 1); });
          actions.appendChild(up); actions.appendChild(down);
        }
        var editBtn = el('button', null, 'Düzenle');
        editBtn.addEventListener('click', function () {
          renderEditForm(editHost, config, item, extra, function () { renderTab(CURRENT_TAB); });
          editHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        actions.appendChild(editBtn);
        var delBtn = el('button', 'danger', 'Sil');
        delBtn.addEventListener('click', async function () {
          if (!confirm('Bu öğeyi silmek istediğinize emin misiniz?')) return;
          await sb.from(config.table).delete().eq('id', item.id);
          renderTab(CURRENT_TAB);
        });
        actions.appendChild(delBtn);
        card.appendChild(actions);
        list.appendChild(card);
      });
      wrap.appendChild(list);

      root.innerHTML = '';
      root.appendChild(wrap);
    };
  }

  async function swapOrder(config, rows, i, j) {
    var a = rows[i], b = rows[j];
    var aOrder = a[config.orderCol], bOrder = b[config.orderCol];
    await sb.from(config.table).update(toPatch(config, { sort_order: bOrder })).eq('id', a.id);
    await sb.from(config.table).update(toPatch(config, { sort_order: aOrder })).eq('id', b.id);
    renderTab(CURRENT_TAB);
  }
  function toPatch(config, obj) {
    var patch = {};
    patch[config.orderCol] = obj.sort_order;
    return patch;
  }

  function renderEditForm(host, config, item, extra, onDone) {
    host.innerHTML = '';
    var card = el('div', 'edit-card');
    card.appendChild(el('h3', null, item ? 'Düzenle' : 'Yeni Ekle'));

    var inputs = {};
    var row = el('div', 'row');
    config.fields.forEach(function (f) {
      var value = item ? item[f.name] : (f.default !== undefined ? f.default : '');
      var label = el('label');
      label.appendChild(document.createTextNode(f.label));
      var input;
      if (f.type === 'textarea') {
        input = el('textarea');
        input.value = value || '';
      } else if (f.type === 'select') {
        input = el('select');
        (f.options || []).forEach(function (opt) {
          var o = el('option', null, escapeHtml(opt.label));
          o.value = opt.value;
          if (String(opt.value) === String(value)) o.selected = true;
          input.appendChild(o);
        });
      } else if (f.type === 'checkbox') {
        input = el('input');
        input.type = 'checkbox';
        input.checked = !!value;
        label.className = 'checkbox-row';
      } else if (f.type === 'number') {
        input = el('input');
        input.type = 'number';
        input.value = value != null ? value : '';
      } else {
        input = el('input');
        input.type = 'text';
        input.value = value != null ? value : '';
      }
      if (f.disabledOnEdit && item) input.disabled = true;
      label.appendChild(input);
      row.appendChild(label);
      inputs[f.name] = { input: input, field: f };
    });
    card.appendChild(row);

    var actions = el('div', 'actions');
    var saveBtn = el('button', 'btn-primary', 'Kaydet');
    saveBtn.addEventListener('click', async function () {
      var payload = {};
      Object.keys(inputs).forEach(function (name) {
        var it = inputs[name].input, f = inputs[name].field;
        var val;
        if (f.type === 'checkbox') val = it.checked;
        else if (f.type === 'number') val = it.value === '' ? null : Number(it.value);
        else val = it.value;
        if (f.transformIn) val = f.transformIn(val);
        payload[name] = val;
      });
      if (config.beforeSave) payload = config.beforeSave(payload, item, extra);
      saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…';
      try {
        if (item) {
          var res1 = await sb.from(config.table).update(payload).eq('id', item.id);
          if (res1.error) throw res1.error;
        } else {
          if (!('sort_order' in payload) && config.orderCol === 'sort_order') payload.sort_order = Date.now() % 1000000;
          var res2 = await sb.from(config.table).insert([payload]);
          if (res2.error) throw res2.error;
        }
        onDone();
      } catch (e) {
        alert('Kaydedilemedi: ' + e.message);
        saveBtn.disabled = false; saveBtn.textContent = 'Kaydet';
      }
    });
    actions.appendChild(saveBtn);
    var cancelBtn = el('button', 'btn-secondary', 'Vazgeç');
    cancelBtn.addEventListener('click', function () { host.innerHTML = ''; });
    actions.appendChild(cancelBtn);
    card.appendChild(actions);

    host.appendChild(card);
  }

  // ───────────────────────── Sekme tanımları ─────────────────────────
  var PANELS = {};

  PANELS.categories = genericPanel({
    table: 'categories', orderCol: 'sort_order', label: 'Kategoriler',
    hint: 'Projeler bu kategorilere göre filtrelenir.',
    title: function (i) { return i.label; },
    fields: [{ name: 'label', label: 'Kategori adı', type: 'text' }]
  });

  PANELS.projects = genericPanel({
    table: 'projects', orderCol: 'sort_order', label: 'Projeler',
    hint: 'Her projeye bir YouTube video kimliği (ID) ve kategori atayın.',
    title: function (i) { return i.name || '[Proje adı]'; },
    subtitle: function (i) { return (i.brand || '') + ' · ' + (i.city || '') + ' · ' + (i.year || ''); },
    image: function (i) { return i.youtube_id ? ('https://img.youtube.com/vi/' + i.youtube_id + '/hqdefault.jpg') : null; },
    extraData: async function () {
      var res = await sb.from('categories').select('*').order('sort_order', { ascending: true });
      return { categories: res.data || [] };
    },
    fields: [
      { name: 'name', label: 'Proje adı', type: 'text' },
      { name: 'brand', label: 'Marka', type: 'text' },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'year', label: 'Yıl', type: 'text' },
      { name: 'youtube_id', label: 'YouTube video ID', type: 'text' },
      { name: 'category_id', label: 'Kategori', type: 'select', options: [] } // beforeSave'de doldurulur
    ],
    beforeSave: function (payload) { return payload; }
  });
  // projects için kategori seçeneklerini dinamik doldur
  (function () {
    var original = PANELS.projects;
    PANELS.projects = async function () {
      var res = await sb.from('categories').select('*').order('sort_order', { ascending: true });
      var cats = res.data || [];
      var cfg = {
        table: 'projects', orderCol: 'sort_order', label: 'Projeler',
        hint: 'Her projeye bir YouTube video kimliği (ID) ve kategori atayın. Önce Kategoriler sekmesinden kategori ekleyin.',
        title: function (i) { return i.name || '[Proje adı]'; },
        subtitle: function (i) {
          var catLabel = (cats.find(function (c) { return c.id === i.category_id; }) || {}).label || '[Kategori]';
          return (i.brand || '[Marka]') + ' · ' + (i.city || '[Şehir]') + ' · ' + (i.year || '[Yıl]') + ' · ' + catLabel;
        },
        image: function (i) { return i.youtube_id ? ('https://img.youtube.com/vi/' + i.youtube_id + '/hqdefault.jpg') : null; },
        fields: [
          { name: 'name', label: 'Proje adı', type: 'text' },
          { name: 'brand', label: 'Marka', type: 'text' },
          { name: 'city', label: 'Şehir', type: 'text' },
          { name: 'year', label: 'Yıl', type: 'text' },
          { name: 'youtube_id', label: 'YouTube video ID', type: 'text' },
          { name: 'category_id', label: 'Kategori', type: 'select', options: cats.map(function (c) { return { value: c.id, label: c.label }; }) }
        ]
      };
      genericPanel(cfg)();
    };
  })();

  PANELS.services = genericPanel({
    table: 'services', orderCol: 'sort_order', label: 'Hizmetlerimiz',
    hint: 'Buradaki başlıklar, iletişim formundaki "Etkinlik türü" seçeneklerini de otomatik günceller.',
    title: function (i) { return i.title; },
    subtitle: function (i) { return i.description; },
    image: function (i) { return i.image_url; },
    fields: [
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'textarea' },
      { name: 'image_url', label: 'Görsel URL (opsiyonel)', type: 'text' }
    ]
  });

  PANELS.logos = genericPanel({
    table: 'logos', orderCol: 'sort_order', label: 'Birlikte Çalıştığımız Markalar',
    title: function (i) { return i.label; },
    image: function (i) { return i.image_url; },
    fields: [
      { name: 'label', label: 'Marka adı', type: 'text' },
      { name: 'image_url', label: 'Logo görsel URL', type: 'text' }
    ]
  });

  PANELS.stats = genericPanel({
    table: 'stats', orderCol: 'sort_order', label: 'Rakamlar',
    title: function (i) { return i.value + ' — ' + i.label; },
    fields: [
      { name: 'value', label: 'Değer (örn: 150+)', type: 'text' },
      { name: 'label', label: 'Etiket', type: 'text' }
    ]
  });

  PANELS.gallery_photos = genericPanel({
    table: 'gallery_photos', orderCol: 'sort_order', label: 'Hakkımızda Galerisi',
    hint: 'Kart yığını slider burada görünen sırayla ilerler.',
    title: function (i) { return i.image_url ? i.image_url.split('/').pop() : '[görsel]'; },
    image: function (i) { return i.image_url; },
    fields: [{ name: 'image_url', label: 'Görsel URL', type: 'text' }]
  });

  PANELS.process_steps = genericPanel({
    table: 'process_steps', orderCol: 'sort_order', label: 'Nasıl Çalışıyoruz (Süreç)',
    title: function (i) { return i.title; },
    subtitle: function (i) { return i.description; },
    fields: [
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'textarea' }
    ]
  });

  PANELS.form_fields = genericPanel({
    table: 'form_fields', orderCol: 'sort_order', label: 'İletişim Formu Alanları',
    hint: '"Etkinlik türü" (select) seçeneklerini özel olarak buraya yazmazsanız, Hizmetlerimiz başlıklarından otomatik gelir.',
    title: function (i) { return i.label + ' (' + i.type + ')' + (i.required ? ' · zorunlu' : ''); },
    subtitle: function (i) { return 'Alan kimliği: ' + i.id + ' · Genişlik: ' + (i.width === 'full' ? 'Tam' : 'Yarım'); },
    fields: [
      { name: 'id', label: 'Alan kimliği (benzersiz)', type: 'text', disabledOnEdit: true, default: '' },
      { name: 'label', label: 'Etiket', type: 'text' },
      { name: 'type', label: 'Tip', type: 'select', options: [
        { value: 'text', label: 'Metin' }, { value: 'email', label: 'E-posta' }, { value: 'phone', label: 'Telefon' },
        { value: 'select', label: 'Seçim listesi' }, { value: 'textarea', label: 'Uzun metin' }, { value: 'daterange', label: 'Tarih aralığı / tek gün' }
      ] },
      { name: 'required', label: 'Zorunlu mu?', type: 'checkbox' },
      { name: 'width', label: 'Genişlik', type: 'select', options: [{ value: 'half', label: 'Yarım' }, { value: 'full', label: 'Tam' }] },
      { name: 'options', label: 'Seçenekler (virgülle ayır, sadece "Seçim listesi" için)', type: 'text',
        transformIn: function (v) { return v ? v.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : null; } }
    ],
    beforeSave: function (payload, item) {
      if (!item && !payload.id) payload.id = slugify(payload.label);
      if (item) delete payload.id; // id değiştirilemez
      return payload;
    }
  });
  // options alanı düzenlerken diziyi tekrar metne çevir
  (function () {
    var original = genericPanel;
  })();

  // ───────────────────────── Site Metinleri (anahtar/değer) ─────────────────────────
  var SITE_TEXT_KEYS = [
    { key: 'hero_kicker', label: 'Hero — küçük başlık', type: 'text' },
    { key: 'hero_title', label: 'Hero — başlık', type: 'text' },
    { key: 'hero_subtitle', label: 'Hero — alt metin', type: 'textarea' },
    { key: 'about_title', label: 'Hakkımızda — başlık', type: 'text' },
    { key: 'about_body_1', label: 'Hakkımızda — 1. paragraf', type: 'textarea' },
    { key: 'about_body_2', label: 'Hakkımızda — 2. paragraf', type: 'textarea' },
    { key: 'whatsapp_number', label: 'WhatsApp numarası (ülke kodu ile, örn: 905536872886)', type: 'text' },
    { key: 'contact_address', label: 'Adres (HTML <br> kullanılabilir)', type: 'textarea' },
    { key: 'contact_phone_display', label: 'Telefon (görünen)', type: 'text' },
    { key: 'contact_phone_tel', label: 'Telefon (tel: linki, örn: +905536872886)', type: 'text' },
    { key: 'contact_email', label: 'E-posta', type: 'text' },
    { key: 'contact_instagram_handle', label: 'Instagram (görünen, örn: @masterfaceagency)', type: 'text' },
    { key: 'contact_instagram_url', label: 'Instagram URL', type: 'text' },
    { key: 'contact_map_url', label: 'Google Haritalar URL', type: 'text' },
    { key: 'footer_bottom', label: 'Footer alt metni (telif)', type: 'text' }
  ];

  PANELS.site_texts = async function () {
    var res = await sb.from('site_texts').select('*');
    var current = {};
    (res.data || []).forEach(function (row) { current[row.key] = row.value; });

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Site Metinleri'));
    wrap.appendChild(el('p', 'hint', 'Ana sayfadaki sabit metinleri buradan düzenleyin.'));

    var card = el('div', 'edit-card');
    var inputs = {};
    SITE_TEXT_KEYS.forEach(function (k) {
      var label = el('label');
      label.appendChild(document.createTextNode(k.label));
      var input = k.type === 'textarea' ? el('textarea') : el('input');
      if (k.type !== 'textarea') input.type = 'text';
      input.value = current[k.key] || '';
      label.appendChild(input);
      card.appendChild(label);
      inputs[k.key] = input;
    });
    var saveBtn = el('button', 'btn-primary', 'Kaydet');
    saveBtn.addEventListener('click', async function () {
      saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…';
      var rows = SITE_TEXT_KEYS.map(function (k) { return { key: k.key, value: inputs[k.key].value }; });
      var res2 = await sb.from('site_texts').upsert(rows);
      saveBtn.disabled = false; saveBtn.textContent = 'Kaydet';
      if (res2.error) alert('Kaydedilemedi: ' + res2.error.message);
      else alert('Kaydedildi.');
    });
    card.appendChild(saveBtn);
    wrap.appendChild(card);

    root.innerHTML = '';
    root.appendChild(wrap);
  };

  // ───────────────────────── Ayarlar (form_recipients) ─────────────────────────
  PANELS.settings = async function () {
    var res = await sb.from('settings').select('*').eq('key', 'form_recipients').maybeSingle();
    var current = (res.data && res.data.value) || ['info@masterface.com.tr'];

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Ayarlar'));
    wrap.appendChild(el('p', 'hint', '"Teklif İste" formundan gelen talepler hangi e-posta adres(ler)ine iletilsin?'));

    var card = el('div', 'edit-card');
    var label = el('label');
    label.appendChild(document.createTextNode('E-posta adresleri (virgülle ayırın)'));
    var input = el('input');
    input.type = 'text';
    input.value = current.join(', ');
    label.appendChild(input);
    card.appendChild(label);

    var saveBtn = el('button', 'btn-primary', 'Kaydet');
    saveBtn.addEventListener('click', async function () {
      var list = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…';
      var res2 = await sb.from('settings').upsert([{ key: 'form_recipients', value: list }]);
      saveBtn.disabled = false; saveBtn.textContent = 'Kaydet';
      if (res2.error) alert('Kaydedilemedi: ' + res2.error.message);
      else alert('Kaydedildi.');
    });
    card.appendChild(saveBtn);
    wrap.appendChild(card);

    root.innerHTML = '';
    root.appendChild(wrap);
  };

  // ───────────────────────── Gelen Talepler (form_submissions) ─────────────────────────
  PANELS.form_submissions = async function () {
    var res = await sb.from('form_submissions').select('*').order('created_at', { ascending: false });
    var rows = res.data || [];

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Gelen Talepler'));
    wrap.appendChild(el('p', 'hint', 'İletişim formundan gönderilen başvurular.'));

    if (!rows.length) wrap.appendChild(el('div', 'empty-note', 'Henüz başvuru yok.'));

    rows.forEach(function (r) {
      var card = el('div', 'item-card');
      var main = el('div', 'main');
      var date = new Date(r.created_at).toLocaleString('tr-TR');
      main.appendChild(el('strong', null, escapeHtml(date)));
      var pretty = Object.keys(r.payload || {}).map(function (k) {
        return k + ': ' + r.payload[k];
      }).join('\n');
      main.appendChild(el('p', null, escapeHtml(pretty)));
      card.appendChild(main);

      var actions = el('div', 'item-actions');
      var delBtn = el('button', 'danger', 'Sil');
      delBtn.addEventListener('click', async function () {
        if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return;
        await sb.from('form_submissions').delete().eq('id', r.id);
        renderTab('form_submissions');
      });
      actions.appendChild(delBtn);
      card.appendChild(actions);

      wrap.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(wrap);
  };
})();
