-- Execute isso no SQL Editor do Supabase para permitir acesso público às functions
-- https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/sql/new

-- 1. Verificar se o secret RESEND_API_KEY está configurado
-- (Não vai mostrar o valor, só confirmar que existe)

-- 2. Resetar email para pending
UPDATE email_queue 
SET status = 'pending', attempts = 0, error_message = null
WHERE recipient_email = 'ls8528950@gmail.com';

-- 3. Ver status atual
SELECT 
  id, 
  type,
  recipient_email, 
  status, 
  attempts,
  created_at,
  data->>'eventName' as event_name
FROM email_queue 
WHERE recipient_email = 'ls8528950@gmail.com'
ORDER BY created_at DESC;
