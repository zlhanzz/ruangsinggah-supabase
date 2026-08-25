const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching SUBMITTED survey requests...");
  const { data: surveys, error: sErr } = await supabase
    .from('survey_requests')
    .select('*')
    .eq('status', 'SUBMITTED');

  if (sErr) {
    console.error(sErr);
    return;
  }

  for (const s of surveys) {
    console.log(`\nSurvey ID: ${s.id}`);
    console.log(`Transaction ID: ${s.transaction_id}`);
    console.log(`Assigned Agent ID: ${s.assigned_agent_id}`);
    console.log(`Metadata:`, JSON.stringify(s.evaluation_summary || s.metadata || {}));
  }
}

run();
