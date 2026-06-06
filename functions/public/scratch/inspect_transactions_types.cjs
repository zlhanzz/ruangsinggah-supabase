const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data: trxs, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return;
    }

    console.log(`=== LATEST 20 TRANSACTIONS ===`);
    for (const t of trxs) {
      console.log(`ID: ${t.id} | ProductId: ${t.product_id} | ProductType: ${t.product_type} | Amount: ${t.amount} | Status: ${t.status}`);
    }
  } catch (err) {
    console.error(err);
  }
}

inspect();
