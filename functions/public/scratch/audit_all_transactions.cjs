
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllLatest() {
  console.log("Checking ALL latest transactions (including status & payment meta)...");
  const { data, error } = await supabase
    .from('transactions')
    .select('id, product_type, status, payment_method, pakasir_order_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.table(data.map(trx => ({
      ID: trx.id.split('-')[0],
      Type: trx.product_type,
      Status: trx.status,
      Method: trx.payment_method || 'NULL',
      MidtransID: trx.pakasir_order_id || 'NULL',
      Created: trx.created_at
    })));
  }
}
checkAllLatest();
