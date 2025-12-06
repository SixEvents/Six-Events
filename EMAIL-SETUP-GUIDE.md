# 📧 GUIA RÁPIDO - Sistema de Email Six Events

## ✅ O QUE JÁ ESTÁ FUNCIONANDO:
- ✅ Edge Functions deployadas no Supabase
- ✅ Resend API configurada
- ✅ Email queue system funcionando
- ✅ Templates de email com QR codes

## ⏳ PRÓXIMO PASSO - VERIFICAR DOMÍNIO:

### 1. Acesse Resend:
https://resend.com/domains

### 2. Adicione o domínio:
- Click "Add Domain"
- Digite: `sixevents.be`

### 3. Copie os registros DNS (exemplo):
```
TXT _resend.sixevents.be → "resend-key=abc123..."
MX @ → "feedback-smtp.resend.com" (Priority 10)
TXT @ → "v=spf1 include:_spf.resend.com ~all"
CNAME resend._domainkey → "resend._domainkey.resend.com"
```

### 4. Adicione no OVH:
- Vá no painel DNS de sixevents.be
- Adicione cada registro exatamente como mostrado
- Aguarde 5-15 minutos

### 5. Verifique no Resend:
- Click "Verify" no dashboard do Resend
- Deve aparecer "Verified ✅"

## 🧪 TESTAR DEPOIS DE VERIFICAR:

### Teste 1 - Email direto:
```powershell
Invoke-WebRequest -Uri "https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/send-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"to":"ls8528950@gmail.com","subject":"🎉 Teste","html":"<h1>Funcionou!</h1>"}' -UseBasicParsing
```

### Teste 2 - Processar fila:
```powershell
Invoke-WebRequest -Uri "https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}' -UseBasicParsing
```

### Teste 3 - Fazer reserva real:
1. Vá no site: http://localhost:8080
2. Faça uma reserva com pagamento
3. Email deve chegar automaticamente em até 30 segundos

## 🔄 PRÓXIMA TAREFA - AUTOMATIZAR:

Depois que funcionar, vamos configurar um cron job no Supabase para processar emails automaticamente a cada 30 segundos.

## 📊 MONITORAR:

- Logs: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions/process-email-queue/logs
- Email Queue: `SELECT * FROM email_queue ORDER BY created_at DESC`
- Resend Dashboard: https://resend.com/emails

---

**ME AVISE QUANDO O DOMÍNIO ESTIVER VERIFICADO NO RESEND!** 🚀
