
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Checking Property...");
    const { data, error } = await supabase.from('properties').select('id, title').eq('id', '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6');
    
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
check();
