const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Checking columns of mitra_kostmanager table...");
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'mitra_kostmanager' });
  if (error) {
    // If rpc not found, do raw query via postgrest on pg_attribute or select columns
    console.log("RPC failed, fetching table info via query...");
    const { data: cols, error: cErr } = await supabase
      .from('mitra_kostmanager')
      .select('*')
      .limit(0);
    if (cErr) console.error("Error fetching table headers:", cErr);
    else console.log("Columns found via empty select:", Object.keys(cols[0] || {}));
  } else {
    console.log("Columns:", data);
  }
}

run();
