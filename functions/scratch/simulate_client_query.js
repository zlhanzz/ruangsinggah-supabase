const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
// Using anon key to simulate client-side query behavior
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = 'c58e7306-d657-420a-9435-91f5fbd1a3a0';
  console.log(`Running simulated client-side query for owner_uid: ${userId}...`);
  
  const { data, error } = await supabase
    .from('mitra_kostmanager')
    .select('*')
    .eq('owner_uid', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Result:", data);
  }
}

run();
