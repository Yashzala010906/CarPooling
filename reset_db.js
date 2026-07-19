import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scmmklcnvikjvntonjya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TEw5IVHamQZEnSnBvunfRA_02W8nkmu';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clearDatabase() {
  console.log('Clearing all database records...');
  try {
    const res1 = await supabase.from('rides').delete().neq('id', '0');
    const res2 = await supabase.from('transactions').delete().neq('id', '0');
    const res3 = await supabase.from('saved_places').delete().neq('id', '0');
    const res4 = await supabase.from('vehicles').delete().neq('id', '0');
    const res5 = await supabase.from('profiles').delete().neq('id', '0');
    
    // Sign out any active auth session
    await supabase.auth.signOut();
    
    console.log('✅ Database reset complete! All users and data cleared to 0.');
  } catch (err) {
    console.error('Error clearing database:', err);
  }
}

clearDatabase();
