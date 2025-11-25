# 📋 PRÓXIMAS ETAPAS - Six Events Platform

## ✅ JÁ IMPLEMENTADO (Nesta sessão)

1. ✅ Configuração LIVE Stripe keys (production)
2. ✅ Sistema Gmail SMTP completo (src/lib/gmail.ts)
3. ✅ Email Service Node.js separado (email-service/)
4. ✅ Webhook Stripe v2 com gestão de places (stripe-webhook-v2/)
5. ✅ Tabela email_queue no banco
6. ✅ Templates de email (reserva + Party Builder)
7. ✅ Dockerfile e instruções de deployment
8. ✅ README completo com documentação

## 🚧 AINDA A FAZER (Ordem de prioridade)

### URGENTE - Configurações necessárias para funcionar

#### 1. Configurar Google App Password
**Status**: ⏳ BLOQUEADO
**Onde**: Google Account Settings
**Como fazer**:
```
1. Ir em: https://myaccount.google.com/apppasswords
2. Login com 6events.mjt@gmail.com
3. Criar senha para "Mail"
4. Copiar senha de 16 caracteres (formato: xxxx xxxx xxxx xxxx)
5. Adicionar em:
   - .env: GMAIL_APP_PASSWORD=xxxx
   - email-service/.env: GMAIL_APP_PASSWORD=xxxx
```
**Impacto**: SEM ISSO, EMAILS NÃO FUNCIONAM

#### 2. Aplicar migrations SQL no Supabase
**Status**: ⏳ PENDENTE
**Onde**: Supabase Dashboard > SQL Editor
**Arquivos**:
```sql
-- Executar na ordem:
1. supabase/migrations/ADD_STRIPE_COLUMNS.sql
2. supabase/migrations/ADD_EMAIL_QUEUE_TABLE.sql
```
**Impacto**: SEM ISSO, webhook e emails falham

#### 3. Deploy do Email Service
**Status**: ⏳ PENDENTE
**Onde**: Railway.app (recomendado) ou Render.com
**Como fazer**:

**Opção A - Railway (mais fácil):**
```bash
cd email-service
railway login
railway init
railway up

# Adicionar variáveis de ambiente no dashboard:
VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GMAIL_USER
GMAIL_APP_PASSWORD
EMAIL_FROM
EMAIL_FROM_NAME
```

**Opção B - Render:**
```
1. Conectar GitHub
2. New > Web Service
3. Repository: six-events-platform-main
4. Root Directory: email-service
5. Build Command: npm install
6. Start Command: npm start
7. Adicionar env vars
```

**Impacto**: SEM ISSO, emails ficam pendentes e nunca são enviados

#### 4. Configurar Stripe Webhook URL
**Status**: ⏳ PENDENTE
**Onde**: https://dashboard.stripe.com/webhooks
**Como fazer**:
```
1. Criar novo webhook (LIVE mode, não test)
2. URL: https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/stripe-webhook
3. Eventos: checkout.session.completed, payment_intent.succeeded
4. Copiar Signing Secret (whsec_...)
5. Adicionar em Supabase Secrets:
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```
**Impacto**: SEM ISSO, pagamentos não criam reservas

#### 5. Configurar Supabase Secrets para Edge Functions
**Status**: ⏳ PENDENTE
**Onde**: Terminal (Supabase CLI)
**Como fazer**:
```bash
# Instalar CLI se necessário
npm install -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref rzcdcwwdlnczojmslhax

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sua_stripe_live_key_aqui
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```
**Impacto**: SEM ISSO, Edge Functions não funcionam

#### 6. Deploy Edge Functions no Supabase
**Status**: ⏳ PENDENTE
**Onde**: Terminal (Supabase CLI)
**Como fazer**:
```bash
cd c:\Users\ls852\Downloads\six-events-platform-main

# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy stripe-webhook (usando código da v2)
supabase functions deploy stripe-webhook-v2 --name stripe-webhook
```
**Impacto**: SEM ISSO, checkout e webhooks não funcionam

