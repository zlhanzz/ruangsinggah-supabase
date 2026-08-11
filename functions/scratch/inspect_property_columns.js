const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('title', 'kost madani')
    .maybeSingle();
  
  if (error) {
    console.error(error);
    return;
  }
  console.log("Kost Madani properties row keys:", Object.keys(data));
  console.log("facilities field:", data.facilities);
}

check();
