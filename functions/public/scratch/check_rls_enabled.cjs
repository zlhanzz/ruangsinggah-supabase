const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSEnabled() {
  const { data, error } = await supabase.rpc('inspect_sql', {
    sql_query: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'"
  });
  
  if (error) {
    // If inspect_sql doesn't exist, try querying a different way or check if pg_tables has info
    console.error("Error checking pg_tables:", error);
    
    // Let's try querying using a custom SQL executor function if any exists in the DB
    const { data: data2, error: error2 } = await supabase.rpc('exec_sql', {
      sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'"
    });
    console.log("exec_sql result:", data2, "Error:", error2);
  } else {
    console.log("pg_tables info:", data);
  }
}

checkRLSEnabled();
