const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching request with join query...");
  const { data, error } = await supabase
    .from('kostmanager_requests')
    .select(`
      *,
      user:user_id (
        name,
        email,
        phone
      )
    `)
    .limit(1);

  if (error) console.error(error);
  else {
    console.log("Request Object keys:", Object.keys(data[0]));
    console.log("user_id value:", data[0].user_id);
    console.log("user join object:", data[0].user);
  }
}

run();
