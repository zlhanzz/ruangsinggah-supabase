const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', '23ba3fa0-6ea0-43fd-aea7-4290c339e8a5')
      .single();

    if (error) {
      console.error(error);
    } else {
      console.log('Agent user:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
