
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
  console.log("Checking latest PAID transactions...");
  const { data, error } = await supabase
    .from('transactions')
    .select('id, product_type, status, metadata, resident_status_id, created_at')
    .eq('status', 'PAID')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
  } else {
    data.forEach(trx => {
      console.log(`\n--- Transaction: ${trx.id} ---`);
      console.log(`Type: ${trx.product_type}`);
      console.log(`Created: ${trx.created_at}`);
      console.log(`Resident ID: ${trx.resident_status_id}`);
      console.log(`Sync Log:`, trx.metadata?.sync_resident_status || 'NOT_FOUND');
      console.log(`Sync Reason:`, trx.metadata?.sync_reason || 'N/A');
    });
  }
}
checkLatest();
