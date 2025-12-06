# 🔧 CONFIGURAÇÃO URGENTE: Database Webhook

## ⚠️ IMPORTANTE: EMAILS NÃO SERÃO ENVIADOS ATÉ CONFIGURAR ISTO

Após o último commit, removemos as chamadas manuais ao `process-email-queue` porque estavam a causar envio de emails duplicados.

Agora os emails são inseridos na `email_queue` mas **NÃO SÃO PROCESSADOS AUTOMATICAMENTE**.

## ✅ SOLUÇÃO: Configurar Database Webhook (5 minutos)

### Passo a Passo:

1. **Acesse o Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/hooks
   ```

2. **Clique em "Create a new hook"** (botão verde no canto superior direito)

3. **Preencha o formulário:**
   
   **Aba "Details":**
   - **Name**: `process-email-queue-on-insert`
   - **Table**: Selecione `email_queue`
   - **Events**: Marque APENAS **"Insert"** ✅ (NÃO marcar Update nem Delete)
   - **Orientation**: `Row` (padrão)
   - **Enabled**: ✅ Deixar marcado

   **Aba "Webhook":**
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: 
     ```
     https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue
     ```
   - **Timeout (ms)**: `5000`
   - **HTTP Headers**: DEIXAR VAZIO (não precisa)
   - **HTTP Parameters**: DEIXAR VAZIO

4. **Clique em "Create hook"**

5. **Verificar se está ativo:**
   - Após criar, deve aparecer na lista com status "Enabled"
   - Se estiver "Disabled", clique para ativar

## 🧪 Testar se Funcionou:

### Teste 1: Party Builder (Cliente → Staff)
1. Ir ao site público: https://sixevents.be/party-builder
2. Preencher formulário e submeter
3. **Resultado esperado**: 
   - Staff recebe email em `6events.mjt@gmail.com` (demanda)
   - Cliente recebe confirmação no email dele
   - Emails chegam em ~5 segundos

### Teste 2: EmailEditor (Staff → Cliente)
1. Ir ao dashboard: https://sixevents.be/dashboard/party-builder-requests
2. Clicar "Envoyer Email" numa request
3. Personalizar e enviar
4. **Resultado esperado**:
   - Cliente recebe 1 email personalizado
   - NÃO recebe emails duplicados ou antigos

## ❌ Se NÃO Configurar o Webhook:

- ❌ Nenhum email será enviado automaticamente
- ❌ Emails ficam presos na queue com status "pending"
- ❌ Precisas executar manualmente: 
  ```bash
  curl -X POST https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue \
    -H "Authorization: Bearer <ANON_KEY>"
  ```

## 📊 Monitorar Emails:

### Ver queue atual:
```sql
SELECT id, type, recipient_email, status, attempts, created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Ver emails falhados:
```sql
SELECT id, type, recipient_email, error_message, attempts
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Processar manualmente (se webhook não estiver configurado):
```bash
curl -X POST \
  https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y2Rjd3dkbG5jem9qbXNsaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzAxMzIsImV4cCI6MjA3OTUwNjEzMn0.zaVbXaMDNIMwh_x5D28F858jw0wPZ76fEfbWoMH6OyQ"
```

## 🎯 Resumo:

1. ✅ **FAZER AGORA**: Configurar webhook no dashboard (5 min)
2. ✅ Testar enviando Party Builder request
3. ✅ Testar enviando email pelo dashboard
4. ✅ Verificar que emails chegam sem duplicação
