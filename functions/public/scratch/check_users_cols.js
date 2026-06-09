import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error("Error fetching user:", error);
    } else if (data && data.length > 0) {
        console.log("Keys in users table record:", Object.keys(data[0]));
        console.log("Sample record:", data[0]);
    } else {
        console.log("No records found in users table.");
    }
}
check();
