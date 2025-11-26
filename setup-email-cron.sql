-- ============================================
-- CONFIGURAR TRIGGER AUTOMÁTICO PARA EMAILS
-- Execute no SQL Editor do Supabase
-- ============================================

-- Criar trigger que processa emails automaticamente quando são inseridos
CREATE OR REPLACE FUNCTION trigger_process_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar que há novo email (para processar imediatamente)
  PERFORM pg_notify('new_email', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela email_queue
DROP TRIGGER IF EXISTS email_queue_trigger ON email_queue;
CREATE TRIGGER email_queue_trigger
  AFTER INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_process_email();

-- ============================================
-- CONFIGURAR DATABASE WEBHOOK (MELHOR OPÇÃO)
-- Vá manualmente em: 
-- https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/hooks
-- 
-- 1. Click "Create a new Hook"
-- 2. Name: "Process Email Queue"
-- 3. Table: email_queue
-- 4. Events: INSERT
-- 5. Type: HTTP Request
-- 6. Method: POST
-- 7. URL: https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue
-- 8. Click "Create webhook"
-- ============================================

-- Ver emails pendentes
SELECT id, type, recipient_email, status, created_at
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC;
