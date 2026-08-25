const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: kmProp, error } = await supabase
      .from('mitra_kostmanager')
      .select('*')
      .eq('property_id', '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6')
      .maybeSingle();

    console.log('--- MITRA KOSTMANAGER RECORD ---');
    console.log(JSON.stringify(kmProp, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
