
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findSulhan() {
    console.log("Finding user 'Sulhan'...");
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .ilike('name', '%Sulhan%');

    if (error) {
        console.error(error);
        return;
    }

    if (data.length === 0) {
        console.log("No user found for 'Sulhan'.");
        return;
    }

    data.forEach(u => {
        console.log(`User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
    });
}

findSulhan();
