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

async function checkConstraints() {
  console.log("Checking foreign keys on properties...");
  // Let's inspect a property row to see what mitra_id and owner_uid look like
  const { data: props, error: pErr } = await supabase.from('properties').select('id, owner_uid, mitra_id, title').limit(5);
  console.log("Existing properties sample:", props, "err:", pErr);

  // Let's check mitra table
  const { data: mitraList, error: mErr } = await supabase.from('mitra').select('id, user_id, business_name').limit(5);
  console.log("Mitra table sample:", mitraList, "err:", mErr);
}

checkConstraints();
