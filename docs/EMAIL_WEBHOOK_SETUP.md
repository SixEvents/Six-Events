# Configuração de Email Automático

## Problema
Os emails não são enviados automaticamente quando adicionados à fila `email_queue`.

## Solução: Database Webhook

### Passo 1: Criar Webhook no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/database/hooks
2. Clique em "Create a new hook"
3. Configure:
   - **Name**: `process-email-queue-on-insert`
   - **Table**: `email_queue`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue`
   - **Headers**:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer <SERVICE_ROLE_KEY>"
     }
     ```
   - **Timeout**: 5000ms
   - **HTTP Parameters**: None needed

4. Clique em "Create hook"

### Alternativa: Usar Supabase Cron Jobs (se disponível no plano)

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
