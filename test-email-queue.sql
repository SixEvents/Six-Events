-- Ver emails pendentes na fila
SELECT 
  id, 
  type, 
  recipient_email, 
  status, 
  attempts, 
  created_at,
  data->>'eventName' as event_name,
  error_message
FROM email_queue 
ORDER BY created_at DESC 
LIMIT 5;

-- Deletar emails antigos/falhos
-- DELETE FROM email_queue WHERE status = 'failed' OR data->>'eventName' IS NULL;

-- Resetar email para tentar novamente
-- UPDATE email_queue SET status = 'pending', attempts = 0 WHERE id = 'SEU_ID_AQUI';
