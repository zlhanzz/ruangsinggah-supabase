
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const id = 'c970397d-b70b-4688-b652-270d3f76a17c';
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
