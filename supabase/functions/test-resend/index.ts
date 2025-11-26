// Script de teste simples - rodar no Deno Deploy ou localmente
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async () => {
  try {
    const RESEND_API_KEY = 're_ieNRafXY_31cfPEoZ3n5Rr6Mbf5BDaizx'
    
    console.log('🧪 Testando envio via Resend...')
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Six Events <onboarding@resend.dev>',
        to: ['ls8528950@gmail.com'],
        subject: '🎉 Teste Six Events',
        html: '<h1>Funcionou!</h1><p>O email service está funcionando perfeitamente via Resend 🚀</p>'
      })
    })

    const data = await res.json()
    
    console.log('Response:', res.status, data)
    
    return new Response(
      JSON.stringify({ success: res.ok, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
