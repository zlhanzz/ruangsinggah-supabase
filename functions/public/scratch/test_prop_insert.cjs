const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testAnonInsert() {
  // Let's test insert as a normal user to see what RLS fails on!
  // Find a mitra user
  const { data: users } = await supabase.from('users').select('id, role').eq('role', 'mitra').limit(1);
  console.log("Mitra user:", users);

  // Let's check what policies exist on properties by testing insert with service_role vs anon
  const testPayload = {
    owner_uid: users?.[0]?.id || 'ca842776-97ab-48a7-b1cd-6dea17d78c1e',
    mitra_id: users?.[0]?.id || 'ca842776-97ab-48a7-b1cd-6dea17d78c1e',
    title: 'RLS Test Property',
    status: 'draft'
  };

  const res = await supabase.from('properties').insert([testPayload]).select();
  console.log("Service role insert result:", res.error || res.data);
  if (res.data?.[0]?.id) {
    await supabase.from('properties').delete().eq('id', res.data[0].id);
    console.log("Cleaned up test property.");
  }
}

testAnonInsert();
