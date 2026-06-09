const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Inspecting columns of public.users...");
    
    // We can query postgrest if we call a RPC, but if we don't have SQL RPC,
    // let's see if we can read information_schema via standard supabase select.
    // Wait, PostgREST doesn't expose information_schema by default unless it is in the API schema.
    // Let's try to fetch a row from users and see the keys, or let's try to query another table.
    
    const { data: users, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error("Error reading users:", error);
    } else {
        console.log("Users table columns:", users.length > 0 ? Object.keys(users[0]) : "Empty table");
        if (users.length > 0) {
            console.log("Sample user:", users[0]);
        }
    }
}

inspect();
