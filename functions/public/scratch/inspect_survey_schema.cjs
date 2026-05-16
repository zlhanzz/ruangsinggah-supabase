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

async function inspectSchema() {
    console.log("--- INSPECTING survey_requests SCHEMA ---");
    // We try to fetch one record to see the keys
    const { data, error } = await supabase.from('survey_requests').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching schema info:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Available columns in survey_requests:");
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log("Table is empty. Cannot determine columns via select.");
    }
}

inspectSchema();
