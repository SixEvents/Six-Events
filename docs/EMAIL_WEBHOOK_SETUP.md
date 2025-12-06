# Configuração de Email Automático

## ⚠️ PROBLEMA ATUAL

Quando envia email pelo dashboard, a função `process-email-queue` processa **TODOS** os emails pendentes na fila, não apenas o novo. Isso causa envio de emails duplicados ou antigos.

## ✅ SOLUÇÃO: Configurar Database Webhook no Supabase

### Passo 1: Remover chamadas manuais (JÁ FEITO no próximo commit)

O código não deve chamar `fetch('/process-email-queue')` manualmente. Isso será substituído por webhook automático.

### Passo 2: Configurar Webhook no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/hooks
2. Clique em **"Create a new hook"**
3. Configure:
   - **Name**: `process-email-queue-on-insert`
   - **Table**: `email_queue`
   - **Events**: Marque apenas **INSERT**
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue`
   - **Headers**: Deixe vazio (não precisa Authorization para trigger interno)
   - **Timeout**: 5000ms

4. Clique em **"Create hook"**

### Passo 3: Testar

1. Submeter Party Builder request → Staff deve receber email automaticamente
2. Enviar email pelo dashboard → Cliente recebe apenas 1 email, não duplicados

## Alternativa: Usar Supabase Cron (Plano Pro)

Se tiver acesso a Cron Jobs (plano Pro):

1. Acesse: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/cron-jobs
2. Criar job que roda a cada 1 minuto:
   ```sql
   SELECT net.http_post(
     url := 'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
   );
   ```

### Verificar se funcionou

Após configurar, teste:

1. Submeter um Party Builder request
2. Verificar que email chega automaticamente (dentro de 1-2 segundos)
3. Checar logs da Edge Function: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions/process-email-queue/logs

## Status Atual

✅ Edge function deployada e funcionando
✅ PartyBuilder insere emails na queue
✅ EmailEditor insere emails na queue
⏳ **FALTANDO**: Trigger automático para processar queue

## Teste Manual

Para processar emails pendentes manualmente:

```bash
curl -X POST https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer <ANON_KEY>"
```
