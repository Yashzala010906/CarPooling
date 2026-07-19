import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scmmklcnvikjvntonjya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TEw5IVHamQZEnSnBvunfRA_02W8nkmu';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedAdmin() {
  console.log('Inserting default System Admin into Supabase database...');
  const adminAccount = {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'admin@gmail.com',
    avatar: '👨‍💼',
    organization: 'Odoo Enterprise',
    role: 'Administrator',
    department: 'Administration',
    rating: 5.0,
    rides_completed: 0,
    wallet_balance: 5000.00
  };

  const { error } = await supabase.from('profiles').upsert(adminAccount);
  if (error) {
    console.error('Error inserting admin into Supabase:', error.message);
  } else {
    console.log('✅ Default System Admin (admin@gmail.com) added to Supabase database!');
  }
}

seedAdmin();
