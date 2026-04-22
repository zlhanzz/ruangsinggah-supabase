const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
    console.log('--- Searching for Transactions with "Tantri" ---');
    const { data: trxs } = await supabase.from('transactions').select('*').limit(50);
    const tantriTrx = trxs.find(t => JSON.stringify(t.metadata).includes('Tantri'));
    
    if (tantriTrx) {
        console.log('Found Tantri Transaction:', tantriTrx);
    } else {
        console.log('Tantri not found in latest 50 txs. Searching by metadata ilike...');
        const { data: trxs2 } = await supabase.from('transactions').select('*').filter('metadata->>tenantName', 'ilike', '%tantri%');
        const { data: trxs3 } = await supabase.from('transactions').select('*').filter('metadata->>kostName', 'ilike', '%madani%');
        console.log('By tenant name:', trxs2?.length);
        console.log('By kost name:', trxs3?.length);
        if (trxs3 && trxs3.length > 0) console.log('Madani Trx:', trxs3[0]);
    }
}
check();
