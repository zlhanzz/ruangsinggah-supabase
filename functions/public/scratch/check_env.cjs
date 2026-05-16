const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM');

async function check() {
  console.log("ENV CHECK START");
  console.log("MIDTRANS_SERVER_KEY:", process.env.MIDTRANS_SERVER_KEY);
  console.log("MIDTRANS_CLIENT_KEY:", process.env.MIDTRANS_CLIENT_KEY);
}
check();
