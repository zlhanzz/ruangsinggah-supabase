const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('../public/.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProp() {
    const { data: props } = await supabase
        .from('properties')
        .select('id, title, image_urls, metadata')
        .ilike('title', '%madani%');

    if (props && props.length > 0) {
        console.log('image_urls type:', typeof props[0].image_urls);
        console.log('image_urls:', props[0].image_urls);
        console.log('metadata photos:', props[0].metadata?.photos || props[0].metadata?.imageUrls);
    }
}

inspectProp();
