-- Masterface — "Teklif İste" e-posta bildirimi
-- Supabase > SQL Editor'de BİR KEZ çalıştırın.
-- Çalışma şekli: form_submissions'a yeni kayıt düşünce bu tetikleyici,
-- Resend API'sine (pg_net ile) istek atar; alıcılar admin > Ayarlar'daki
-- "form_recipients" listesinden okunur. Yeni adres eklemek için SQL gerekmez.
-- API anahtarı ve gönderen adres admin > Ayarlar'dan girilir (settings tablosu
-- sadece giriş yapmış admin tarafından okunabilir).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key   text;
  v_from  text;
  v_to    jsonb;
  v_text  text := '';
  v_html  text := '';
  k       text;
  v       text;
  v_reply text;
begin
  select value #>> '{}' into v_key  from settings where key = 'mail_api_key';
  select value #>> '{}' into v_from from settings where key = 'mail_from';
  select value          into v_to   from settings where key = 'form_recipients';

  if v_key is null or v_key = '' or v_to is null or jsonb_array_length(v_to) = 0 then
    return new;  -- yapılandırılmamış: sadece kaydet, mail atma
  end if;
  if v_from is null or v_from = '' then
    v_from := 'Masterface Web <onboarding@resend.dev>';
  end if;

  for k, v in select key, value #>> '{}' from jsonb_each(new.payload) loop
    v_text := v_text || k || ': ' || coalesce(v, '') || E'\n';
    v_html := v_html || '<p><b>' || replace(replace(replace(k,'&','&amp;'),'<','&lt;'),'>','&gt;')
                     || ':</b><br>' || replace(replace(replace(coalesce(v,''),'&','&amp;'),'<','&lt;'),'>','&gt;') || '</p>';
    if v_reply is null and lower(k) like '%mail%' and v like '%@%' then v_reply := v; end if;
  end loop;

  begin
    perform net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
      body    := jsonb_strip_nulls(jsonb_build_object(
                   'from', v_from,
                   'to', v_to,
                   'subject', 'Yeni teklif talebi — masterface.com.tr',
                   'text', v_text,
                   'html', v_html,
                   'reply_to', v_reply))
    );
  exception when others then
    null;  -- mail hatası form kaydını asla engellemesin
  end;
  return new;
end;
$$;

drop trigger if exists trg_notify_form_submission on public.form_submissions;
create trigger trg_notify_form_submission
  after insert on public.form_submissions
  for each row execute function public.notify_form_submission();
