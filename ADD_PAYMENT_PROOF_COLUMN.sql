-- Adicionar coluna payment_proof_url na tabela reservations
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Criar bucket de storage para comprovantes (executar via interface do Supabase Storage)
-- Nome do bucket: payment-proofs
-- Public: false
-- File size limit: 10MB
