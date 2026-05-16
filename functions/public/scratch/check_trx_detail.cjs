
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrx() {
    console.log("Checking transaction fc5b6694...");
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', 'fc5b6694-89c9-4054-8acc-e3ed417c6881')
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log(`ID: ${data.id}, Type: ${data.product_type}, Status: ${data.status}`);
    console.log(`Meta: ${JSON.stringify(data.metadata)}`);
}

checkTrx();
