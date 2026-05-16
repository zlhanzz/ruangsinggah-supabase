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

async function checkEverything() {
    console.log("--- 20 LATEST TRANSACTIONS (ANY TYPE) ---");
    const { data: trxs } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (trxs) {
        console.table(trxs.map(t => ({
            id: t.id.substring(0,8),
            type: t.product_type,
            amount: t.amount,
            status: t.status,
            prod_id: String(t.product_id).substring(0,8),
            created: t.created_at,
            user: String(t.user_id).substring(0,8)
        })));
    }

    console.log("\n--- 20 LATEST SURVEY REQUESTS ---");
    const { data: surveys } = await supabase
        .from('survey_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (surveys) {
        console.table(surveys.map(s => ({
            id: s.id.substring(0,8),
            kost: s.kost_name,
            status: s.status,
            user: String(s.user_id).substring(0,8),
            trx_id: String(s.transaction_id).substring(0,8),
            created: s.created_at
        })));
    }
}

checkEverything();
