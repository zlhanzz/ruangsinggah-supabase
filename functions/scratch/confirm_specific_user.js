const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function confirmUser() {
    const userId = "4ee89bb2-96f8-467a-8ad2-2005c476c4bf";
    console.log(`Attempting to confirm email for user ID: ${userId} (tipexpesta@gmail.com)...`);
    
    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
    );
    
    if (error) {
        console.error("Confirmation error:", error);
    } else {
        console.log("Confirmation success! User confirmed data:", data);
        
        // Check if the user profile exists in public.users now
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
        if (profileError) {
            console.error("Error fetching profile:", profileError);
        } else if (profile) {
            console.log("Profile successfully created by trigger:", profile);
        } else {
            console.log("Profile not found in public.users table.");
        }
    }
}

confirmUser();
