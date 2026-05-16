
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetadata() {
  console.log("Checking metadata for transaction with amount 542000...");
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('amount', 542000)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data[0]?.metadata, null, 2));
  }
}
checkMetadata();
