
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResident() {
    console.log("Checking resident_status detailed...");
    const { data, error } = await supabase
        .from('resident_status')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(r => {
        console.log(`ID: ${r.id}, User: ${r.user_id}, Kost: ${r.kost_id}, Room: ${r.room_type}, End: ${r.end_date}, LastTrx: ${r.last_transaction_id}`);
    });
}

checkResident();
