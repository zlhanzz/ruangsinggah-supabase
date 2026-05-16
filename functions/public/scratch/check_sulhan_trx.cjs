
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
    console.log("Checking transactions for 'Sulhan'...");
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .ilike('metadata->>userName', '%Sulhan%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    if (data.length === 0) {
        console.log("No transactions found for 'Sulhan'.");
        return;
    }

    data.forEach(t => {
        console.log(`ID: ${t.id}, Type: ${t.product_type}, Status: ${t.status}, Created: ${t.created_at}`);
        console.log(`Meta: ${JSON.stringify(t.metadata)}`);
        console.log('---');
    });
}

checkTransactions();
