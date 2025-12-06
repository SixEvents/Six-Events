-- Criar Database Webhook para processar emails automaticamente
-- Este webhook será disparado sempre que um novo email for inserido na tabela email_queue

-- 1. Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION notify_new_email()
RETURNS TRIGGER AS $$
DECLARE
  webhook_response TEXT;
BEGIN
  -- Chamar a Edge Function via pg_net (se disponível)
  -- Caso pg_net não esteja disponível, o webhook precisa ser criado via Dashboard
  
  -- Por enquanto, apenas retornar NEW para permitir o INSERT
  -- O webhook HTTP será configurado via SQL abaixo
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger que dispara quando novo email é inserido
DROP TRIGGER IF EXISTS trigger_process_email_queue ON email_queue;
CREATE TRIGGER trigger_process_email_queue
  AFTER INSERT ON email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_new_email();

-- 3. Criar Database Webhook via SQL (Supabase API)
-- Nota: Isto requer pg_net extension. Se não funcionar, precisa criar via Dashboard.

-- Verificar se pg_net está disponível
DO $$
BEGIN
  -- Tentar criar extensão pg_net se não existir
  CREATE EXTENSION IF NOT EXISTS pg_net;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension não disponível. Webhook precisa ser criado via Dashboard.';
END $$;

-- 4. Atualizar a função para usar pg_net (se disponível)
CREATE OR REPLACE FUNCTION notify_new_email()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Tentar chamar Edge Function via HTTP
  BEGIN
    SELECT INTO request_id
      net.http_post(
        url := 'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar (pg_net não disponível), apenas logar
    RAISE NOTICE 'Failed to trigger webhook: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions necessárias
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, anon, authenticated, service_role;

COMMENT ON FUNCTION notify_new_email() IS 'Trigger function to process email queue via Edge Function when new email is inserted';
COMMENT ON TRIGGER trigger_process_email_queue ON email_queue IS 'Automatically process emails when inserted into queue';
