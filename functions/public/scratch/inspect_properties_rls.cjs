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

async function inspectRLS() {
  console.log("Checking RLS policies for 'properties' table...");
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'properties';"
  });

  if (error) {
    console.log("exec_sql error, trying direct query on pg_policies...");
    const { data: directData, error: directErr } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'properties');
    console.log("direct query result:", directData, "err:", directErr);
  } else {
    console.log("pg_policies for properties:", JSON.stringify(data, null, 2));
  }

  // Let's also check sample user row
  const { data: users, error: userErr } = await supabase.from('users').select('id, role, email').limit(5);
  console.log("Users sample:", users);
}

inspectRLS();
