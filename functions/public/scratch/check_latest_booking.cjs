const { createClient } = require('../node_modules/@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM');

async function main() {
  const { data: res } = await supabase.from('resident_status').select('*').order('created_at', { ascending: false }).limit(3);
  console.log('LATEST RESIDENTS:', JSON.stringify(res, null, 2));

  const { data: trxs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(3);
  console.log('LATEST TRANSACTIONS:', JSON.stringify(trxs, null, 2));
}

main();
