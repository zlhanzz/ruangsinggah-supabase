import { supabase } from './lib/supabase';

async function checkJoin() {
  const { data, error } = await supabase
    .from('survey_requests')
    .select('*, agent:assigned_agent_id(name, phone, photo_url)')
    .limit(1);
  
  if (error) {
    console.error('Join Error:', error);
  } else {
    console.log('Join Data:', data);
  }
}

checkJoin();
