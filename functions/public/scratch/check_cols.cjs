
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking columns for transactions...");
  const { data: tData, error: tErr } = await supabase.from('transactions').select('*').limit(1);
  if (tErr) console.error("Transactions Error:", tErr);
  else console.log("Transactions Columns:", Object.keys(tData[0] || {}));

  console.log("\nChecking columns for resident_status...");
  const { data: rData, error: rErr } = await supabase.from('resident_status').select('*').limit(1);
  if (rErr) console.error("ResidentStatus Error:", rErr);
  else console.log("ResidentStatus Columns:", Object.keys(rData[0] || {}));
}
check();
