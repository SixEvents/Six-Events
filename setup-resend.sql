-- 1. Adicionar o Secret no Supabase:
-- Va em: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/settings/vault
-- Click "New secret"
-- Nome: RESEND_API_KEY
-- Valor: re_ieNRafXY_31cfPEoZ3n5Rr6Mbf5BDaizx

-- 2. Resetar o email para pending
UPDATE email_queue 
SET status = 'pending', attempts = 0, error_message = null
WHERE id = 'b16f9149-cda1-4c5a-89e2-b5f4847c6f2d';

-- 3. Verificar se resetou
SELECT id, status, attempts, recipient_email, data->>'eventName' as event_name
FROM email_queue 
WHERE id = 'b16f9149-cda1-4c5a-89e2-b5f4847c6f2d';
