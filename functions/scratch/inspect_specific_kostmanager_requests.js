const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: requests, error: err1 } = await supabase
      .from('kostmanager_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (err1) {
      console.error('Error fetching kostmanager_requests:', err1);
    } else {
      console.log('--- KOSTMANAGER REQUESTS ---');
      requests.forEach(r => {
        console.log(`ID: ${r.id}, Kost: ${r.kost_name}, User ID: ${r.user_id}, Status: ${r.status}, Assigned Agent: ${r.assigned_agent_id}, Agent Name: ${r.agent_name}, Transaction: ${r.transaction_id}`);
      });
    }

    const { data: surveys, error: err2 } = await supabase
      .from('kostmanager_surveys')
      .select('*');

    if (err2) {
      console.error('Error fetching kostmanager_surveys:', err2);
    } else {
      console.log('--- KOSTMANAGER SURVEYS ---');
      surveys.forEach(s => {
        console.log(`ID: ${s.id}, Request ID: ${s.kostmanager_request_id}, Assigned Agent: ${s.assigned_agent_id}, Status: ${s.status}`);
      });
    }

    const { data: users, error: err3 } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('role', 'survey_agent');

    if (err3) {
      console.error('Error fetching users:', err3);
    } else {
      console.log('--- REGISTERED AGENTS ---');
      users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
