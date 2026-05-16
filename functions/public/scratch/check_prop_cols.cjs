
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking properties columns...");
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  if (error) console.error(error);
  else console.log("Property Columns:", Object.keys(data[0] || {}));
}
check();
