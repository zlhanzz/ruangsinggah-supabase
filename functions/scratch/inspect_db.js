const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching kostmanager_requests using service role key...");
  const { data: requests, error: rErr } = await supabase
    .from('kostmanager_requests')
    .select('*');
  if (rErr) console.error(rErr);
  else console.log("Requests count:", requests.length, requests);

  console.log("Fetching properties using service role key...");
  const { data: properties, error: pErr } = await supabase
    .from('properties')
    .select('*');
  if (pErr) console.error(pErr);
  else console.log("Properties count:", properties.length, properties.map(p => ({ id: p.id, title: p.title, owner_uid: p.owner_uid, is_managed: p.is_managed, status: p.status })));
}

run();
