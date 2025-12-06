-- ========================================
-- MIGRATION: Criar tabela email_queue
-- Descrição: Fila de emails para processamento assíncrono
-- ========================================

-- Passo 1: Criar tabela
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  reservation_id UUID,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passo 2: Adicionar foreign key se a tabela reservations existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reservations'
  ) THEN
    ALTER TABLE email_queue 
    ADD CONSTRAINT fk_email_queue_reservation 
    FOREIGN KEY (reservation_id) 
    REFERENCES reservations(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Passo 3: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status 
ON email_queue(status);

CREATE INDEX IF NOT EXISTS idx_email_queue_created_at 
ON email_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_email_queue_reservation_id 
ON email_queue(reservation_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_type 
ON email_queue(type);

-- Passo 4: Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 5: Criar trigger
DROP TRIGGER IF EXISTS email_queue_updated_at_trigger ON email_queue;

CREATE TRIGGER email_queue_updated_at_trigger
BEFORE UPDATE ON email_queue
FOR EACH ROW
EXECUTE FUNCTION update_email_queue_updated_at();

-- Passo 6: Adicionar comentários
COMMENT ON TABLE email_queue IS 'Fila de emails para processamento assíncrono pelo Email Service';
COMMENT ON COLUMN email_queue.type IS 'Tipo: reservation_confirmation, party_builder_quote';
COMMENT ON COLUMN email_queue.data IS 'JSON com dados do template (eventName, qrCodes, etc)';
COMMENT ON COLUMN email_queue.status IS 'Status: pending, sent, failed';
COMMENT ON COLUMN email_queue.attempts IS 'Número de tentativas (máximo 3)';

-- Passo 7: Verificar se criou corretamente
SELECT 
  'email_queue criada com sucesso!' as mensagem,
  COUNT(*) as total_emails
FROM email_queue;
