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

async function findRpcs() {
  // Let's try calling common rpc names or check if any postgres functions exist in schema public
  const rpcsToTest = ['exec_sql', 'inspect_sql', 'execute_sql', 'query', 'run_sql', 'get_policies', 'is_admin'];
  for (const name of rpcsToTest) {
    const { data, error } = await supabase.rpc(name, { sql: 'SELECT 1', query: 'SELECT 1', sql_query: 'SELECT 1' });
    console.log(`RPC ${name}:`, error ? error.message : "EXISTS!", data);
  }
}

findRpcs();
