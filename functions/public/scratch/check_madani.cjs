
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMadani() {
    console.log("Checking transactions and resident status for 'kost madani'...");
    
    // Find property ID
    const { data: props } = await supabase.from('properties').select('id, name').ilike('name', '%madani%');
    console.log("Properties found:", props);

    if (props && props.length > 0) {
        const propId = props[0].id;
        
        // Find residents
        const { data: residents } = await supabase.from('resident_status').select('*').eq('kost_id', propId);
        console.log("Residents found:", residents);

        // Find ALL pending transactions for this kost
        const { data: trx } = await supabase.from('transactions').select('*').eq('product_id', propId).neq('status', 'PAID');
        console.log("Non-paid Transactions found:", trx);
    }
}

checkMadani();
