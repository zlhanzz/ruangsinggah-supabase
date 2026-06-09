const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  try {
    // Check RLS policies on survey_requests
    console.log("Fetching RLS policies for survey_requests...");
    const { data: policies, error: polErr } = await supabase.rpc('get_policies', {}, { head: false });
    // If we can't run rpc get_policies, we can query pg_policies
    const { data: pgPolicies, error: pgErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'survey_requests');
    
    // Let's run a raw query to check if is_admin() function exists
    console.log("\nChecking functions in database...");
    const { data: funcCheck, error: funcErr } = await supabase.rpc('is_admin');
    console.log("is_admin call result:", funcCheck, "Error:", funcErr);

    // Let's query pg_proc to find functions
    const { data: pgProc, error: procErr } = await supabase.rpc('inspect_sql', {
      sql_query: "SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_admin'"
    });
    console.log("pg_proc for 'is_admin':", pgProc, "Error:", procErr);

    // If inspect_sql doesn't exist, let's try reading the users table to see what columns it has
    const { data: users, error: userErr } = await supabase.from('users').select('*').limit(3);
    console.log("\nUsers table sample:", users, "Error:", userErr);

  } catch (e) {
    console.error("Error:", e);
  }
}

checkRLS();
