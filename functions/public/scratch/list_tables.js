
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc('get_tables'); // I hope this exists
    if (error) {
        console.log("RPC Error:", error);
        // Try fetching from information_schema if possible, but usually not via anon
        const { data: d2, error: e2 } = await supabase.from('users').select('id').limit(1);
        console.log("Users access:", e2 || "Success");
        const { data: d3, error: e3 } = await supabase.from('profiles').select('id').limit(1);
        console.log("Profiles access:", e3 || "Success");
    } else {
        console.log("Tables:", data);
    }
}
check();
