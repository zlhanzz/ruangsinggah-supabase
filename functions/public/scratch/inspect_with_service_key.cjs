const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    // 1. Query transactions of type 'survey' using service_role key (bypasses RLS)
    const { data: trxs, error: trxErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('product_type', 'survey')
      .order('created_at', { ascending: false });

    if (trxErr) {
      console.error('Error fetching transactions:', trxErr);
      return;
    }

    console.log(`=== FOUND ${trxs.length} SURVEY TRANSACTIONS (BYPASS RLS) ===`);
    for (const trx of trxs) {
      console.log(`Trx: ${trx.id} | User: ${trx.user_id} | Amount: ${trx.amount} | Status: ${trx.status}`);
      // Find corresponding survey requests
      const { data: srvs, error: srvErr } = await supabase
        .from('survey_requests')
        .select('*')
        .eq('transaction_id', trx.id);
      
      if (srvErr) {
        console.error(`  Error fetching survey requests for trx ${trx.id}:`, srvErr);
      } else {
        console.log(`  Corresponding survey requests: ${srvs.length}`);
        for (const s of srvs) {
          console.log(`    Srv: ${s.id} | Status: ${s.status} | Kost: ${s.kost_name}`);
        }
      }
    }

    // 2. Fetch all survey requests
    const { data: allSrvs, error: allSrvsErr } = await supabase
      .from('survey_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (allSrvsErr) {
      console.error('Error fetching all survey requests:', allSrvsErr);
    } else {
      console.log(`\n=== LATEST 10 SURVEY REQUESTS ===`);
      for (const s of allSrvs) {
        console.log(`Srv: ${s.id} | Trx: ${s.transaction_id} | User: ${s.user_id} | Status: ${s.status} | Kost: ${s.kost_name}`);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

inspect();
