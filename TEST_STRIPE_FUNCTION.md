# Test de la fonction create-checkout-session

## Via curl:

```bash
curl -X POST https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-id",
    "eventTitle": "Test Event",
    "eventDate": "2025-12-01",
    "eventLocation": "Paris",
    "quantity": 1,
    "totalPrice": 25,
    "buyerName": "Test User",
    "buyerEmail": "test@example.com",
    "buyerPhone": "0123456789",
    "participants": ["Test User"],
    "userId": "test-user-id"
  }'
```

## Réponse attendue:

```json
{
  "sessionId": "cs_live_...",
  "url": "https://checkout.stripe.com/c/pay/cs_live_..."
}
```

## À vérifier dans Supabase:

1. **Edge Function déployée?**
   - Aller sur: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions
   - Vérifier que `create-checkout-session` existe et est "Active"

2. **Variable STRIPE_SECRET_KEY configurée?**
   - Functions → Settings → Secrets
   - Doit contenir: `STRIPE_SECRET_KEY` = `sk_live_...`

3. **Logs de la fonction:**
   - Cliquer sur la fonction → Logs
   - Vérifier s'il y a des erreurs lors de l'exécution
