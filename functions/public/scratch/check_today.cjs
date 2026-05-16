
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkToday() {
  console.log(`Checking transactions created on May 1st 2026...`);
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, product_type, status, metadata, created_at')
    .gte('created_at', '2026-05-01T00:00:00Z')
    .lte('created_at', '2026-05-01T23:59:59Z')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
  } else {
    data.forEach(t => {
      console.log(`ID: ${t.id} | Amt: ${t.amount} | Type: ${t.product_type} | Time: ${t.created_at}`);
      if (t.metadata?.is_batch_split_parent) console.log(`   -> BATCH PARENT`);
      if (t.metadata?.parent_order_id) console.log(`   -> CHILD of ${t.metadata.parent_order_id}`);
    });
  }
}
checkToday();
