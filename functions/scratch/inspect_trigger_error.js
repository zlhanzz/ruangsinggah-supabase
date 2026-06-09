const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrigger() {
  const { data, error } = await supabase.rpc('inspect_sql', {
    sql_query: "SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'"
  });
  
  if (error) {
    console.error("inspect_sql error:", error);
    
    const { data: data2, error: error2 } = await supabase.rpc('exec_sql', {
      sql: "SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'"
    });
    console.log("exec_sql result:", data2, "Error:", error2);
  } else {
    console.log("handle_new_user source in database:");
    console.log(data[0]?.prosrc);
  }
}

checkTrigger();
