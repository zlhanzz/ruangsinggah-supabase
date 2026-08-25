const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('survey_requests')
      .select('*')
      .eq('id', 'eb75fc94-5ac0-497b-bce4-aaa114a40a81')
      .single();

    if (error) {
      console.error(error);
    } else {
      console.log('Survey Request full object:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
