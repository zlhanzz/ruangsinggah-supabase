const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase.rpc('get_policies_for_properties');
    if (error) {
      // If RPC doesn't exist, let's try reading schema or check some rows.
      console.log('RPC error:', error);
      
      // Let's run a raw query via postgrest if possible, or try checking if we can get anything
      const { data: policies, error: polErr } = await supabase
        .from('pg_policies')
        .select('*')
        .limit(5);
      console.log('pg_policies err:', polErr);
    } else {
      console.log('Policies:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
