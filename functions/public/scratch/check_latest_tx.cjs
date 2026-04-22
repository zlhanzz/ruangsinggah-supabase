const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
    console.log('--- Checking Recent Transactions ---');
    // I can't use order/limit easily if RLS is on, but let's try.
    const { data: trxs, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(3);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Recent Transactions:', trxs);
    }
}
check();
