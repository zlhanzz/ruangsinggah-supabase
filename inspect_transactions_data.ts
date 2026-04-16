
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './functions/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, product_id, status');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Transactions Count:', data.length);
  console.log('Unique User IDs:', [...new Set(data.map(d => d.user_id))]);
  console.log('Data Sample:', data.slice(0, 5));
}

checkTransactions();
