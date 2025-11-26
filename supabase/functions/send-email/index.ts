import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY')

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

    // Usar MailerSend API (12.000 emails/mês grátis)
    const res = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        from: {
          email: 'info@trial.mlsender.net',
          name: 'Six Events'
        },
        to: [{
          email: to,
          name: recipientName || 'Client'
        }],
        subject: subject,
        html: html
      })
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error('❌ MailerSend error:', errorData)
      throw new Error(`MailerSend API error: ${errorData}`)
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
