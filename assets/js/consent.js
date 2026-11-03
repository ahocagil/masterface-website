// Masterface — çerez onayı + Google Analytics (yalnızca onaydan sonra).
// config.js'de GA_MEASUREMENT_ID boşsa hiçbir şey yapmaz (banner da çıkmaz).
(function () {
  'use strict';
  var ID = window.GA_MEASUREMENT_ID;
  if (!ID || !/^G-[A-Z0-9]+$/i.test(ID)) return;

  var KEY = 'mf_consent';
  var TXT = {
    tr: { msg: 'Siteyi geliştirmek için anonim ziyaret istatistiği (Google Analytics) kullanıyoruz. Yalnızca onay verirseniz çalışır.', ok: 'Kabul et', no: 'Reddet', more: 'Gizlilik ve KVKK', label: 'Çerez tercihi' },
    en: { msg: 'We use anonymous visit statistics (Google Analytics) to improve the site. It only runs if you accept.', ok: 'Accept', no: 'Decline', more: 'Privacy Policy', label: 'Cookie preference' },
    de: { msg: 'Wir nutzen anonyme Besucherstatistiken (Google Analytics), um die Seite zu verbessern. Sie läuft nur mit Ihrer Zustimmung.', ok: 'Akzeptieren', no: 'Ablehnen', more: 'Datenschutz', label: 'Cookie-Einstellung' }
  };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function lang() {
    var l = 'tr';
    try { l = localStorage.getItem('mf_lang') || 'tr'; } catch (e) {}
    return TXT[l] ? l : 'tr';
  }

  function loadGA() {
    if (window.__mfGA) return; window.__mfGA = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID, { anonymize_ip: true });
  }

  function closeBanner() { var b = document.getElementById('mf-consent'); if (b) b.remove(); }

  function showBanner() {
    closeBanner();
    var t = TXT[lang()];
    var b = document.createElement('div');
    b.id = 'mf-consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', t.label);
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:720px;margin:0 auto;background:#1A1A1E;color:#F4F1EA;border:1px solid #44444E;border-radius:16px;padding:18px 20px;display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;font:15px/1.5 Instrument Sans,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    var p = document.createElement('p');
    p.style.cssText = 'margin:0;flex:1 1 300px';
    p.textContent = t.msg + ' ';
    var a = document.createElement('a');
    a.href = '/gizlilik'; a.textContent = t.more; a.style.cssText = 'text-decoration:underline';
    p.appendChild(a);
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px';
    function btn(txt, primary, fn) {
      var x = document.createElement('button');
      x.type = 'button'; x.textContent = txt;
      x.style.cssText = 'cursor:pointer;font:600 15px Instrument Sans,system-ui,sans-serif;padding:10px 20px;border-radius:999px;border:1.5px solid #F4F1EA;' + (primary ? 'background:#F4F1EA;color:#111113' : 'background:transparent;color:#F4F1EA');
      x.addEventListener('click', fn); return x;
    }
    row.appendChild(btn(t.no, false, function () { set('denied'); closeBanner(); }));
    row.appendChild(btn(t.ok, true, function () { set('granted'); closeBanner(); loadGA(); }));
    b.appendChild(p); b.appendChild(row);
    document.body.appendChild(b);
  }

  // Gizlilik sayfasındaki "Çerez tercihlerini değiştir" düğmesi için
  window.mfConsentReset = function () { try { localStorage.removeItem(KEY); } catch (e) {} showBanner(); };

  var c = get();
  if (c === 'granted') loadGA();
  else if (c !== 'denied') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
    else showBanner();
  }
})();
