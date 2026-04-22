
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findMadani() {
  console.log("Searching for Kost Madani...");
  const { data: props, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('title', '%madani%');

  if (error) console.error(error);
  else console.log(JSON.stringify(props, null, 2));
}

findMadani();
