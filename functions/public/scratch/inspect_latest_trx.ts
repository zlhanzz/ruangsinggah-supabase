import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function inspectLatestTransaction() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- LATEST TRANSACTION ---');
  console.log('ID:', data.id);
  console.log('Status:', data.status);
  console.log('Move In Date:', data.move_in_date);
  console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
}

inspectLatestTransaction();
