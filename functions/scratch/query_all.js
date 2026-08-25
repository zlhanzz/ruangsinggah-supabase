const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: sr, error: err1 } = await supabase
      .from('survey_requests')
      .select('*')
      .eq('transaction_id', '65b9b8b1-290b-4e29-b5ac-d703e5b88f78');

    console.log('--- SURVEY REQUESTS ---');
    console.log(sr);

    const { data: kms, error: err2 } = await supabase
      .from('kostmanager_surveys')
      .select('*')
      .eq('assigned_agent_id', '23ba3fa0-6ea0-43fd-aea7-4290c339e8a5');

    console.log('--- KOSTMANAGER SURVEYS ---');
    console.log(kms);

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
