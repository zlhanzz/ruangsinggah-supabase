
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDate() {
  const resId = "03d092ac-5d54-4bb9-8bde-a26753e63041";
  console.log(`Fixing date for resident ${resId}...`);
  const { data, error } = await supabase
    .from('resident_status')
    .update({ 
        end_date: '2026-08-04', // Set back to August 4th
        start_date: '2026-05-04',
        metadata: { status_log: 'Manual Fix to Aug 4th' } 
    })
    .eq('id', resId);

  if (error) {
    console.error(error);
  } else {
    console.log("Date fixed successfully to Aug 4th.");
  }
}
fixDate();
