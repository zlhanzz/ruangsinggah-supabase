
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("Checking transactions count...");
    const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    if (error) console.error("Transactions error:", error);
    else console.log("Transactions count:", count);

    console.log("Checking resident_status count...");
    const { count: count2, error: error2 } = await supabase
        .from('resident_status')
        .select('*', { count: 'exact', head: true });

    if (error2) console.error("Resident status error:", error2);
    else console.log("Resident status count:", count2);
}

checkTables();
