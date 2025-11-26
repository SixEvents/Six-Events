import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURAR ESTAS VARIÁVEIS:
const SUPABASE_URL = 'https://rzcdcwwdlnczojmslhax.supabase.co';
const SERVICE_ROLE_KEY = 'COLE_SUA_SERVICE_ROLE_KEY_AQUI'; // ⚠️ MUDAR AQUI

console.log('🔍 Verificando fila de emails...\n');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkQueue() {
  try {
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar emails:', error.message);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('✅ Nenhum email pendente na fila');
      return;
    }

    console.log(`📧 Emails pendentes: ${emails.length}\n`);

    emails.forEach((email, index) => {
      console.log(`Email ${index + 1}:`);
      console.log(`  ID: ${email.id}`);
      console.log(`  Para: ${email.recipient_email}`);
      console.log(`  Nome: ${email.recipient_name || 'NULL'}`);
      console.log(`  Tipo: ${email.type}`);
      console.log(`  Status: ${email.status}`);
      console.log(`  Tentativas: ${email.attempts}`);
      console.log(`  Criado: ${email.created_at}`);
      console.log(`  Reservation ID: ${email.reservation_id || 'NULL'}`);
      console.log(`  Erro: ${email.error_message || 'NULL'}`);
      console.log('');
    });

    // Verificar RLS
    console.log('🔐 Testando permissões RLS...');
    const { error: insertError } = await supabase
      .from('email_queue')
      .insert({
        type: 'test',
        recipient_email: 'test@test.com',
        recipient_name: null,
        data: { test: true },
      });

    if (insertError) {
      console.log('❌ RLS bloqueando INSERT:', insertError.message);
      console.log('\n⚠️  EXECUTE A MIGRATION SQL:');
      console.log('   supabase/migrations/fix_email_queue_recipient_name.sql\n');
    } else {
      console.log('✅ RLS configurado corretamente');
      
      // Deletar o teste
      await supabase
        .from('email_queue')
        .delete()
        .eq('recipient_email', 'test@test.com');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkQueue();