---

### IMPORTANTE - Modificações no código

#### 7. Adicionar verificação de disponibilidade PRÉ-checkout
**Status**: ❌ NÃO IMPLEMENTADO
**Onde**: `src/pages/CheckoutEvent.tsx`
**O que fazer**:

Antes de criar sessão Stripe, adicionar:
```typescript
// Buscar evento atual
const { data: event } = await supabase
  .from('events')
  .select('available_places')
  .eq('id', eventId)
  .single();

// Verificar disponibilidade
if (!event || event.available_places < quantity) {
  toast.error(`Désolé, seulement ${event.available_places || 0} place(s) disponible(s)`);
  return;
}

// Se OK, prosseguir com checkout
```

**Impacto**: Sem isso, pode tentar reservar evento esgotado

#### 8. Adicionar indicadores visuels de disponibilidade
**Status**: ❌ NÃO IMPLEMENTADO
**Onde**: 
- `src/pages/Events.tsx` (lista de eventos)
- `src/pages/EventDetail.tsx` (detalhe do evento)

**O que fazer**:

Criar função helper:
```typescript
const getAvailabilityBadge = (places: number) => {
  if (places === 0) {
    return { 
      text: 'COMPLET', 
      variant: 'destructive', 
      disabled: true 
    };
  } else if (places <= 5) {
    return { 
      text: `⚠️ Presque complet ! ${places} places`, 
      variant: 'destructive',
      disabled: false
    };
  } else if (places <= 10) {
    return { 
      text: `Plus que ${places} places !`, 
      variant: 'warning',
      disabled: false
    };
  } else {
    return { 
      text: `${places} places disponibles`, 
      variant: 'secondary',
      disabled: false
    };
  }
};

// Usar nos cards:
const availability = getAvailabilityBadge(event.available_places);
<Badge variant={availability.variant}>{availability.text}</Badge>
<Button disabled={availability.disabled}>Réserver</Button>
```

**Impacto**: Usuários não veem warnings de disponibilidade

#### 9. Modificar Party Builder para REMOVER pagamento
**Status**: ❌ NÃO IMPLEMENTADO
**Onde**: `src/pages/PartyBuilder.tsx`

**O que fazer**:
1. Remover integração com CartContext
2. Remover botão "Procéder au paiement"
3. Adicionar formulário de informações:
   - Data desejada
   - Local (opcional)
   - Número de crianças
   - Pedidos especiais (textarea)
4. Adicionar botão "Envoyer ma demande"
5. Ao clicar:
```typescript
const handleSubmitQuote = async () => {
  // Adicionar na email_queue
  await supabase
    .from('email_queue')
    .insert({
      type: 'party_builder_quote',
      recipient_email: userEmail,
      recipient_name: userName,
      data: {
        clientName: userName,
        clientEmail: userEmail,
        clientPhone: userPhone,
        eventDate: formData.eventDate,
        eventLocation: formData.location,
        numberOfChildren: formData.numberOfChildren,
        theme: selectedTheme,
        animations: selectedAnimations,
        decorations: selectedDecorations,
        cake: selectedCake,
        extras: selectedExtras,
        estimatedPrice: calculateTotal(),
        specialRequests: formData.specialRequests,
      },
      status: 'pending'
    });
  
  toast.success('Votre demande a été envoyée ! Nous vous contacterons sous 24-48h');
  navigate('/');
};
```

**Impacto**: Atualmente ainda tem pagamento (não deve ter)

---

### TESTING - Validação completa

#### 10. Testar fluxo completo de reserva
**Status**: ⏳ AGUARDANDO configurações
**Como testar**:
```
1. Escolher evento com places disponíveis
2. Preencher formulário de reserva
3. Usar cartão de teste Stripe: 4242 4242 4242 4242
4. Verificar:
   ✓ Pagamento aprovado
   ✓ Reserva criada no banco
   ✓ available_places decrementado
   ✓ Email na fila (email_queue)
   ✓ Email Service processa e envia
   ✓ Email recebido com QR codes
```

