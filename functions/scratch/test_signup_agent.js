const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testSignupAgent() {
    const email = `testagent_${Date.now()}@example.com`;
    const password = "TestPassword123!";
    console.log(`Testing Agent signup for: ${email}`);
    
    // 1. Sign up the user as 'survey_agent'
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
            full_name: "Test Agent",
            name: "Test Agent",
            phone: "+628123456789",
            role: "survey_agent"
        }
    });
    
    if (signUpError) {
        console.error("Sign up error:", signUpError);
        return;
    }
    
    const userId = signUpData.user.id;
    console.log(`Created user in auth.users. ID=${userId}`);
    
    // 2. Confirm the email
    console.log("Confirming email...");
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
    );
    
    if (confirmError) {
        console.error("Confirm error:", confirmError);
    } else {
        console.log("Email confirmed successfully in auth!");
        
        // Check if they are in public.users and public.agents
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        const { data: agent } = await supabase.from('agents').select('*').eq('user_id', userId).maybeSingle();
        
        console.log("Public user profile:", user ? "Created!" : "Not created!");
        console.log("Agent profile:", agent ? "Created!" : "Not created!");
    }
    
    // Clean up
    console.log("Cleaning up test user...");
    await supabase.auth.admin.deleteUser(userId);
}

testSignupAgent();
