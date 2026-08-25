const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("=== MITRA KOSTMANAGER DETAILS ===");
    const { data: prop, error } = await supabase
        .from('mitra_kostmanager')
        .select('*')
        .eq('property_id', '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6')
        .maybeSingle();
    
    if (error) {
        console.error(error);
    } else {
        console.log("Found in mitra_kostmanager:");
        console.log("Property ID: 67f062a8-b5a5-4adb-bd40-928e6e8d9ee6");
        console.log("Title:", prop?.title);
        console.log("Location / Coordinates:", prop?.location);
    }
}

inspect();
