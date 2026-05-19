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

const transactionId = 'b2636fa4-7634-4ad2-8d0a-0d6f153cb13a';
const userId = 'ca842776-97ab-48a7-b1cd-6dea17d78c1e';

async function testInsert() {
  console.log("Starting test insert into survey_requests...");
  
  const payload = {
    user_id: userId,
    transaction_id: transactionId,
    status: 'PENDING_ASSIGNMENT',
    kost_name: 'Test Kost Name',
    kost_address: 'Test Kost Address',
    owner_phone: '+62812345678',
    survey_date: '2026-05-19',
    survey_time: '11:00',
    notes: 'Test notes',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('survey_requests')
    .insert([payload]);

  if (error) {
    console.error("INSERT ERROR DETAIL:", error);
  } else {
    console.log("INSERT SUCCESSFUL!", data);
  }
}

testInsert();
