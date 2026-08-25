const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: request, error: err1 } = await supabase
      .from('kostmanager_requests')
      .select('*, transaction:transaction_id(*)')
      .eq('id', '3701f42f-53e8-4d71-8cfc-c49c2bff2a42')
      .single();

    console.log('--- KOSTMANAGER REQUEST ---');
    console.log(JSON.stringify(request, null, 2));

    let propertyId = request.transaction?.metadata?.propertyId || request.transaction?.metadata?.property_id;
    if (!propertyId) {
      console.log('Property ID not found in metadata, trying to find by owner_uid:', request.user_id);
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_uid', request.user_id);
      console.log('--- PROPERTIES BY OWNER ---');
      console.log(JSON.stringify(props, null, 2));
    } else {
      console.log('Property ID from metadata:', propertyId);
      const { data: prop } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      console.log('--- REFERENCED PROPERTY ---');
      console.log(JSON.stringify(prop, null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
