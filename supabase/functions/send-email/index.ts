import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, html, recipientName } = await req.json()

    console.log(`📤 Sending email to ${to}...`)

    // Usar Resend API (muito mais simples que Gmail)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Six Events <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('❌ Resend error:', data)
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }

    console.log(`✅ Email sent successfully to ${to}`)

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
