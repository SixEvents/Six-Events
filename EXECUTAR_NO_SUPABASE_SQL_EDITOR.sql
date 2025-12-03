-- ====================================================================
-- WEBHOOK PARA PROCESSAR EMAILS AUTOMATICAMENTE
-- ====================================================================
-- INSTRUÇÕES:
-- 1. Copie todo este código
-- 2. Vá ao Supabase Dashboard: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/sql/new
-- 3. Cole o código no SQL Editor
-- 4. Clique em "Run" (ou Ctrl+Enter)
-- ====================================================================

-- Passo 1: Ativar extensão pg_net (necessária para HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Passo 2: Criar função que chama a Edge Function via HTTP
CREATE OR REPLACE FUNCTION trigger_process_email_queue()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Chamar Edge Function para processar a fila de emails
  SELECT INTO request_id
    net.http_post(
      url := 'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 5000
    );
  
  -- Retornar NEW para permitir o INSERT
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Passo 3: Criar trigger que dispara quando novo email é inserido
DROP TRIGGER IF EXISTS webhook_process_email_queue ON email_queue;
CREATE TRIGGER webhook_process_email_queue
  AFTER INSERT ON email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_process_email_queue();

-- Passo 4: Grant permissions necessárias
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Passo 5: Adicionar comentários
COMMENT ON FUNCTION trigger_process_email_queue() IS 'Chama Edge Function para processar emails automaticamente quando inseridos na queue';
COMMENT ON TRIGGER webhook_process_email_queue ON email_queue IS 'Webhook automático: processa emails imediatamente após INSERT';

-- ====================================================================
-- VERIFICAÇÃO
-- ====================================================================

-- Ver se o trigger foi criado com sucesso
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'webhook_process_email_queue';

-- Testar: inserir um email de teste (DESCOMENTAR para testar)
-- INSERT INTO email_queue (type, recipient_email, data, status) 
-- VALUES ('test', 'teste@exemplo.com', '{"test": true}'::jsonb, 'pending');

-- Ver resultado
-- SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1;

-- ====================================================================
-- ✅ SUCESSO!
-- ====================================================================
-- Após executar este SQL:
-- 1. Sempre que um email for inserido na email_queue
-- 2. O trigger chama automaticamente a Edge Function
-- 3. O email é processado e enviado imediatamente
-- 
-- Não há mais necessidade de chamar process-email-queue manualmente!
-- ====================================================================
