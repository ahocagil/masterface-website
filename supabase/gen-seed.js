// app.js içindeki DEFAULTS içeriğinden supabase/seed.sql üretir.
// Kullanım: node supabase/gen-seed.js > supabase/seed.sql
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');
const start = src.indexOf('var DEFAULTS = {');
const end = src.indexOf('// ───────────────────────── Veri yükleme');
const DEFAULTS = new Function(src.slice(start, end) + '; return DEFAULTS;')();

const q = (v) => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const abs = (u) => (u && !/^(https?:)?\//.test(u)) ? '/' + u : u; // /admin altında da çalışsın
const out = [];

out.push('-- Masterface seed: sitedeki mevcut icerik. Tablolari bosaltip yeniden doldurur.');
out.push('begin;');
out.push('delete from projects; delete from categories; delete from services; delete from logos; delete from stats;');
out.push('delete from gallery_photos; delete from process_steps; delete from site_texts; delete from form_fields;');

out.push('insert into site_texts (key, value) values');
out.push(Object.entries(DEFAULTS.site_texts).map(([k, v]) => `  (${q(k)}, ${q(v)})`).join(',\n') + ';');

out.push('insert into logos (label, image_url, sort_order) values');
out.push(DEFAULTS.logos.map((l, i) => `  (${q(l.label)}, ${q(abs(l.image_url))}, ${i + 1})`).join(',\n') + ';');

out.push('insert into stats (value, label, sort_order) values');
out.push(DEFAULTS.stats.map((s, i) => `  (${q(s.value)}, ${q(s.label)}, ${i + 1})`).join(',\n') + ';');

out.push('insert into services (title, description, image_url, sort_order) values');
out.push(DEFAULTS.services.map((s, i) => `  (${q(s.title)}, ${q(s.description)}, ${q(s.image_url)}, ${i + 1})`).join(',\n') + ';');

out.push('insert into process_steps (title, description, sort_order) values');
out.push(DEFAULTS.process_steps.map((s, i) => `  (${q(s.title)}, ${q(s.description)}, ${i + 1})`).join(',\n') + ';');

out.push('insert into gallery_photos (image_url, sort_order) values');
out.push(DEFAULTS.gallery_photos.map((g, i) => `  (${q(abs(g.image_url))}, ${i + 1})`).join(',\n') + ';');

out.push('insert into projects (name, brand, city, year, youtube_id, sort_order) values');
out.push(DEFAULTS.projects.map((p, i) => `  (${q(p.name)}, ${q(p.brand)}, ${q(p.city)}, ${q(p.year)}, ${q(p.youtube_id)}, ${i + 1})`).join(',\n') + ';');

out.push('insert into form_fields (id, label, type, required, width, options, sort_order) values');
out.push(DEFAULTS.form_fields.map((f) => `  (${q(f.id)}, ${q(f.label)}, ${q(f.type)}, ${f.required ? 'true' : 'false'}, ${q(f.width)}, null, ${f.sort_order})`).join(',\n') + ';');

out.push(`insert into settings (key, value) values ('form_recipients', '["info@masterface.com.tr"]'::jsonb) on conflict (key) do nothing;`);
out.push('commit;');

process.stdout.write(out.join('\n') + '\n');
