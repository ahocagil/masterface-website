// Mevcut (dolu) veritabanına çok dil desteğini EKLER — veri silmez.
// Kullanım: node supabase/gen-i18n.js > supabase/migrate-i18n.sql
// Çevirileri app.js içindeki DEFAULTS'tan alır. Yalnızca çevirisi BOŞ olan satırları doldurur
// (panelden girdiğiniz çevirilerin üzerine yazmaz).
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');
const start = src.indexOf('// @defaults-start');
const end = src.indexOf('// @defaults-end');
const D = new Function(src.slice(start, end) + '; return {DEFAULTS, PH_PROJECT};')();
const DEFAULTS = D.DEFAULTS;

const q = (v) => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const jq = (o) => q(JSON.stringify(o)) + '::jsonb';
const out = [];
out.push('-- Masterface: cok dil (TR/EN/DE) gecisi. Tekrar calistirilabilir, veri silmez.');
out.push('begin;');
['categories', 'projects', 'services', 'stats', 'process_steps', 'form_fields'].forEach((t) =>
  out.push(`alter table ${t} add column if not exists i18n jsonb;`));

const byKey = (table, keyCol, items, keyFn) => items.forEach((it) => {
  if (!it.i18n) return;
  out.push(`update ${table} set i18n = ${jq(it.i18n)} where ${keyCol} = ${q(keyFn(it))} and i18n is null;`);
});
byKey('services', 'title', DEFAULTS.services, (s) => s.title);
byKey('stats', 'label', DEFAULTS.stats, (s) => s.label);
byKey('process_steps', 'title', DEFAULTS.process_steps, (s) => s.title);
byKey('form_fields', 'id', DEFAULTS.form_fields, (f) => f.id);
// yer tutucu ("[Proje adı]") projeler için çeviri
out.push(`update projects set i18n = ${jq(D.PH_PROJECT)} where i18n is null and name = '[Proje adı]';`);

out.push('insert into site_texts (key, value) values');
const keys = Object.entries(DEFAULTS.site_texts).filter(([k]) => /_(en|de)$/.test(k));
out.push(keys.map(([k, v]) => `  (${q(k)}, ${q(v)})`).join(',\n'));
out.push('on conflict (key) do nothing;');
out.push('commit;');
process.stdout.write(out.join('\n') + '\n');
