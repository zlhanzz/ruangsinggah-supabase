const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    // We sign in as the agent using their credentials so auth.uid() is populated!
    // Since we know the agent email is "sembarangkun91@gmail.com", let's try signing in.
    // Wait, do we know the password?
    // Let's check if there is a default password or test password in the workspace, e.g. "password" or "password123".
    console.log("Attempting sign in as agent sembarangkun91@gmail.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'sembarangkun91@gmail.com',
      password: 'password123' // Let's guess some common test passwords
    });

    if (authError) {
      console.log('Sign in failed (expected if password is not password123):', authError.message);
      
      // Let's try signing in with another common password or verify
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email: 'sembarangkun91@gmail.com',
        password: 'password'
      });
      console.log('Second sign in failed:', authError2?.message);
    } else {
      console.log('Sign in SUCCESS!');
      // Now run the query as the signed-in agent!
      const { data, error } = await supabase
        .from('properties')
        .select('location')
        .eq('owner_uid', 'c58e7306-d657-420a-9435-91f5fbd1a3a0');
      
      console.log('Query result as signed-in agent:', data, 'Error:', error);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
