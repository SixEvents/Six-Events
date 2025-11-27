# Depois de pegar a API Key do MailerSend, rode:

# 1. Configurar secret
npx supabase secrets set MAILERSEND_API_KEY=mlsn_SUA_CHAVE_AQUI

# 2. Testar envio direto
Invoke-WebRequest -Uri "https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/send-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"to":"ls8528950@gmail.com","subject":"🎉 Teste MailerSend","html":"<h1>Funcionou!</h1><p>Emails agora funcionam! 🚀</p>"}' -UseBasicParsing

# 3. Processar fila
Invoke-WebRequest -Uri "https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}' -UseBasicParsing
