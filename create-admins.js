// Script Node.js pour créer automatiquement les 10 comptes admin
// Six Events Platform - Admin Account Creator
// 
// PRÉREQUIS:
// npm install @supabase/supabase-js dotenv
//
// UTILISATION:
// node create-admins.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = 'VOTRE_SERVICE_ROLE_KEY'; // ⚠️ À remplacer par votre Service Role Key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.log('Assurez-vous d\'avoir:');
  console.log('- VITE_SUPABASE_URL dans .env');
  console.log('- Service Role Key dans ce script (ligne 16)');
  process.exit(1);
}

// Créer un client Supabase avec Service Role Key (droits admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Liste des 10 comptes admin
const adminAccounts = [
  { email: 'admin1@sixevents.com', password: 'Admin123!SixEvents', name: 'Sophie Martin' },
  { email: 'admin2@sixevents.com', password: 'Admin123!SixEvents', name: 'Lucas Dubois' },
  { email: 'admin3@sixevents.com', password: 'Admin123!SixEvents', name: 'Emma Bernard' },
  { email: 'admin4@sixevents.com', password: 'Admin123!SixEvents', name: 'Thomas Petit' },
  { email: 'admin5@sixevents.com', password: 'Admin123!SixEvents', name: 'Léa Richard' },
  { email: 'admin6@sixevents.com', password: 'Admin123!SixEvents', name: 'Nathan Moreau' },
  { email: 'admin7@sixevents.com', password: 'Admin123!SixEvents', name: 'Chloé Laurent' },
  { email: 'admin8@sixevents.com', password: 'Admin123!SixEvents', name: 'Hugo Simon' },
  { email: 'admin9@sixevents.com', password: 'Admin123!SixEvents', name: 'Manon Michel' },
  { email: 'admin10@sixevents.com', password: 'Admin123!SixEvents', name: 'Arthur Garcia' }
];

// Fonction pour créer un compte admin
async function createAdminAccount(email, password, fullName) {
  try {
    // Créer l'utilisateur
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        role: 'admin',
        full_name: fullName
      }
    });

    if (createError) {
      throw createError;
    }

    console.log(`✅ Compte créé: ${email} (${fullName})`);
    return { success: true, data: userData };

  } catch (error) {
    if (error.message.includes('already registered')) {
      console.log(`⚠️  Compte existant: ${email}`);
      return { success: false, error: 'already_exists' };
    }
    console.error(`❌ Erreur pour ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function createAllAdmins() {
  console.log('🚀 Démarrage de la création des comptes admin...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  let successCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  for (const account of adminAccounts) {
    const result = await createAdminAccount(account.email, account.password, account.name);
    
    if (result.success) {
      successCount++;
    } else if (result.error === 'already_exists') {
      existingCount++;
    } else {
      errorCount++;
    }

    // Pause de 500ms entre chaque création pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n📊 Résumé de la création:\n');
  console.log(`✅ Créés avec succès: ${successCount}`);
  console.log(`⚠️  Déjà existants: ${existingCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📝 Total traité: ${adminAccounts.length}`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n🎉 Terminé ! Les comptes admin sont prêts.\n');
  console.log('📧 Identifiants de connexion:');
  console.log('   Email: admin1@sixevents.com à admin10@sixevents.com');
  console.log('   Mot de passe: Admin123!SixEvents\n');
  console.log('⚠️  N\'oubliez pas de changer les mots de passe !\n');
}

// Vérifier les comptes existants
async function checkExistingAdmins() {
  console.log('🔍 Vérification des comptes admin existants...\n');

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const admins = data.users.filter(user => 
      user.user_metadata?.role === 'admin'
    );

    console.log(`👥 Nombre total d'utilisateurs: ${data.users.length}`);
    console.log(`👑 Nombre d'admins existants: ${admins.length}\n`);

    if (admins.length > 0) {
      console.log('Liste des admins:');
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.email} - ${admin.user_metadata?.full_name || 'Sans nom'}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Menu interactif
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--check')) {
    await checkExistingAdmins();
  } else if (args.includes('--help')) {
    console.log('\n📖 Utilisation du script:\n');
    console.log('  node create-admins.js           Créer les 10 comptes admin');
    console.log('  node create-admins.js --check   Vérifier les admins existants');
    console.log('  node create-admins.js --help    Afficher cette aide\n');
  } else {
    await checkExistingAdmins();
    console.log('═══════════════════════════════════════════════════════\n');
    await createAllAdmins();
  }
}

// Exécuter le script
main().catch(console.error);
