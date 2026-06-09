const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Fetching last 10 users in public.users...");
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, role')
        .order('created_at', { ascending: false })
        .limit(10);
        
    if (error) {
        console.error(error);
        return;
    }
    
    users.forEach(u => {
        console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, CreatedAt: ${u.created_at}`);
    });
}

inspect();
