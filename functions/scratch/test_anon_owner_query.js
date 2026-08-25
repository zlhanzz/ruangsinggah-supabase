const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, owner_uid, location')
      .eq('owner_uid', 'c58e7306-d657-420a-9435-91f5fbd1a3a0');

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Query using anon key results:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
