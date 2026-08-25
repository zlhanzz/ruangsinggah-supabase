const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching property '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6'...");
  const { data: prop, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log("Property found:", JSON.stringify(prop, null, 2));
  }
}

run();
