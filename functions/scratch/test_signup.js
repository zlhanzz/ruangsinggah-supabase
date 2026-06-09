const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

// Use admin/service role to bypass RLS and create/verify user directly
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testSignup() {
    const email = `testuser_${Date.now()}@example.com`;
    const password = "TestPassword123!";
    console.log(`Testing signup for: ${email}`);
    
    // 1. Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
            full_name: "Test User",
            name: "Test User",
            phone: "+628123456789",
            role: "user"
        }
    });
    
    if (signUpError) {
        console.error("Sign up error:", signUpError);
        return;
    }
    
    const userId = signUpData.user.id;
    console.log(`Created user in auth.users. ID=${userId}`);
    
    // 2. Check if the user is in public.users (should NOT be since email_confirm is false)
    const { data: userBeforeConfirm } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
    console.log("Profile before email confirm:", userBeforeConfirm ? "Found!" : "Not found (Correct)");
    
    // 3. Confirm the email using admin.updateUserById (simulates clicking the link)
    console.log("Confirming email...");
    const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
    );
    
    if (confirmError) {
        console.error("Confirm error:", confirmError);
        return;
    }
    
    console.log("Email confirmed successfully in auth.");
    
    // 4. Check if they are now in public.users (the trigger should have run)
    const { data: userAfterConfirm, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
    if (profileError) {
        console.error("Error fetching profile after confirm:", profileError);
    } else if (userAfterConfirm) {
        console.log("Profile after email confirm: Found! (Trigger works)", JSON.stringify(userAfterConfirm, null, 2));
    } else {
        console.log("Profile after email confirm: NOT FOUND! (Trigger failed or didn't run)");
    }
    
    // Clean up
    console.log("Cleaning up test user...");
    await supabase.auth.admin.deleteUser(userId);
}

testSignup();
