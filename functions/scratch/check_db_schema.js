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
    const { data: prop, error: pErr } = await supabase.from('properties').select('*').limit(1);
    console.log('Properties columns:', prop ? Object.keys(prop[0] || {}) : pErr);

    const { data: km, error: kErr } = await supabase.from('mitra_kostmanager').select('*').limit(1);
    console.log('Mitra KostManager columns:', km ? Object.keys(km[0] || {}) : kErr);

    const { data: madaniProp } = await supabase.from('properties').select('id, title, province, city, area, address').ilike('title', '%madani%');
    console.log('Madani in properties:', madaniProp);

    const { data: madaniKm } = await supabase.from('mitra_kostmanager').select('id, title, city, area, address').ilike('title', '%madani%');
    console.log('Madani in mitra_kostmanager:', madaniKm);
}

run();
