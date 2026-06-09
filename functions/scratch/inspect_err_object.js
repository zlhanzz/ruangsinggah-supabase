const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testSignupAndInspectError() {
    const email = `testuser_inspect_${Date.now()}@example.com`;
    const password = "TestPassword123!";
    
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
    console.log(`Created user. ID=${userId}`);
    
    // 2. Confirm the email and catch the error
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
    );
    
    if (confirmError) {
        console.log("Confirm error caught. Inspecting properties:");
        const props = Object.getOwnPropertyNames(confirmError);
        for (const prop of props) {
            console.log(`\nProperty: ${prop}`);
            try {
                if (typeof confirmError[prop] === 'object') {
                    console.log(JSON.stringify(confirmError[prop], null, 2));
                } else {
                    console.log(confirmError[prop]);
                }
            } catch (e) {
                console.log("[Error serializing property]");
            }
        }
    } else {
        console.log("Unexpected success!");
    }
    
    // Clean up
    await supabase.auth.admin.deleteUser(userId);
}

testSignupAndInspectError();
