
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: 'functions/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- CHECKING RECENT TRANSACTIONS ---');
    const { data: trxs, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    trxs.forEach(t => {
        console.log(`ID: ${t.id} | Name: ${t.metadata?.bill_name || t.metadata?.billName} | Status: ${t.status} | ResID: ${t.resident_status_id} | Created: ${t.created_at}`);
        console.log(`Metadata: ${JSON.stringify(t.metadata)}`);
        console.log('---');
    });
}

check();
