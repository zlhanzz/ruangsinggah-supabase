
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing real insert into resident_status...");
  const payload = {
    user_id: 'ca842776-97ab-48a7-b1cd-6dea17d78c1e', 
    kost_id: '767c3e56-75cf-4357-add1-87ec97e9ab7b', 
    room_type: 'Kamar Standard',
    start_date: '2026-05-01',
    end_date: '2026-06-01',
    status: 'ACTIVE'
  };
  
  const { data, error } = await supabase.from('resident_status').insert(payload).select();
  if (error) {
      console.error("INSERT ERROR:", JSON.stringify(error, null, 2));
  } else {
      console.log("INSERT SUCCESS:", data);
  }
}
testInsert();
