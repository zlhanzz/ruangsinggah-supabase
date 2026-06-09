const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

// Load Supabase from functions/public/node_modules
const { createClient } = require('../public/node_modules/@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase.rpc('inspect_tables');
  if (error) {
    // Let's run a raw query to select table names from pg_tables
    const { data: rawData, error: rawError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (rawError) {
      // If we can't query pg_tables directly (since it is not exposed as a table),
      // we can try running an arbitrary query if a custom function is defined,
      // or we can query information_schema or perform other checks.
      console.log("Could not read pg_tables:", rawError.message);
    } else {
      console.log("pg_tables in public:", rawData);
    }
  } else {
    console.log("inspect_tables result:", data);
  }
}

check();
