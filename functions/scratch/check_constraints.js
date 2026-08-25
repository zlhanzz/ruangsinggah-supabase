const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const statusesToTest = [
      'PENDING', 
      'AWAITING_ASSIGNMENT', 
      'ASSIGNED', 
      'SURVEYING', 
      'SUBMITTED', 
      'APPROVED', 
      'REJECTED', 
      'COMPLETED',
      'PENDING_ASSIGNMENT',
      'HEADING_TO_LOCATION',
      'ONGOING',
      'WAITING'
    ];
    
    for (const status of statusesToTest) {
      console.log(`Testing status: "${status}"`);
      const kmSurveyPayload = {
        kostmanager_request_id: '3701f42f-53e8-4d71-8cfc-c49c2bff2a42',
        assigned_agent_id: '23ba3fa0-6ea0-43fd-aea7-4290c339e8a5',
        status: status,
        updated_at: new Date().toISOString()
      };
      
      const { data: resData, error: resErr } = await supabase
        .from('kostmanager_surveys')
        .insert([kmSurveyPayload])
        .select();
        
      if (resErr) {
        console.log(`  ❌ Failed: ${resErr.message}`);
      } else {
        console.log(`  ✅ SUCCESS! Inserted with status: "${status}"`);
        // Clean up
        await supabase.from('kostmanager_surveys').delete().eq('id', resData[0].id);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
