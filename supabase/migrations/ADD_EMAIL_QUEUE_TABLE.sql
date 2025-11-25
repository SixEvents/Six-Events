-- Criar tabela para fila de emails
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

-- Adicionar foreign key se a tabela reservations existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
    ALTER TABLE email_queue 
    ADD CONSTRAINT fk_email_queue_reservation 
    FOREIGN KEY (reservation_id) 
    REFERENCES reservations(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_reservation_id ON email_queue(reservation_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated_at_trigger
BEFORE UPDATE ON email_queue
FOR EACH ROW
EXECUTE FUNCTION update_email_queue_updated_at();

-- Comentários
COMMENT ON TABLE email_queue IS 'Fila de emails para processamento assíncrono';
COMMENT ON COLUMN email_queue.type IS 'Tipo de email: reservation_confirmation, party_builder_quote, etc.';
COMMENT ON COLUMN email_queue.data IS 'Dados JSON contendo todas as informações necessárias para o template';
COMMENT ON COLUMN email_queue.status IS 'Status: pending (aguardando), sent (enviado), failed (falhou)';
COMMENT ON COLUMN email_queue.attempts IS 'Número de tentativas de envio';
