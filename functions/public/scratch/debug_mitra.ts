
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMitraData() {
  console.log('--- START DEBUG MITRA DATA ---');
  
  // 1. Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No session found. Please login.');
    return;
  }
  const userId = session.user.id;
  console.log('Current User ID (Mitra):', userId);

  // 2. Get properties
  const { data: props } = await supabase
    .from('properties')
    .select('id, title, owner_uid')
    .eq('owner_uid', userId);
  
  console.log('Properties Owned:', props?.length || 0);
  if (!props || props.length === 0) return;

  const propIds = props.map(p => p.id);
  console.log('Property IDs:', propIds);

  // 3. Get transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .in('product_id', propIds);
  
  if (error) {
    console.error('Error fetching transactions:', error);
  } else {
    console.log('Transactions Found:', transactions?.length || 0);
    if (transactions && transactions.length > 0) {
      console.log('Sample Transaction product_id:', transactions[0].product_id);
      console.log('Sample Transaction metadata keys:', Object.keys(transactions[0].metadata || {}));
      
      // Check user join
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', transactions[0].user_id)
        .single();
      
      if (userError) {
        console.error('Error fetching user for transaction:', userError.message);
      } else {
        console.log('User Found for Transaction:', userData.name);
      }
    }
  }
}

// Note: This script is for logical reference. 
// In a real environment, I would run this through a console or a temporary component.
