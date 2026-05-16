
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Checking Transaction...");
    const { data, error } = await supabase.from('transactions').select('*').eq('id', 'fc5b6694-89c9-4054-8acc-e3ed417c6881');
    
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
check();
