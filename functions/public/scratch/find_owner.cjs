
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findOwner() {
  const uid = "c58e7306-d657-420a-9435-91f5fbd1a3a0";
  console.log(`Searching for owner ${uid}...`);
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) console.error(error);
  else console.log(JSON.stringify(user, null, 2));
}

findOwner();