#### 11. Testar proteção contra over-booking
**Status**: ⏳ AGUARDANDO configurações
**Como testar**:
```
1. Criar evento com 3 places disponíveis
2. Abrir 2 tabs do navegador
3. Tentar reservar 2 places em cada tab simultaneamente
4. Verificar:
   ✓ Apenas uma das reservas deve passar
   ✓ Segunda deve falhar com "Not enough places"
   ✓ Refund automático se já pagou
```

#### 12. Testar Party Builder (quote request)
**Status**: ⏳ AGUARDANDO modificação do código
**Como testar**:
```
1. Configurar festa de aniversário
2. Clicar "Envoyer ma demande" (SEM pagar)
3. Verificar:
   ✓ Email na fila
   ✓ Email Service envia 2 emails:
     - Para 6events.mjt@gmail.com (devis complet)
     - Para cliente (confirmation)
```

#### 13. Testar indicadores de disponibilidade
**Status**: ⏳ AGUARDANDO modificação do código
**Como testar**:
```
Criar eventos com diferentes quantidades:
- 15 places → Badge normal
- 8 places → Badge ORANGE "Plus que 8 places !"
- 3 places → Badge ROUGE "⚠️ Presque complet ! 3 places"
- 0 places → Badge GRIS "COMPLET" + botão desativado
```

---

## 🎯 CHECKLIST FINAL ANTES DE PRODUÇÃO

### Configurações
- [ ] Google App Password configurado
- [ ] Migrations SQL aplicadas no Supabase
- [ ] Email Service deployado (Railway/Render)
- [ ] Stripe Webhook URL configurado
- [ ] Supabase Secrets configurados
- [ ] Edge Functions deployadas

### Código
- [ ] Verificação pré-checkout implementada
- [ ] Indicadores visuels implementados
- [ ] Party Builder modificado (sem pagamento)

### Testing
- [ ] Fluxo de reserva testado com cartão real
- [ ] Over-booking testado
- [ ] Party Builder testado
- [ ] Emails chegando corretamente
- [ ] QR codes funcionando

### Documentação
- [ ] README atualizado
- [ ] Variáveis de ambiente documentadas
- [ ] Instruções de deployment claras

---

## 📞 SUPORTE

Se tiver dúvidas ou problemas, verificar:

1. **Email Service não envia emails**:
   - Verificar se está rodando: `curl http://localhost:3001/health`
   - Verificar Gmail App Password
   - Ver logs do console
   - Verificar tabela `email_queue` no Supabase

2. **Webhook não funciona**:
   - Verificar URL no Stripe Dashboard
   - Verificar `STRIPE_WEBHOOK_SECRET`
   - Ver logs da Edge Function no Supabase Dashboard
   - Testar com Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

3. **Over-booking acontece**:
   - Verificar se Edge Function está atualizando `available_places`
   - Ver logs do webhook
   - Verificar se transaction é atomique

4. **Frontend não conecta**:
   - Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - Verificar `VITE_STRIPE_PUBLISHABLE_KEY`
   - Limpar cache: `npm run dev -- --force`

---

## 🚀 ORDEM RECOMENDADA DE EXECUÇÃO

**DIA 1 - Setup básico**:
1. Configurar Google App Password
2. Aplicar migrations SQL
3. Configurar Supabase Secrets
4. Deploy Edge Functions

**DIA 2 - Email Service**:
5. Deploy Email Service (Railway)
6. Configurar Stripe Webhook
7. Testar envio de emails

**DIA 3 - Código frontend**:
8. Implementar verificação pré-checkout
9. Implementar indicadores visuels
10. Modificar Party Builder

**DIA 4 - Testing**:
11. Testar fluxo completo
12. Testar over-booking
13. Testar Party Builder
14. Produção! 🎉

---

**Última atualização**: ${new Date().toLocaleString('pt-BR')}
