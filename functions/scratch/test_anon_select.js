const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSelect() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, photo_url, role, verification_status');
        
    console.log("SELECT ERROR:", error);
    console.log("data length:", data ? data.length : 0);
    console.log("data:", JSON.stringify(data, null, 2));
}

testSelect();
