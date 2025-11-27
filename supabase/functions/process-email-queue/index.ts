import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://rzcdcwwdlnczojmslhax.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

console.log('🚀 Email Queue Processor initialized')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Resend API Key:', resendApiKey ? 'Configured ✅' : 'Missing ❌')

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
    console.log('🔍 Processing email queue...')

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar emails pendentes (max 10)
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Error fetching emails:', fetchError)
      throw fetchError
    }

    if (!emails || emails.length === 0) {
      console.log('✅ No emails in queue')
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } }
      )
    }

    console.log(`📧 Processing ${emails.length} emails...`)

    let successCount = 0
    let failCount = 0

    for (const email of emails) {
      try {
        // Incrementar tentativas
        await supabase
          .from('email_queue')
          .update({ attempts: email.attempts + 1 })
          .eq('id', email.id)

        // 🔥 CRITICAL FIX: Parse data se for string (emails antigos com JSON.stringify)
        let emailData = email.data
        if (typeof emailData === 'string') {
          console.log('⚠️ Data is string, parsing...', emailData.substring(0, 100))
          try {
            emailData = JSON.parse(emailData)
          } catch (parseError) {
            console.error('❌ Failed to parse data:', parseError)
            throw new Error('Invalid email data format')
          }
        }

        let html = ''
        let subject = ''

        // Gerar HTML baseado no tipo
        if (email.type === 'reservation_confirmation') {
          subject = `Confirmação de Reserva - ${emailData.eventName || 'Evento'}`
          html = generateReservationEmailHTML(emailData)
        } else if (email.type === 'party_builder_demand') {
          subject = 'Nova Solicitação de Party Builder'
          html = generatePartyBuilderDemandHTML(emailData)
        } else if (email.type === 'party_builder_confirmation') {
          subject = 'Confirmação de Solicitação - Party Builder'
          html = generatePartyBuilderClientConfirmationHTML(emailData)
        }

        console.log(`📤 Sending ${email.type} to ${email.recipient_email}...`)

        // Preparar attachments para QR codes (se houver)
        const attachments: any[] = []
        if (email.type === 'reservation_confirmation' && emailData.qrCodes && emailData.qrCodes.length > 0) {
          console.log(`🔍 Processing ${emailData.qrCodes.length} QR codes for attachments...`)
          
          for (let i = 0; i < emailData.qrCodes.length; i++) {
            const qr = emailData.qrCodes[i]
            if (qr.dataUrl && qr.dataUrl.startsWith('data:image/png;base64,')) {
              const base64Content = qr.dataUrl.replace('data:image/png;base64,', '')
              
              // Resend precisa de um formato específico para attachments
              attachments.push({
                filename: `qrcode-${i + 1}.png`,
                content: base64Content
              })
              
              console.log(`✅ Added attachment: qrcode-${i + 1}.png (${Math.round(base64Content.length / 1024)}KB)`)
            }
          }
          
          console.log(`📎 Total attachments prepared: ${attachments.length}`)
        }

        // Atualizar HTML para usar cid: ao invés de data URLs
        let finalHtml = html
        if (attachments.length > 0) {
          console.log(`🔄 Replacing data URLs with cid: references...`)
          
          emailData.qrCodes.forEach((qr: any, index: number) => {
            const cidReference = `cid:qrcode-${index + 1}.png`
            finalHtml = finalHtml.replace(qr.dataUrl, cidReference)
            console.log(`   Replaced QR ${index + 1}: data:image... -> ${cidReference}`)
          })
        }

        // Enviar via Resend
        const emailPayload: any = {
          from: 'Six Events <noreply@sixevents.be>',
          to: [email.recipient_email],
          subject: subject,
          html: finalHtml
        }

        if (attachments.length > 0) {
          emailPayload.attachments = attachments
          console.log(`📎 Email payload includes ${attachments.length} attachments`)
        }

        console.log(`📬 Sending email via Resend API...`)
        
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify(emailPayload)
        })

        const responseData = await res.text()
        
        if (!res.ok) {
          console.error('❌ Resend API error:', responseData)
          throw new Error(`Resend error: ${responseData}`)
        }
        
        console.log(`✅ Resend API response:`, responseData)

        // Marcar como enviado
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', email.id)

        console.log(`✅ Email sent to ${email.recipient_email}`)
        successCount++

      } catch (error) {
        console.error(`Error sending email ${email.id}:`, error)
        failCount++

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Se falhou 3 vezes, marcar como failed
        if (email.attempts + 1 >= 3) {
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: errorMessage
            })
            .eq('id', email.id)
          console.log(`❌ Email ${email.id} failed after 3 attempts`)
        } else {
          // Guardar erro mas deixar tentar novamente
          await supabase
            .from('email_queue')
            .update({ error_message: errorMessage })
            .eq('id', email.id)
        }
      }
    }

    console.log(`✅ Processed: ${successCount} sent, ${failCount} failed`)

    return new Response(
      JSON.stringify({ success: true, processed: successCount, failed: failCount }),
      { headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } }
    )

  } catch (error) {
    console.error('Error processing queue:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
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

// Template para email de reserva
function generateReservationEmailHTML(data: any): string {
  const { eventName, eventDate, eventLocation, ticketCount, participants, totalAmount, qrCodes } = data
  
  const safeQrCodes = qrCodes || []
  const safeParticipants = participants || []
  const safeTotalAmount = totalAmount || 0

  const formattedDate = new Date(eventDate).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  let qrCodesHTML = ''
  safeQrCodes.forEach((qr: any, index: number) => {
    qrCodesHTML += `
      <div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Bilhete ${index + 1} - ${qr.name}</h3>
        <img src="${qr.dataUrl}" alt="QR Code ${qr.name}" style="max-width: 300px; height: auto; display: block; margin: 10px auto;" />
        <p style="font-size: 12px; color: #666; text-align: center; margin: 10px 0 0 0;">
          Apresente este QR Code na entrada do evento
        </p>
      </div>
    `
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Six Events</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-top: 0;">Reserva Confirmada!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Sua reserva para <strong>${eventName}</strong> foi confirmada com sucesso!
          </p>

          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📋 Detalhes do Evento</h3>
            <p style="margin: 8px 0; color: #666;"><strong>Evento:</strong> ${eventName}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Data:</strong> ${formattedDate}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Local:</strong> ${eventLocation}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Bilhetes:</strong> ${ticketCount}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Total Pago:</strong> €${safeTotalAmount.toFixed(2)}</p>
          </div>

          ${safeParticipants.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">👥 Participantes</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${safeParticipants.map((p: string) => `
                <li style="padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px;">
                  ${p}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">🎫 Seus QR Codes</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Guarde bem estes QR codes! Você precisará apresentá-los na entrada do evento.
            </p>
            ${qrCodesHTML}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Salve este email ou tire screenshots dos QR codes. 
              Você precisará deles para entrar no evento!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              Qualquer dúvida, entre em contato conosco
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              Six Events - Seus eventos inesquecíveis
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template para Party Builder - Email Admin
function generatePartyBuilderDemandHTML(data: any): string {
  const safeAnimations = data.animations || []
  const safeDecorations = data.decorations || []
  const safeExtras = data.extras || []
  const safeEstimatedPrice = data.estimatedPrice || 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1 style="color: white; margin: 0;">🎨 Nova Solicitação Party Builder</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Detalhes da Solicitação</h2>
          
          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">📋 Informações do Cliente</h3>
            <p><strong>Nome:</strong> ${data.clientName}</p>
            <p><strong>Email:</strong> ${data.clientEmail}</p>
            <p><strong>Telefone:</strong> ${data.clientPhone}</p>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">🎉 Detalhes do Evento</h3>
            <p><strong>Tipo:</strong> ${data.eventType}</p>
            <p><strong>Data:</strong> ${new Date(data.eventDate).toLocaleDateString('pt-PT')}</p>
            <p><strong>Horário:</strong> ${data.eventTime}</p>
            <p><strong>Participantes:</strong> ${data.guestCount}</p>
            <p><strong>Orçamento:</strong> €${data.budget}</p>
          </div>

          ${safeAnimations.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>🎭 Animações Selecionadas</h3>
            <ul>
              ${safeAnimations.map((a: any) => `<li>${a.name} - €${a.price}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${safeDecorations.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>🎨 Decorações Selecionadas</h3>
            <ul>
              ${safeDecorations.map((d: any) => `<li>${d.name} - €${d.price}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${safeExtras.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>➕ Extras Selecionados</h3>
            <ul>
              ${safeExtras.map((e: any) => `<li>${e.name} - €${e.price}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #155724;">💰 Preço Estimado Total</h3>
            <p style="font-size: 24px; font-weight: bold; color: #155724; margin: 10px 0;">
              €${safeEstimatedPrice.toFixed(2)}
            </p>
          </div>

          ${data.message ? `
          <div style="margin: 20px 0;">
            <h3>💬 Mensagem do Cliente</h3>
            <p style="background: #f9f9f9; padding: 15px; border-radius: 4px; font-style: italic;">
              "${data.message}"
            </p>
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

// Template para Party Builder - Email Cliente
function generatePartyBuilderClientConfirmationHTML(data: any): string {
  const safeEstimatedPrice = data.estimatedPrice || 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0;">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1 style="color: white; margin: 0;">🎉 Six Events</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Solicitação Recebida!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Olá <strong>${data.clientName}</strong>,
          </p>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Recebemos sua solicitação para o <strong>Party Builder</strong> e estamos muito animados 
            em ajudar a criar seu evento perfeito!
          </p>

          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">📋 Resumo da Solicitação</h3>
            <p><strong>Tipo de Evento:</strong> ${data.eventType}</p>
            <p><strong>Data:</strong> ${new Date(data.eventDate).toLocaleDateString('pt-PT')}</p>
            <p><strong>Participantes:</strong> ${data.guestCount}</p>
            <p><strong>Preço Estimado:</strong> €${safeEstimatedPrice.toFixed(2)}</p>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-size: 14px;">
              <strong>✅ Próximos Passos:</strong><br>
              Nossa equipe irá analisar sua solicitação e entrar em contato em até 24-48 horas 
              para confirmar os detalhes e finalizar o orçamento.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Qualquer dúvida, entre em contato conosco
            </p>
            <p style="color: #999; font-size: 12px;">
              Six Events - Criando momentos inesquecíveis
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
