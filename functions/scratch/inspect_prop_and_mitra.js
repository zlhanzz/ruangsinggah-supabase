const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    // 1. Check properties
    const { data: props, error: err1 } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_uid', 'c58e7306-d657-420a-9435-91f5fbd1a3a0');
    console.log('Properties count:', props ? props.length : 0);
    console.log('Properties:', JSON.stringify(props, null, 2));

    // 2. Check mitra_kostmanager
    const { data: mitra, error: err2 } = await supabase
      .from('mitra_kostmanager')
      .select('*')
      .eq('owner_uid', 'c58e7306-d657-420a-9435-91f5fbd1a3a0');
    console.log('mitra_kostmanager count:', mitra ? mitra.length : 0);
    console.log('mitra_kostmanager:', JSON.stringify(mitra, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
