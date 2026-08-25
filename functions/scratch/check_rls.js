const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Checking RLS on properties table...");
  const { data, error } = await supabase.rpc('get_policies_for_properties');
  if (error) {
    // If rpc doesn't exist, let's query pg_catalog
    const { data: tables, error: tErr } = await supabase.from('pg_tables').select('*').eq('tablename', 'properties');
    console.log("Tables:", tables, tErr);
  }
}

async function runRaw() {
  // Let's execute raw SQL to get RLS status
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: "select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('properties', 'mitra_kostmanager')" });
  console.log("RLS Status:", data, error);
}

runRaw();
