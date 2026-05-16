
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResidents() {
  const userId = "ca842776-be1d-44a6-981c-66f8e7987258"; // ID Sulhan
  console.log(`Checking all resident_status for user ${userId}...`);
  const { data, error } = await supabase
    .from('resident_status')
    .select('*')
    .eq('user_id', userId)
    .order('end_date', { ascending: false });

  if (error) {
    console.error(error);
  } else {
    data.forEach(r => {
      console.log(`ID: ${r.id} | Kost: ${r.kost_id} | End: ${r.end_date} | Status: ${r.status}`);
    });
  }
}
checkResidents();
