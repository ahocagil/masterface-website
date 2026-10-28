// Masterface — yeni form talebi bildirimi (SMTP, ek servis hesabı gerektirmez)
// Gizli ayarlar (Supabase > Edge Functions > Secrets):
//   SMTP_HOST (ör. mail.masterface.com.tr), SMTP_PORT (465), SMTP_USER (info@masterface.com.tr),
//   SMTP_PASS, WEBHOOK_SECRET (rastgele uzun bir metin; mail.sql'deki ile aynı), NOTIFY_TO (opsiyonel, varsayılan SMTP_USER)
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  let body: { to?: string[] } = {};
  try { body = await req.json(); } catch (_) { /* boş gövde olabilir */ }

  const user = Deno.env.get("SMTP_USER")!;
  const fallback = (Deno.env.get("NOTIFY_TO") || user).split(",").map((s) => s.trim()).filter(Boolean);
  const valid = (body.to || []).filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
  const to = valid.length ? valid : fallback;

  const port = Number(Deno.env.get("SMTP_PORT") || 465);
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST")!,
      port,
      tls: port === 465,
      auth: { username: user, password: Deno.env.get("SMTP_PASS")! },
    },
  });
  try {
    await client.send({
      from: `Masterface Web <${user}>`,
      to,
      subject: "Yeni bir teklif talebiniz var — masterface.com.tr",
      content: "Web sitesinden yeni bir teklif talebi geldi.\n\nGörmek için: https://masterface.com.tr/admin → Gelen Talepler",
      html: `<p>Web sitesinden yeni bir teklif talebi geldi.</p><p><a href="https://masterface.com.tr/admin">Admin panelini aç → Gelen Talepler</a></p>`,
    });
    await client.close();
    return new Response("ok");
  } catch (e) {
    try { await client.close(); } catch (_) { /* yoksay */ }
    console.error("smtp error", String(e));
    return new Response("smtp error: " + String(e), { status: 502 });
  }
});
