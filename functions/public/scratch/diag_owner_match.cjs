const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
    console.log('--- Searching for Properties with "Madani" ---');
    const { data: props } = await supabase.from('properties').select('id, title, owner_uid').ilike('title', '%madani%');
    console.log('Properties:', props);
    
    if (props && props.length > 0) {
        for (const p of props) {
            console.log(`\nChecking Owner UID: ${p.owner_uid} for ${p.title}`);
            const { data: user } = await supabase.from('users').select('id, name, email').eq('id', p.owner_uid).maybeSingle();
            console.log('User found in "users" table:', user);
        }
    }

    console.log('\n--- Checking LATEST 5 Transactions ---');
    const { data: trxs } = await supabase.from('transactions').select('id, product_id, user_id, amount, status, metadata, created_at').order('created_at', { ascending: false }).limit(5);
    console.log('Latest Transactions:', JSON.stringify(trxs, null, 2));
}
check();
