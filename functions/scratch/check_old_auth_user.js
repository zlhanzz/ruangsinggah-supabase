const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAuthUser() {
    const userId = "3ce56ea1-94db-4f05-9559-7d7f9b1ad491";
    console.log(`Checking if user ID ${userId} exists in auth.users...`);
    
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
        console.error("Auth error fetching user:", error.message);
    } else {
        console.log("Auth user found:", data.user ? "Yes" : "No");
    }
}

checkAuthUser();
