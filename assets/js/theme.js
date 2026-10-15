// Masterface — renk teması.
// Panelde (Renkler sekmesi) seçilen 6 ana renkten sitedeki tüm renk değişkenleri türetilir.
// Kurallar (derive):
//   • Metin tonları (soluk metin, kenarlıklar, ikincil metin) ana renklerin karışımından otomatik üretilir.
//   • Vurgu rengi üstündeki yazı, vurgunun parlaklığına göre otomatik siyah ya da beyaz seçilir.
//   • Açık bölümlerdeki vurgulu yazı (numaralar, küçük başlıklar), okunabilir olana dek koyulaştırılır.
//   • Tüm renkler varsayılana eşitse hiçbir şey ezilmez, style.css'teki asıl değerler geçerli olur.
// Hem ana sitede hem panelde (canlı önizleme) kullanılır.
(function () {
  'use strict';

  var DEFAULTS = { bg: '#111113', bg_alt: '#1A1A1E', ink: '#F4F1EA', accent: '#FF5A36', cream: '#F4F1EA', cream_ink: '#111113' };
  var ORDER = ['bg', 'bg_alt', 'ink', 'accent', 'cream', 'cream_ink'];
  var CACHE_KEY = 'mf_theme';

  function isHex(v) { return /^#[0-9a-fA-F]{6}$/.test(String(v || '')); }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function hex(c) {
    return '#' + c.map(function (n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); }).join('').toUpperCase();
  }
  // a'ya b'yi t oranında karıştır (t=0 → a, t=1 → b)
  function mix(a, b, t) {
    var x = rgb(a), y = rgb(b);
    return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  function lum(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function normalize(colors) {
    var out = {};
    ORDER.forEach(function (k) { out[k] = isHex(colors && colors[k]) ? colors[k].toUpperCase() : DEFAULTS[k]; });
    return out;
  }
  function isDefault(c) { return ORDER.every(function (k) { return c[k] === DEFAULTS[k]; }); }

  function derive(colors) {
    var c = normalize(colors);
    var onAccent = contrast(c.accent, '#111113') >= contrast(c.accent, '#FFFFFF') ? '#111113' : '#FFFFFF';
    var deep = c.accent, i = 0;
    while (contrast(deep, c.cream) < 4.5 && i < 14) { deep = mix(deep, '#000000', 0.1); i++; }
    return {
      '--bg': c.bg, '--bg-alt': c.bg_alt, '--ink': c.ink, '--accent': c.accent,
      '--cream': c.cream, '--cream-ink': c.cream_ink,
      '--ink-dim': mix(c.ink, c.bg, 0.12), '--muted': mix(c.ink, c.bg, 0.38),
      '--border': mix(c.bg, c.ink, 0.12), '--border-light': mix(c.bg, c.ink, 0.14),
      '--line-strong': mix(c.bg, c.ink, 0.22), '--hover': mix(c.bg_alt, c.ink, 0.08),
      '--on-accent': onAccent, '--accent-deep': deep,
      '--cream-muted': mix(c.cream_ink, c.cream, 0.35), '--cream-line': mix(c.cream, c.cream_ink, 0.12),
      '--cream-line2': mix(c.cream, c.cream_ink, 0.2), '--cream-s1': mix(c.cream, c.cream_ink, 0.05),
      '--cream-s2': mix(c.cream, c.cream_ink, 0.09)
    };
  }

  function apply(colors, target) {
    var el = target || document.documentElement;
    var c = normalize(colors);
    var vars = derive(c);
    Object.keys(vars).forEach(function (k) {
      if (!target && isDefault(c)) el.style.removeProperty(k); else el.style.setProperty(k, vars[k]);
    });
    return c;
  }

  // site_texts satırlarından (theme_bg, theme_accent …) renkleri oku
  function fromTexts(texts) {
    var c = {};
    ORDER.forEach(function (k) { c[k] = texts && texts['theme_' + k]; });
    return normalize(c);
  }

  function cache(colors) {
    try {
      if (isDefault(normalize(colors))) localStorage.removeItem(CACHE_KEY);
      else localStorage.setItem(CACHE_KEY, JSON.stringify(normalize(colors)));
    } catch (e) {}
  }

  window.MF_THEME = {
    DEFAULTS: DEFAULTS, ORDER: ORDER, isHex: isHex, normalize: normalize, derive: derive, apply: apply,
    fromTexts: fromTexts, cache: cache, contrast: contrast
  };

  // Tekrar gelen ziyaretçide ilk boyamadan önce son temayı uygula (renk parlaması olmasın)
  try {
    var saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (saved && location.pathname.indexOf('/admin') === -1) apply(saved);
  } catch (e) {}
})();
