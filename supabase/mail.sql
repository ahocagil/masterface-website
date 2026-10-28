-- Masterface — "Teklif İste" bildirimi (SMTP edge function ile). Supabase > SQL Editor'de BİR KEZ çalıştırın.
-- Yeni talep gelince "notify-submission" fonksiyonunu çağırır; mailde müşteri bilgisi yoktur,
-- sadece "yeni talep var" + admin linki gider. Alıcılar admin > Ayarlar > form_recipients'tan okunur
-- (boşsa fonksiyondaki NOTIFY_TO / SMTP_USER kullanılır).
-- ÖNCE aşağıdaki 'BURAYA_SECRET' yerine WEBHOOK_SECRET ile AYNI rastgele metni yazın.

create extension if not exists pg_net with schema extensions;

insert into settings (key, value) values ('webhook_secret', to_jsonb('BURAYA_SECRET'::text))
on conflict (key) do update set value = excluded.value;

create or replace function public.notify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_to     jsonb;
begin
  select value #>> '{}' into v_secret from settings where key = 'webhook_secret';
  select value          into v_to     from settings where key = 'form_recipients';
  if v_secret is null or v_secret = '' then return new; end if;
  begin
    perform net.http_post(
      url     := 'https://xqxjdegyyvvjrfvsvglf.supabase.co/functions/v1/notify-submission',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      body    := jsonb_build_object('to', coalesce(v_to, '[]'::jsonb))
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
