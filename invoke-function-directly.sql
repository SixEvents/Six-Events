-- Execute isso no Supabase SQL Editor para invocar a função diretamente do banco:
-- https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/sql/new

-- Primeiro, habilitar a extensão http se ainda não estiver
CREATE EXTENSION IF NOT EXISTS http;

-- Resetar email para pending
UPDATE email_queue 
SET status = 'pending', attempts = 0, error_message = null
WHERE recipient_email = 'ls8528950@gmail.com';

-- Invocar a Edge Function direto do banco (bypass JWT)
SELECT 
  (http_post(
    'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
    '{}',
    'application/json'
  )).status as response_status,
  (http_post(
    'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
    '{}',
    'application/json'
  )).content as response_body;
