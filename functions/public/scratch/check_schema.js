
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Checking resident_status...");
    const { data: rows, error: rowError } = await supabase.from('resident_status').select('*').limit(1);
    if (rowError) {
        console.log("Error Fetch:", rowError);
    } else {
        console.log("Sample Row:", rows[0]);
        if (rows.length === 0) {
             console.log("No rows found. Checking columns via RPC...");
             // You can't usually check columns without data via anon key if RLS is on, 
             // but I'll try to insert a dummy row if I can or just list columns from transactions
        }
    }
}
check();
