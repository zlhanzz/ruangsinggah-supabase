const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let envFile = fs.readFileSync(path.join(__dirname, '../public/.env.local'), 'utf-8');

let url = '', anonKey = '';
envFile.split('\n').forEach(l => {
    if (l.startsWith('VITE_SUPABASE_URL=')) url = l.split('=')[1].trim();
    if (l.startsWith('VITE_SUPABASE_ANON_KEY=')) anonKey = l.split('=')[1].trim();
});

const supabase = createClient(url, anonKey);

async function run() {
    const { data: props } = await supabase.from('properties').select('id, title, city, area, metadata, address').limit(10);
    console.log('Props metadata:', JSON.stringify(props, null, 2));

    const { data: surveys } = await supabase.from('survey_requests').select('id, kost_name, status, notes, evaluation_summary, kostmanager_request_id, transaction_id').limit(5);
    console.log('Surveys:', JSON.stringify(surveys, null, 2));
}

run();
