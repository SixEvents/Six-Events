# 💳 CONFIGURAÇÃO DE PAGAMENTOS - SIX EVENTS

Este guia explica como configurar sua conta para receber pagamentos por cartão de crédito.

---

## 📋 ÍNDICE
1. [Opções de Pagamento](#opções-de-pagamento)
2. [Stripe (Recomendado)](#stripe-recomendado)
3. [PayPal](#paypal)
4. [Configuração no Sistema](#configuração-no-sistema)
5. [Testando Pagamentos](#testando-pagamentos)

---

## 💰 OPÇÕES DE PAGAMENTO

Existem 2 principais serviços para aceitar pagamentos online:

### **1. Stripe** (Recomendado)
- ✅ Taxas: 1.4% + 0.25€ por transação (Europa)
- ✅ Aceita todos os cartões de crédito
- ✅ Transferência automática para sua conta bancária
- ✅ Dashboard completo com estatísticas
- ✅ API moderna e fácil de integrar
- ✅ Excelente suporte para França

### **2. PayPal**
- ⚠️ Taxas: 3.4% + 0.25€ por transação
- ✅ Aceita cartões e conta PayPal
- ⚠️ Mais caro que Stripe
- ✅ Muito conhecido pelos clientes

---

## 🔵 STRIPE (RECOMENDADO)

### Passo 1: Criar Conta Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Preencha:
   - **Email:** Seu email profissional
   - **Nome completo**
   - **País:** França
   - **Senha**

3. Confirme seu email

### Passo 2: Configurar Informações Bancárias

1. No Dashboard Stripe: https://dashboard.stripe.com
2. Clique em **"Paramètres"** (Settings)
3. Clique em **"Comptes bancaires et horaires"**
4. Adicione sua conta bancária:
   - **IBAN:** Seu IBAN bancário
   - **BIC/SWIFT:** Código do banco
   - **Nome do titular:** Seu nome ou empresa

5. Stripe fará uma transferência de verificação (0.01€)

### Passo 3: Ativar Modo Produção

1. Complete as informações da empresa:
   - Nome da empresa ou seu nome
   - Endereço
   - SIRET/SIREN (se empresa)
   - Tipo de atividade: "Eventos e entretenimento"

2. Ative o modo **Production** (Live mode)

### Passo 4: Obter Chaves API

1. No Dashboard: https://dashboard.stripe.com/apikeys
2. Copie as chaves:
   - **Publishable key** (começa com `pk_live_...`)
   - **Secret key** (começa com `sk_live_...`)

⚠️ **IMPORTANTE:** Nunca compartilhe a Secret key!

### Passo 5: Configurar no Six Events

Crie arquivo `.env.local` na raiz do projeto:

```bash
# Stripe Production
VITE_STRIPE_PUBLIC_KEY=pk_live_SEU_PUBLISHABLE_KEY_AQUI
STRIPE_SECRET_KEY=sk_live_SEU_SECRET_KEY_AQUI

# Para testes (opcional)
VITE_STRIPE_PUBLIC_KEY_TEST=pk_test_SEU_TEST_KEY_AQUI
STRIPE_SECRET_KEY_TEST=sk_test_SEU_TEST_KEY_AQUI
```

---

## 💙 PAYPAL

### Passo 1: Criar Conta Business

1. Acesse: https://www.paypal.com/fr/business
2. Clique em **"Créer un compte Business"**
3. Preencha:
   - Email profissional
   - Tipo de conta: **Business**
   - Nome da empresa
   - Informações fiscais

### Passo 2: Verificar Conta

1. Confirme seu email
2. Adicione conta bancária:
   - IBAN
   - BIC
3. PayPal fará 2 pequenos depósitos para verificação

### Passo 3: Ativar Recebimentos

1. No painel: https://www.paypal.com/businessmanage
2. Vá em **"Compte et paramètres"**
3. Ative **"Paiements par carte"**
4. Configure taxas e limites

### Passo 4: Obter Credenciais API

1. Vá em **Developer** → **My Apps & Credentials**
2. URL: https://developer.paypal.com/developer/applications
3. Clique em **"Create App"**
4. Copie:
   - **Client ID**
   - **Secret**

### Passo 5: Configurar no Six Events

No arquivo `.env.local`:

```bash
# PayPal Production
VITE_PAYPAL_CLIENT_ID=SEU_CLIENT_ID_AQUI
PAYPAL_SECRET=SEU_SECRET_AQUI

# Para testes (opcional)
VITE_PAYPAL_CLIENT_ID_SANDBOX=SEU_SANDBOX_CLIENT_ID
PAYPAL_SECRET_SANDBOX=SEU_SANDBOX_SECRET
```

---

## ⚙️ CONFIGURAÇÃO NO SISTEMA

### Instalar Dependências

```bash
npm install @stripe/stripe-js stripe
# OU
npm install @paypal/react-paypal-js
```

### Criar Serviço de Pagamento

Crie o arquivo `src/lib/payment.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createPaymentIntent(amount: number, reservationId: string) {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Converter para centavos
        reservationId,
        currency: 'eur'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar payment intent:', error);
    throw error;
  }
}

export { stripePromise };
```

### Criar Endpoint Backend (Supabase Edge Function)

Crie `supabase/functions/create-payment-intent/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { amount, reservationId, currency } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'eur',
      metadata: { reservationId },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Deploy da Edge Function

```bash
# Configurar Stripe Secret no Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_live_SUA_SECRET_KEY

# Deploy da função
supabase functions deploy create-payment-intent
```

---

## 🧪 TESTANDO PAGAMENTOS

### Modo de Teste Stripe

Use cartões de teste:

```
Cartão de sucesso:
Número: 4242 4242 4242 4242
CVC: Qualquer 3 dígitos
Data: Qualquer data futura
CEP: Qualquer

Cartão recusado:
Número: 4000 0000 0000 0002
```

Mais cartões de teste: https://stripe.com/docs/testing

### Modo Sandbox PayPal

1. Criar contas de teste em: https://developer.paypal.com/developer/accounts
2. Use credenciais sandbox no `.env.local`
3. Faça login com conta de teste no checkout

---

## 💰 COMO RECEBER O DINHEIRO

### Stripe

1. **Transferências automáticas:**
   - Stripe transfere para sua conta bancária automaticamente
   - Frequência: Diária, semanal ou mensal (você escolhe)
   - Prazo: 2-7 dias úteis após a venda

2. **Configurar frequência:**
   - Dashboard → Settings → Bank accounts and scheduling
   - Escolha: Daily, Weekly, Monthly
   - Selecione o dia da semana/mês

3. **Acompanhar transferências:**
   - Dashboard → Balance → Payouts
   - Veja todas as transferências realizadas

### PayPal

1. **Dinheiro fica na conta PayPal**
2. **Transferir para banco:**
   - Clique em "Transfert vers votre banque"
   - Selecione conta bancária
   - Digite valor
   - Prazo: 2-3 dias úteis
   - Sem taxa para transferências

3. **OU usar diretamente:**
   - Pagar fornecedores pelo PayPal
   - Cartão de débito PayPal

---

## 📊 TAXAS RESUMIDAS

| Serviço | Taxa por transação | Tempo de recebimento |
|---------|-------------------|---------------------|
| Stripe  | 1.4% + 0.25€      | 2-7 dias automático |
| PayPal  | 3.4% + 0.25€      | 2-3 dias manual     |

**Exemplo:** Venda de 150€
- Stripe: você recebe 147,60€ (taxa de 2,40€)
- PayPal: você recebe 144,60€ (taxa de 5,40€)

---

## 🔒 SEGURANÇA

### ✅ O que FAZER:
- ✅ Guardar Secret Keys em variáveis de ambiente
- ✅ NUNCA commitar chaves no Git
- ✅ Usar HTTPS em produção
- ✅ Validar pagamentos no backend
- ✅ Ativar 2FA nas contas Stripe/PayPal

### ❌ O que NÃO fazer:
- ❌ Nunca colocar Secret Key no código frontend
- ❌ Não processar pagamentos apenas no frontend
- ❌ Não confiar em dados do cliente sem validar

---

## 📞 SUPORTE

### Stripe
- Suporte 24/7: https://support.stripe.com
- Chat ao vivo no dashboard
- Email: support@stripe.com

### PayPal
- Central de ajuda: https://www.paypal.com/fr/smarthelp
- Telefone: 0 800 94 28 90 (França)
- Email através do painel

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Criar conta Stripe/PayPal
- [ ] Verificar conta bancária
- [ ] Ativar modo Production
- [ ] Obter chaves API
- [ ] Configurar `.env.local`
- [ ] Instalar dependências npm
- [ ] Criar serviço de pagamento
- [ ] Deploy da Edge Function
- [ ] Testar no modo sandbox
- [ ] Fazer teste real com 1€
- [ ] Configurar webhook (opcional)
- [ ] Verificar recebimento na conta bancária

---

## 🚀 PRÓXIMOS PASSOS

Após configurar:

1. **Atualizar CheckoutEvent.tsx** para usar Stripe
2. **Adicionar formulário de cartão** com Stripe Elements
3. **Implementar webhook** para confirmar pagamentos
4. **Adicionar email de confirmação** após pagamento
5. **Criar dashboard** de vendas e estatísticas

**Documentação completa em:**
- Stripe React: https://stripe.com/docs/stripe-js/react
- PayPal React: https://developer.paypal.com/sdk/js/react/

---

## 📝 NOTAS IMPORTANTES

1. **Pagamento em espécie** já está implementado (payment_method: 'cash')
   - Reserva fica com status 'pending'
   - Confirmar manualmente no admin

2. **Reembolsos:**
   - Stripe: Direto no dashboard
   - PayPal: Botão "Remboursement" na transação

3. **Impostos:**
   - Declarar receitas no imposto de renda
   - Considerar contratar contador
   - Emitir faturas (obrigatório se empresa)

---

**Data:** 26 de novembro de 2025  
**Sistema:** Six Events Platform  
**Autor:** Documentação técnica
