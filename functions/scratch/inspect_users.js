const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Fetching last 5 users from auth...");
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Auth error:", authError);
        return;
    }
    
    // Sort users by created_at descending
    const sortedUsers = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    
    for (const u of sortedUsers) {
        console.log(`\nAuth User: ID=${u.id}, Email=${u.email}, ConfirmedAt=${u.email_confirmed_at}, CreatedAt=${u.created_at}`);
        console.log(`User MetaData:`, JSON.stringify(u.user_metadata, null, 2));
        
        const { data: publicUser, error: pubError } = await supabase
            .from('users')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();
            
        if (pubError) {
            console.error(`Error fetching public user ${u.id}:`, pubError);
        } else if (publicUser) {
            console.log(`Public User Profile: Found!`, JSON.stringify(publicUser, null, 2));
        } else {
            console.log(`Public User Profile: NOT FOUND IN public.users TABLE`);
        }
    }
}

inspect();
