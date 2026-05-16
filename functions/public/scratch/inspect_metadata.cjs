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

async function inspectTransactions() {
    console.log("--- INSPECTING LATEST SURVEY TRANSACTIONS METADATA ---");
    const { data: trxs } = await supabase
        .from('transactions')
        .select('id, metadata, product_type, status')
        .eq('product_type', 'survey')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (trxs) {
        trxs.forEach((t, i) => {
            console.log(`\n[${i}] ID: ${t.id} | Status: ${t.status}`);
            console.log("Metadata SurveyId:", t.metadata?.surveyId);
            // console.log("Full Metadata:", JSON.stringify(t.metadata, null, 2));
        });
    }
}

inspectTransactions();
