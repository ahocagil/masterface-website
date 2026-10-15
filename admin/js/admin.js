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

  // Kullanıcı adı girilirse sonuna config.js'teki alan adı eklenir
  // (Supabase Auth e-posta biçimi ister); "@" içeriyorsa olduğu gibi kullanılır.
  function toLoginEmail(value) {
    var v = String(value || '').trim();
    if (v.indexOf('@') !== -1) return v;
    return v.toLowerCase() + '@' + (window.ADMIN_EMAIL_DOMAIN || 'masterface.com.tr');
  }

  loginForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    loginError.textContent = '';
    var email = toLoginEmail(document.getElementById('login-email').value);
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

  // Mobil hamburger menü
  var navToggle = document.getElementById('admin-nav-toggle');
  function setNavOpen(open) {
    nav.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  navToggle.addEventListener('click', function () { setNavOpen(!nav.classList.contains('open')); });

  nav.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-tab]');
    if (!btn) return;
    setNavOpen(false);
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
        list.appendChild(el('div', 'empty-note', escapeHtml(config.emptyText || 'Henüz içerik yok. Yukarıdaki butonla ekleyin.')));
      }
      rows.forEach(function (item, idx) {
        var card = el('div', 'item-card');
        if (config.image) {
          var src = config.image(item);
          if (src) {
            var img = el('img', 'thumb');
            // "assets/..." gibi göreli yollar /admin altında kırılmasın
            img.src = /^(https?:)?\/|^data:/.test(src) ? src : '../' + src;
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

  // Görsel alanı: URL kutusunun altına "Görsel yükle" butonu (Supabase Storage → "media" kovası).
  var MAX_UPLOAD_MB = 8;
  function attachImageUpload(label, urlInput, f) {
    urlInput.placeholder = 'https://… veya assets/… (ya da aşağıdan yükleyin)';
    var bar = el('div', 'upload-bar');
    var btn = el('button', 'btn-secondary upload-btn', 'Görsel yükle');
    btn.type = 'button';
    var file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    var status = el('span', 'upload-status');
    var preview = el('img', 'upload-preview'); preview.alt = '';
    function showPreview() {
      var v = urlInput.value.trim();
      if (!v) { preview.hidden = true; return; }
      preview.src = /^(https?:)?\//.test(v) ? v : '/' + v;
      preview.hidden = false;
    }
    preview.onerror = function () { preview.hidden = true; };
    urlInput.addEventListener('change', showPreview);
    showPreview();
    btn.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', async function () {
      var fl = file.files && file.files[0];
      if (!fl) return;
      if (fl.size > MAX_UPLOAD_MB * 1024 * 1024) { status.textContent = 'Dosya ' + MAX_UPLOAD_MB + ' MB\'ı geçemez.'; status.className = 'upload-status err'; return; }
      btn.disabled = true; status.className = 'upload-status'; status.textContent = 'Yükleniyor…';
      try {
        var ext = (fl.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        var base = slugify(fl.name.replace(/\.[^.]+$/, '')) || 'gorsel';
        var path = (f.folder || 'genel') + '/' + Date.now() + '-' + base + '.' + ext;
        var up = await sb.storage.from('media').upload(path, fl, { contentType: fl.type || undefined, upsert: false });
        if (up.error) throw up.error;
        var pub = sb.storage.from('media').getPublicUrl(path);
        urlInput.value = pub.data.publicUrl;
        showPreview();
        status.textContent = 'Yüklendi — Kaydet\'e basmayı unutmayın.';
      } catch (e) {
        status.className = 'upload-status err';
        status.textContent = 'Yüklenemedi: ' + (e.message || e);
      } finally {
        btn.disabled = false; file.value = '';
      }
    });
    bar.appendChild(btn); bar.appendChild(status); bar.appendChild(file);
    label.appendChild(bar);
    label.appendChild(preview);
  }

  var I18N_LANGS = [{ code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }];

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
      if (f.type === 'image') attachImageUpload(label, input, f);
      row.appendChild(label);
      inputs[f.name] = { input: input, field: f };
    });
    card.appendChild(row);

    // Çeviriler (EN / DE): config.i18n = çevrilebilir alan adları. Boş bırakılan çeviri sitede Türkçe metne düşer.
    var i18nInputs = {};
    if (config.i18n && config.i18n.length) {
      card.appendChild(el('h4', 'i18n-title', 'Çeviriler <small>(boş bırakılırsa Türkçe metin gösterilir)</small>'));
      var cols = el('div', 'i18n-cols');
      I18N_LANGS.forEach(function (lg) {
        var col = el('div', 'i18n-col');
        col.appendChild(el('div', 'i18n-lang', escapeHtml(lg.name)));
        i18nInputs[lg.code] = {};
        config.i18n.forEach(function (fname) {
          var f = config.fields.filter(function (x) { return x.name === fname; })[0] || { label: fname, type: 'text' };
          var lab = el('label');
          lab.appendChild(document.createTextNode(f.label + ' (' + lg.code.toUpperCase() + ')'));
          var inp = f.type === 'textarea' ? el('textarea') : el('input');
          if (f.type !== 'textarea') inp.type = 'text';
          var cur = item && item.i18n && item.i18n[lg.code] ? item.i18n[lg.code][fname] : '';
          inp.value = cur || '';
          lab.appendChild(inp);
          col.appendChild(lab);
          i18nInputs[lg.code][fname] = inp;
        });
        cols.appendChild(col);
      });
      card.appendChild(cols);
    }

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
      if (config.i18n && config.i18n.length) {
        var tr = {};
        I18N_LANGS.forEach(function (lg) {
          var o = {};
          config.i18n.forEach(function (fname) {
            var v = i18nInputs[lg.code][fname].value.trim();
            if (v) o[fname] = v;
          });
          if (Object.keys(o).length) tr[lg.code] = o;
        });
        payload.i18n = Object.keys(tr).length ? tr : null;
      }
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
    table: 'categories', orderCol: 'sort_order', label: 'Kategoriler', i18n: ['label'],
    hint: 'Ana sayfadaki "Sahada ürettiklerimiz" bölümünde, proje kartlarının üstündeki filtre butonları (Tümü, ...) ve her kartın sol üstündeki etiket buradan gelir. Önce kategori ekleyin, sonra Projeler sekmesinde her projeye bir kategori seçin.',
    emptyText: 'Henüz kategori yok, bu yüzden projeler sitede "[Kategori]" etiketiyle görünüyor. "+ Yeni Ekle" ile kategorileri (ör. Festival, Roadshow) ekleyin.',
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
        table: 'projects', orderCol: 'sort_order', label: 'Projeler', i18n: ['name', 'brand', 'city'],
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
    table: 'services', orderCol: 'sort_order', label: 'Hizmetlerimiz', i18n: ['title', 'description'],
    hint: 'Buradaki başlıklar, iletişim formundaki "Etkinlik türü" seçeneklerini de otomatik günceller.',
    title: function (i) { return i.title; },
    subtitle: function (i) { return i.description; },
    image: function (i) { return i.image_url; },
    fields: [
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'textarea' },
      { name: 'image_url', label: 'Görsel (opsiyonel)', type: 'image', folder: 'hizmetler' }
    ]
  });

  PANELS.logos = genericPanel({
    table: 'logos', orderCol: 'sort_order', label: 'Birlikte Çalıştığımız Markalar',
    title: function (i) { return i.label; },
    image: function (i) { return i.image_url; },
    fields: [
      { name: 'label', label: 'Marka adı', type: 'text' },
      { name: 'image_url', label: 'Logo görseli', type: 'image', folder: 'logolar' }
    ]
  });

  PANELS.stats = genericPanel({
    table: 'stats', orderCol: 'sort_order', label: 'Rakamlar', i18n: ['label'],
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
    fields: [{ name: 'image_url', label: 'Görsel', type: 'image', folder: 'galeri' }]
  });

  PANELS.process_steps = genericPanel({
    table: 'process_steps', orderCol: 'sort_order', label: 'Nasıl Çalışıyoruz (Süreç)', i18n: ['title', 'description'],
    title: function (i) { return i.title; },
    subtitle: function (i) { return i.description; },
    fields: [
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'textarea' }
    ]
  });

  PANELS.form_fields = genericPanel({
    table: 'form_fields', orderCol: 'sort_order', label: 'İletişim Formu Alanları', i18n: ['label'],
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

  var SOCIAL_PLATFORM_OPTIONS = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'x', label: 'X (Twitter)' }
  ];
  var SOCIAL_PLATFORM_LABELS = {};
  SOCIAL_PLATFORM_OPTIONS.forEach(function (o) { SOCIAL_PLATFORM_LABELS[o.value] = o.label; });

  PANELS.social_links = genericPanel({
    table: 'social_links', orderCol: 'sort_order', label: 'Sosyal Medya',
    hint: 'Site altında (footer) görünen sosyal medya ikonları — platforma göre ikon otomatik seçilir. Buradan ekleyip çıkarabilirsiniz.',
    title: function (i) { return SOCIAL_PLATFORM_LABELS[i.platform] || i.platform; },
    subtitle: function (i) { return i.url; },
    fields: [
      { name: 'platform', label: 'Platform', type: 'select', options: SOCIAL_PLATFORM_OPTIONS },
      { name: 'url', label: 'Profil URL', type: 'text' }
    ]
  });

  // ───────────────────────── Site Metinleri (anahtar/değer) ─────────────────────────
  var SITE_TEXT_KEYS = [
    { key: 'hero_kicker', label: 'Hero — küçük başlık', type: 'text', i18n: true },
    { key: 'hero_title', label: 'Hero — başlık', type: 'text', i18n: true },
    { key: 'hero_subtitle', label: 'Hero — alt metin', type: 'textarea', i18n: true },
    { key: 'about_title', label: 'Hakkımızda — başlık', type: 'text', i18n: true },
    { key: 'about_body_1', label: 'Hakkımızda — 1. paragraf', type: 'textarea', i18n: true },
    { key: 'about_body_2', label: 'Hakkımızda — 2. paragraf', type: 'textarea', i18n: true },
    { key: 'whatsapp_number', label: 'WhatsApp numarası (ülke kodu ile, örn: 905536872886)', type: 'text' },
    { key: 'contact_address', label: 'Adres (HTML <br> kullanılabilir)', type: 'textarea', i18n: true },
    { key: 'contact_phone_display', label: 'Telefon (görünen)', type: 'text' },
    { key: 'contact_phone_tel', label: 'Telefon (tel: linki, örn: +905536872886)', type: 'text' },
    { key: 'contact_email', label: 'E-posta', type: 'text' },
    { key: 'contact_instagram_handle', label: 'Instagram (görünen, örn: @masterfaceagency)', type: 'text' },
    { key: 'contact_instagram_url', label: 'Instagram URL', type: 'text' },
    { key: 'contact_map_url', label: 'Google Haritalar URL', type: 'text' },
    { key: 'footer_bottom', label: 'Footer alt metni (telif)', type: 'text', i18n: true }
  ];

  PANELS.site_texts = async function () {
    var res = await sb.from('site_texts').select('*');
    var current = {};
    (res.data || []).forEach(function (row) { current[row.key] = row.value; });

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Site Metinleri'));
    wrap.appendChild(el('p', 'hint', 'Ana sayfadaki sabit metinleri buradan düzenleyin. Ana dil Türkçe\'dir; İngilizce ve Almanca sekmelerinde boş bıraktığınız metin sitede Türkçe görünür. Telefon, e-posta, WhatsApp gibi dile bağlı olmayan alanlar yalnızca Türkçe sekmesindedir.'));

    var tabs = el('div', 'lang-tabs');
    var langs = [{ code: 'tr', name: 'Türkçe' }, { code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }];
    var card = el('div', 'edit-card');
    var inputs = {};
    var groups = {};

    langs.forEach(function (lg) {
      var group = el('div', 'lang-group');
      group.hidden = lg.code !== 'tr';
      groups[lg.code] = group;
      SITE_TEXT_KEYS.forEach(function (k) {
        if (lg.code !== 'tr' && !k.i18n) return;
        var dbKey = lg.code === 'tr' ? k.key : k.key + '_' + lg.code;
        var label = el('label');
        label.appendChild(document.createTextNode(k.label + (lg.code === 'tr' ? '' : ' (' + lg.code.toUpperCase() + ')')));
        var input = k.type === 'textarea' ? el('textarea') : el('input');
        if (k.type !== 'textarea') input.type = 'text';
        input.value = current[dbKey] || '';
        if (lg.code !== 'tr') input.placeholder = current[k.key] || '';
        label.appendChild(input);
        group.appendChild(label);
        inputs[dbKey] = input;
      });
      card.appendChild(group);

      var tab = el('button', 'lang-tab' + (lg.code === 'tr' ? ' active' : ''), escapeHtml(lg.name));
      tab.type = 'button';
      tab.addEventListener('click', function () {
        Object.keys(groups).forEach(function (c) { groups[c].hidden = c !== lg.code; });
        Array.prototype.forEach.call(tabs.children, function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
      });
      tabs.appendChild(tab);
    });
    wrap.appendChild(tabs);

    var saveBtn = el('button', 'btn-primary', 'Kaydet');
    saveBtn.addEventListener('click', async function () {
      saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…';
      var rows = Object.keys(inputs).map(function (key) { return { key: key, value: inputs[key].value }; });
      var res2 = await sb.from('site_texts').upsert(rows);
      saveBtn.disabled = false; saveBtn.textContent = 'Kaydet';
      if (res2.error) alert('Kaydedilemedi: ' + res2.error.message);
      else alert('Kaydedildi (üç dil).');
    });
    card.appendChild(saveBtn);
    wrap.appendChild(card);

    root.innerHTML = '';
    root.appendChild(wrap);
  };

  // ───────────────────────── Renkler (site geneli tema) ─────────────────────────
  var THEME_FIELDS = [
    { key: 'bg', label: 'Ana arka plan (koyu)', hint: 'Sayfanın genel koyu zemini: hero, projeler, footer.' },
    { key: 'bg_alt', label: 'İkinci koyu zemin', hint: 'Logo bandı ve "Nasıl çalışıyoruz" bölümü.' },
    { key: 'ink', label: 'Koyu zemin üstündeki yazı', hint: 'Başlıklar ve metinler. Soluk tonlar otomatik türer.' },
    { key: 'accent', label: 'Vurgu rengi', hint: '"Teklif Al" düğmesi, çizgiler, rakamlar, seçili filtre.' },
    { key: 'cream', label: 'Açık bölüm zemini', hint: 'Hizmetler ve İletişim bölümlerinin arka planı.' },
    { key: 'cream_ink', label: 'Açık bölümdeki yazı', hint: 'Açık zeminli bölümlerin yazı ve düğme rengi.' }
  ];
  var THEME_PRESETS = [
    { name: 'Varsayılan', c: { bg: '#111113', bg_alt: '#1A1A1E', ink: '#F4F1EA', accent: '#FF5A36', cream: '#F4F1EA', cream_ink: '#111113' } },
    { name: 'Gece mavisi', c: { bg: '#0E1424', bg_alt: '#151D33', ink: '#EEF2FA', accent: '#4F8CFF', cream: '#EEF2FA', cream_ink: '#0E1424' } },
    { name: 'Orman', c: { bg: '#0F1A14', bg_alt: '#16251C', ink: '#F1F5EE', accent: '#7BD389', cream: '#F1F5EE', cream_ink: '#0F1A14' } },
    { name: 'Bordo', c: { bg: '#1A0F13', bg_alt: '#26151B', ink: '#F7EFEA', accent: '#E8506A', cream: '#F7EFEA', cream_ink: '#1A0F13' } },
    { name: 'Altın', c: { bg: '#14110C', bg_alt: '#1E1A12', ink: '#F6F1E6', accent: '#E8B33C', cream: '#F6F1E6', cream_ink: '#14110C' } }
  ];

  PANELS.colors = async function () {
    var T = window.MF_THEME;
    var keys = T.ORDER.map(function (k) { return 'theme_' + k; });
    var res = await sb.from('site_texts').select('*').in('key', keys);
    var current = {};
    (res.data || []).forEach(function (row) { current['theme_' + row.key.replace('theme_', '')] = row.value; });
    var colors = T.fromTexts(current);

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Renkler'));
    wrap.appendChild(el('p', 'hint', 'Sitenin tüm renkleri buradaki 6 ana renkten türer. Kenarlıklar, soluk yazılar, vurgu üstündeki yazı (siyah/beyaz) ve açık bölümlerdeki vurgulu yazılar otomatik hesaplanır. Önizlemede değişikliği görün, beğenirseniz Kaydet\'e basın.'));

    var presets = el('div', 'theme-presets');
    var card = el('div', 'edit-card');
    var inputs = {};
    var preview = el('div', 'theme-preview');
    var warn = el('div', 'theme-warn');

    function refresh() {
      T.apply(colors, preview);
      var msgs = [];
      if (T.contrast(colors.ink, colors.bg) < 4.5) msgs.push('Koyu zemin üstündeki yazı okunaklı değil (kontrast düşük).');
      if (T.contrast(colors.cream_ink, colors.cream) < 4.5) msgs.push('Açık bölümdeki yazı okunaklı değil (kontrast düşük).');
      if (T.contrast(colors.accent, colors.bg) < 3) msgs.push('Vurgu rengi koyu zeminde zor seçiliyor.');
      warn.innerHTML = msgs.length ? msgs.map(function (m) { return '<div>⚠ ' + escapeHtml(m) + '</div>'; }).join('') : '';
      T.ORDER.forEach(function (k) {
        inputs[k].color.value = colors[k].toLowerCase();
        inputs[k].text.value = colors[k];
      });
    }

    THEME_PRESETS.forEach(function (p) {
      var b = el('button', 'theme-preset');
      b.type = 'button';
      b.innerHTML = '<span class="sw">' + [p.c.bg, p.c.accent, p.c.cream].map(function (x) { return '<i style="background:' + x + '"></i>'; }).join('') + '</span>' + escapeHtml(p.name);
      b.addEventListener('click', function () { colors = T.normalize(p.c); refresh(); });
      presets.appendChild(b);
    });
    wrap.appendChild(presets);

    var grid = el('div', 'theme-grid');
    THEME_FIELDS.forEach(function (f) {
      var row = el('label', 'theme-row');
      row.appendChild(el('span', 'theme-label', escapeHtml(f.label) + '<small>' + escapeHtml(f.hint) + '</small>'));
      var ctl = el('span', 'theme-ctl');
      var color = el('input'); color.type = 'color';
      var text = el('input'); text.type = 'text'; text.maxLength = 7; text.spellcheck = false;
      color.addEventListener('input', function () { colors[f.key] = color.value.toUpperCase(); refresh(); });
      text.addEventListener('input', function () {
        var v = text.value.trim(); if (v && v[0] !== '#') v = '#' + v;
        if (T.isHex(v)) { colors[f.key] = v.toUpperCase(); refresh(); }
      });
      text.addEventListener('blur', function () { text.value = colors[f.key]; });
      ctl.appendChild(color); ctl.appendChild(text);
      row.appendChild(ctl);
      grid.appendChild(row);
      inputs[f.key] = { color: color, text: text };
    });
    card.appendChild(grid);

    preview.innerHTML =
      '<div class="tp-dark"><div class="tp-kicker">ETKİNLİK · AKTİVASYON</div><div class="tp-title">Markaları deneyime dönüştürüyoruz</div><div class="tp-sub">Soluk metin örneği: yaratıcı fikirleri sahaya taşıyoruz.</div>' +
      '<div class="tp-btns"><span class="tp-btn">Teklif Al</span><span class="tp-chip">Tümü</span><span class="tp-chip off">Festival</span></div></div>' +
      '<div class="tp-alt"><b>150+</b> Tamamlanan proje</div>' +
      '<div class="tp-light"><div class="tp-lkicker">HİZMETLERİMİZ</div><div class="tp-card"><span class="tp-no">01</span> Festival ve Etkinlik Yönetimi<p>Açık bölümdeki açıklama metni örneği.</p></div><span class="tp-dbtn">Teklif İste →</span></div>';
    card.appendChild(el('h3', null, 'Önizleme'));
    card.appendChild(preview);
    card.appendChild(warn);

    var actions = el('div', 'actions');
    var save = el('button', 'btn-primary', 'Kaydet');
    save.addEventListener('click', async function () {
      save.disabled = true; save.textContent = 'Kaydediliyor…';
      var rows = T.ORDER.map(function (k) { return { key: 'theme_' + k, value: colors[k] }; });
      var r = await sb.from('site_texts').upsert(rows);
      save.disabled = false; save.textContent = 'Kaydet';
      if (r.error) alert('Kaydedilemedi: ' + r.error.message);
      else alert('Kaydedildi. Site yenilendiğinde yeni renkler görünür.');
    });
    var reset = el('button', 'btn-secondary', 'Varsayılana dön');
    reset.addEventListener('click', async function () {
      if (!confirm('Tüm renkler orijinal tasarıma döndürülsün mü?')) return;
      colors = T.normalize(T.DEFAULTS); refresh();
      var r = await sb.from('site_texts').delete().in('key', keys);
      if (r.error) alert('Sıfırlanamadı: ' + r.error.message);
      else alert('Varsayılan renklere dönüldü.');
    });
    actions.appendChild(save); actions.appendChild(reset);
    card.appendChild(actions);
    wrap.appendChild(card);

    root.innerHTML = '';
    root.appendChild(wrap);
    refresh();
  };

  // ───────────────────────── Ayarlar (form_recipients) ─────────────────────────
  PANELS.settings = async function () {
    var rs = await sb.from('settings').select('*').in('key', ['form_recipients', 'mail_api_key', 'mail_from']);
    var map = {};
    (rs.data || []).forEach(function (r) { map[r.key] = r.value; });
    var current = map.form_recipients || ['info@masterface.com.tr'];

    var wrap = el('div', 'panel');
    wrap.appendChild(el('h2', null, 'Ayarlar'));
    wrap.appendChild(el('p', 'hint', '"Teklif İste" formundan gelen her talep, aşağıdaki adreslerin hepsine e-posta olarak gönderilir (ayrıca "Gelen Talepler"de saklanır).'));

    var card = el('div', 'edit-card');
    function field(text, val, type, ph) {
      var label = el('label');
      label.appendChild(document.createTextNode(text));
      var input = el('input');
      input.type = type || 'text';
      input.value = val || '';
      if (ph) input.placeholder = ph;
      label.appendChild(input);
      card.appendChild(label);
      return input;
    }
    var inRcpt = field('Alıcı e-posta adresleri (virgülle ayırın)', current.join(', '));
    var inFrom = field('Gönderen adres (Resend\'de doğrulanmış alan adından)', map.mail_from || '', 'text', 'Masterface <noreply@masterface.com.tr>');
    var inKey = field('Resend API anahtarı', map.mail_api_key || '', 'password', 're_…');
    card.appendChild(el('p', 'hint', 'E-posta servisi: resend.com (ücretsiz plan yeterli). Anahtar sadece giriş yapmış yöneticiler tarafından okunabilir. Anahtar boşsa mail gönderilmez, talepler yine de kaydedilir.'));

    var saveBtn = el('button', 'btn-primary', 'Kaydet');
    saveBtn.addEventListener('click', async function () {
      var list = inRcpt.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var bad = list.filter(function (m) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m); });
      if (!list.length || bad.length) { alert('Geçersiz e-posta adresi: ' + (bad.join(', ') || '(boş)')); return; }
      saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…';
      var rows = [{ key: 'form_recipients', value: list }];
      if (inFrom.value.trim()) rows.push({ key: 'mail_from', value: inFrom.value.trim() });
      if (inKey.value.trim()) rows.push({ key: 'mail_api_key', value: inKey.value.trim() });
      var res2 = await sb.from('settings').upsert(rows);
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
