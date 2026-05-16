const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectResidentStatus() {
    console.log("--- INSPECTING resident_status SCHEMA ---");
    const { data, error } = await supabase.from('resident_status').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching resident_status info:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Available columns in resident_status:");
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log("Table is empty. Checking table existence...");
        const { error: existError } = await supabase.from('resident_status').select('count', { count: 'exact', head: true });
        if (existError) console.error("Table resident_status might NOT exist:", existError);
        else console.log("Table exists but is empty.");
    }
}

inspectResidentStatus();
