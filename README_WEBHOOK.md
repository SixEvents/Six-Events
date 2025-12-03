# 🚀 CONFIGURAR WEBHOOK AUTOMÁTICO - PASSO A PASSO

## ⚡ Método Rápido: SQL Editor (RECOMENDADO)

### Passos:

1. **Abra o arquivo** `EXECUTAR_NO_SUPABASE_SQL_EDITOR.sql` (na raiz do projeto)

2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

3. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/sql/new
   ```

4. **Cole o código** no editor SQL (Ctrl+V)

5. **Clique em "Run"** (ou pressione Ctrl+Enter)

6. **Verifique o resultado:**
   - Deve mostrar "Success. No rows returned"
   - OU mostrar informações do trigger criado

### ✅ O que o script faz:

1. Ativa extensão `pg_net` (necessária para HTTP requests)
2. Cria função `trigger_process_email_queue()` que chama a Edge Function
3. Cria trigger `webhook_process_email_queue` que dispara em INSERT
4. Configura permissões necessárias

## 🧪 TESTAR

### Teste 1: Party Builder (Cliente → Staff)
```bash
# Vá ao site e submeta um Party Builder request
https://sixevents.be/party-builder
```

**Resultado esperado:**
- Staff recebe email em `6events.mjt@gmail.com` (em ~5 segundos)
- Cliente recebe confirmação no seu email

### Teste 2: EmailEditor (Staff → Cliente)
```bash
# Dashboard admin
https://sixevents.be/dashboard/party-builder-requests
```

**Resultado esperado:**
- Cliente recebe 1 email personalizado
- SEM duplicações

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
-- Ver triggers ativos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'webhook_process_email_queue';

-- Deve retornar 1 linha mostrando o trigger
```

## ❌ SE DER ERRO: "pg_net extension not available"

Se o script SQL falhar, configure via Dashboard (método manual):

1. Acesse: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/hooks
2. Clique em "Enable Webhooks"
3. Clique em "Create a new hook"
4. Preencha:
   - Name: `process-email-queue-on-insert`
   - Table: `email_queue`
   - Events: Apenas **INSERT** ✅
   - Type: HTTP Request
   - Method: POST
   - URL: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue`
   - Timeout: 5000
5. Clique em "Create hook"

## 📊 MONITORAR

### Ver emails na queue:
```sql
SELECT id, type, recipient_email, status, attempts, created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Ver emails enviados hoje:
```sql
SELECT type, recipient_email, sent_at
FROM email_queue
WHERE status = 'sent' 
  AND sent_at::date = CURRENT_DATE
ORDER BY sent_at DESC;
```

### Ver emails falhados:
```sql
SELECT id, type, recipient_email, error_message, attempts
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## 🎯 RESUMO

✅ **Executar agora:**
1. Copiar conteúdo de `EXECUTAR_NO_SUPABASE_SQL_EDITOR.sql`
2. Colar no SQL Editor do Supabase
3. Clicar "Run"
4. Testar enviando Party Builder request ou email pelo dashboard

⏱️ **Tempo total:** 2 minutos

🎉 **Resultado:** Emails enviados automaticamente, sem duplicações!
