const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
    console.log('--- Checking ALL Pending Bookings ---');
    // Since I can't see them via ANON key due to RLS, I'll try to check if I can see ANY.
    const { data: trxs, error: errTrx } = await supabase.from('transactions').select('*').limit(10);
    console.log('Sample Transactions (Visible to Anon):', trxs?.length || 0);
    
    console.log('\n--- Checking Properties and their Owners ---');
    const { data: props, error: errProps } = await supabase.from('properties').select('id, title, owner_uid, status');
    console.log('Properties count:', props?.length || 0);
    if (props) {
        props.forEach(p => {
            console.log(`- Property: "${p.title}" | ID: ${p.id} | Owner: ${p.owner_uid} | Status: ${p.status}`);
        });
    }

    console.log('\n--- Checking Users (Maybe I can see some?) ---');
    const { data: users } = await supabase.from('users').select('id, name, email').limit(10);
    console.log('Users visible:', users?.length || 0);
}
check();
