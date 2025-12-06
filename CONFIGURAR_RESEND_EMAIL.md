# 📧 Configuração do Resend para Envio de Emails

## Problema
Após um cliente fazer pagamento via Stripe, o email com os QR codes não está sendo recebido.

## Causa Comum
O domínio de envio (`sixevents.be`) não está verificado na conta Resend, então os emails são rejeitados.

## Solução

### 1. Verificar Domínio no Resend
1. Acesse https://resend.com/domains
2. Clique em "Add Domain"
3. Digite seu domínio: `sixevents.be`
4. Siga as instruções para adicionar registros DNS DKIM/SPF
5. Aguarde verificação (pode levar até 24h)

### 2. Atualizar Variável de Ambiente
Após o domínio ser verificado, adicione no Supabase Secrets:
```
RESEND_FROM_EMAIL = noreply@sixevents.be
```

Ou use o email padrão da Resend (onboarding@resend.dev) temporariamente para testes.

### 3. Testar Webhook Manualmente
```bash
# Ver emails na fila
SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC;

# Ver logs da função
# https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions/process-email-queue/logs
```

### 4. Disparar Processamento Manual
```bash
# Call the function directly
curl -X POST https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue \
  -H "Content-Type: application/json"
```

## Verificar Configuração Atual

### Ver Variáveis de Ambiente (Supabase Secrets)
```
https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/settings/vault
```

### Testar Envio de Email
```sql
-- Testar manualmente (simula envio)
INSERT INTO email_queue (
  type,
  recipient_email,
  recipient_name,
  data,
  status
) VALUES (
  'test_email',
  'seu_email@exemplo.com',
  'Test User',
  '{
    "eventName": "Test Event",
    "eventDate": "2024-12-20",
    "eventLocation": "Test Location",
    "ticketCount": 1,
    "participants": ["John Doe"],
    "totalAmount": 25.00,
    "qrCodes": []
  }',
  'pending'
);
```

## Alternativa: Gmail SMTP
Se o Resend não funcionar, configurar Gmail:

### 1. Ativar 2FA no Gmail
- Acesse https://myaccount.google.com/security
- Ativar "Autenticação em 2 etapas"

### 2. Criar Senha de Aplicação
- Ir para https://myaccount.google.com/apppasswords
- Selecionar Mail e Windows Computer
- Copiar a senha gerada

### 3. Adicionar ao Supabase Secrets
```
GMAIL_USER = seu_email@gmail.com
GMAIL_APP_PASSWORD = sua_senha_de_aplicacao_gerada
```

## Logs e Troubleshooting

### Ver função em execução
- https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions/process-email-queue/logs

### Erros comuns:
- ❌ "Invalid credentials" → Verificar RESEND_API_KEY
- ❌ "Domain not verified" → Configurar domínio no Resend
- ❌ "Email queued but not sent" → Verificar status na tabela email_queue

## Próximos Passos
1. ✅ Configurar domínio no Resend
2. ✅ Atualizar RESEND_FROM_EMAIL nos Secrets
3. ✅ Testar com uma reserva de teste
4. ✅ Verificar logs em case de erro
5. ✅ Confirmar que cliente recebeu email com QR codes
