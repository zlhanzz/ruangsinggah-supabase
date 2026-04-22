
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use service role for diagnosis if possible, else anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseMetadata() {
  console.log('--- DIAGNOSTIC START ---');
  
  // 1. Get sample transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  transactions.forEach((t, i) => {
    console.log(`Transaction ${i} [${t.id}]:`);
    console.log(` - Metadata Keys:`, Object.keys(t.metadata || {}));
    console.log(` - Metadata Value:`, JSON.stringify(t.metadata, null, 2));
    console.log(` - User ID:`, t.user_id);
  });

  // 2. Check current user role
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    console.log(`Current User ID: ${user.id}`);
    console.log(`Current User Role: ${userData?.role}`);
  }

  console.log('--- DIAGNOSTIC END ---');
}

diagnoseMetadata();
