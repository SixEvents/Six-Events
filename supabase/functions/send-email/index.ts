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

    // Usar Resend com domínio onboarding grátis
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Six Events <noreply@sixevents.be>',
        to: [to],
        subject: subject,
        html: html
      })
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error('❌ Resend error:', errorData)
      throw new Error(`Resend API error: ${errorData}`)
    }

    console.log(`✅ Email sent successfully to ${to}`)

    return new Response(
      JSON.stringify({ success: true, status: res.status }),
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
