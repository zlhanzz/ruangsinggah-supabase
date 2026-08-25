const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'properties'"
    });

    if (error) {
      console.log('exec_sql error:', error);
    } else {
      console.log('Policies for properties table:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
