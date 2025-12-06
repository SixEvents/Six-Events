// Script de teste para verificar emails de Party Builder
// Execute: node test-party-builder-email.js
import { createClient } from '@supabase/supabase-js';

// Coloque suas credenciais aqui temporariamente
const SUPABASE_URL = 'https://your-project.supabase.co'; // SUBSTITUA
const SUPABASE_KEY = 'your-anon-key'; // SUBSTITUA

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPartyBuilderEmail() {
  console.log('🧪 Testando sistema de emails Party Builder...\n');

  try {
    // 1. Verificar últimas demandas
    console.log('1️⃣ Verificando últimas demandas...');
    const { data: requests, error: reqError } = await supabase
      .from('party_builder_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (reqError) {
      console.error('❌ Erro ao buscar demandas:', reqError.message);
      return;
    }

    console.log(`✅ Encontradas ${requests?.length || 0} demandas`);
    if (requests && requests.length > 0) {
      console.log('\nÚltima demanda:');
      console.log('  ID:', requests[0].id);
      console.log('  Cliente:', requests[0].client_name);
      console.log('  Email:', requests[0].client_email);
      console.log('  Status:', requests[0].status);
      console.log('  Data:', requests[0].created_at);
    }

    // 2. Verificar emails na fila
    console.log('\n2️⃣ Verificando fila de emails...');
    const { data: emails, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (emailError) {
      console.error('❌ Erro ao buscar fila de emails:', emailError.message);
      return;
    }

    console.log(`✅ Encontrados ${emails?.length || 0} emails na fila\n`);
    
    if (emails && emails.length > 0) {
      console.log('Últimos emails:');
      emails.forEach((email, idx) => {
        console.log(`\n${idx + 1}. ${email.type}`);
        console.log(`   Para: ${email.recipient_email}`);
        console.log(`   Status: ${email.status}`);
        console.log(`   Tentativas: ${email.attempts}`);
        console.log(`   Criado: ${email.created_at}`);
        if (email.error_message) {
          console.log(`   ❌ Erro: ${email.error_message}`);
        }
      });
    }

    // 3. Verificar emails party builder especificamente
    console.log('\n3️⃣ Emails de Party Builder:');
    const pbEmails = emails?.filter(e => 
      e.type === 'party_builder_request' || 
      e.type === 'party_builder_status_update' ||
      e.type === 'party_builder_quote'
    );
    
    console.log(`   Total: ${pbEmails?.length || 0}`);
    console.log(`   Pendentes: ${pbEmails?.filter(e => e.status === 'pending').length || 0}`);
    console.log(`   Enviados: ${pbEmails?.filter(e => e.status === 'sent').length || 0}`);
    console.log(`   Falhou: ${pbEmails?.filter(e => e.status === 'failed').length || 0}`);

    // 4. Sugestões
    console.log('\n💡 DIAGNÓSTICO:');
    
    const pendingEmails = emails?.filter(e => e.status === 'pending');
    if (pendingEmails && pendingEmails.length > 0) {
      console.log('⚠️  Você tem ' + pendingEmails.length + ' emails pendentes na fila!');
      console.log('   O email service precisa estar RODANDO para processar.');
      console.log('\n   Para iniciar o email service:');
      console.log('   1. Abra um novo terminal');
      console.log('   2. cd email-service');
      console.log('   3. npm start');
      console.log('   OU execute: START_EMAIL_SERVICE.bat\n');
    } else {
      console.log('✅ Não há emails pendentes');
    }

    const failedEmails = emails?.filter(e => e.status === 'failed');
    if (failedEmails && failedEmails.length > 0) {
      console.log('\n❌ ' + failedEmails.length + ' emails falharam!');
      console.log('   Problemas comuns:');
      console.log('   - Email service não configurado corretamente');
      console.log('   - Credenciais do Gmail incorretas no .env');
      console.log('   - Senha de aplicativo do Gmail não gerada');
    }
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
  }
}

testPartyBuilderEmail();
