-- APAGAR TODOS OS EMAILS ANTIGOS COM DADOS ERRADOS
-- Execute no SQL Editor do Supabase

-- Ver quantos emails vão ser deletados
SELECT COUNT(*) as total_emails_antigos 
FROM email_queue 
WHERE status IN ('sent', 'failed');

-- APAGAR os emails antigos (só manter pending se houver)
DELETE FROM email_queue 
WHERE status IN ('sent', 'failed');

-- APAGAR TODOS (inclusive pending) para começar do zero
-- DELETE FROM email_queue;

-- Ver o que sobrou
SELECT * FROM email_queue ORDER BY created_at DESC;
