-- Fix email_queue: tornar recipient_name opcional e adicionar RLS
-- Problema: recipient_name era NOT NULL mas código não envia sempre

-- 1. Tornar recipient_name opcional
ALTER TABLE email_queue 
ALTER COLUMN recipient_name DROP NOT NULL;

-- 2. Habilitar RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- 3. Criar policy para permitir INSERT de usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated users to insert emails" ON email_queue;

CREATE POLICY "Allow authenticated users to insert emails"
ON email_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Criar policy para permitir INSERT de anon (para webhooks)
DROP POLICY IF EXISTS "Allow anon to insert emails" ON email_queue;

CREATE POLICY "Allow anon to insert emails"
ON email_queue
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Permitir service_role acessar tudo (para Email Service)
DROP POLICY IF EXISTS "Allow service_role full access" ON email_queue;

CREATE POLICY "Allow service_role full access"
ON email_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Permitir SELECT para usuários autenticados (ver seus próprios emails)
DROP POLICY IF EXISTS "Allow users to view their emails" ON email_queue;

CREATE POLICY "Allow users to view their emails"
ON email_queue
FOR SELECT
TO authenticated
USING (true);

COMMENT ON COLUMN email_queue.recipient_name IS 'Nome do destinatário (opcional)';
