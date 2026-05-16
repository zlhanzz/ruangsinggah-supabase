
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTrx() {
    console.log("Searching for transaction ID...");
    const { data, error } = await supabase
        .from('transactions')
        .select('id, product_type, status');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${data.length} transactions.`);
    data.forEach(t => {
        console.log(`ID: ${t.id}, Type: ${t.product_type}, Status: ${t.status}`);
    });
}

findTrx();
