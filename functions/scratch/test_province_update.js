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
    const { data, error } = await supabase.from('properties').update({ province: 'Sulawesi Selatan' }).eq('id', '897e9fd4-2751-4755-96ec-e2e45e2418ef').select();
    console.log('Update result with province column:', error ? error.message : 'SUCCESS', data);
}

run();
