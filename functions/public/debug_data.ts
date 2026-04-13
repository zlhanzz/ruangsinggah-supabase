import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransactions() {
  console.log('--- DEBUG TRANSACTIONS ---');
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, product_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log('Recent Transactions:', JSON.stringify(data, null, 2));

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, role')
    .limit(5);
  
  console.log('Recent Users:', JSON.stringify(users, null, 2));
}

debugTransactions();
