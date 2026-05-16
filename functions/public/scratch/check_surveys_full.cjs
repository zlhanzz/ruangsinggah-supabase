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

async function check() {
  console.log("Checking transactions for survey...");
  const { data: trx, error: err1 } = await supabase.from('transactions').select('*').eq('product_type', 'survey').order('created_at', { ascending: false }).limit(5);
  if (err1) console.error(err1);
  else console.log("Transactions:", JSON.stringify(trx, null, 2));

  console.log("\nChecking survey_requests...");
  const { data: srv, error: err2 } = await supabase.from('survey_requests').select('*').order('created_at', { ascending: false }).limit(5);
  if (err2) console.error(err2);
  else console.log("Surveys:", JSON.stringify(srv, null, 2));
}
check();
