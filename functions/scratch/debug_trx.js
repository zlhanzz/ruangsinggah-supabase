
const { createClient } = require('@supabase/supabase-client');

async function checkTransactions() {
  const supabase = createClient(
    'https://hzxlewhsuqfdfscfjpnz.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  console.log("Checking last transactions...");
  const { data, error } = await supabase
    .from('transactions')
    .select('id, product_type, resident_status_id, metadata')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  data.forEach(trx => {
    console.log(`ID: ${trx.id}`);
    console.log(`Type: ${trx.product_type}`);
    console.log(`Resident ID: ${trx.resident_status_id}`);
    console.log(`Metadata: ${JSON.stringify(trx.metadata)}`);
    console.log('---');
  });
}

checkTransactions();
