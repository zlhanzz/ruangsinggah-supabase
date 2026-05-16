
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooking() {
  console.log("Checking latest kost_booking transactions...");
  const { data, error } = await supabase
    .from('transactions')
    .select('id, product_type, status, metadata, resident_status_id, created_at')
    .eq('product_type', 'kost_booking')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
  } else {
    data.forEach(trx => {
      console.log(`\n--- Booking Transaction: ${trx.id} ---`);
      console.log(`Status: ${trx.status}`);
      console.log(`Created: ${trx.created_at}`);
      console.log(`Metadata Log:`, trx.metadata?.sync_resident_status || 'NOT_FOUND');
    });
  }
}
checkBooking();
