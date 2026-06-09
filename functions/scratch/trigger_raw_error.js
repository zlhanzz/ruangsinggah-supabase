const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

// Initialize client pointing to 'auth' schema
const supabaseAuthSchema = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'auth' }
});

async function triggerError() {
    const email = `testuser_${Date.now()}@example.com`;
    const password = "TestPassword123!";
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Creating user via admin auth...");
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
            full_name: "Test Trigger User",
            name: "Test Trigger User",
            phone: "+628123456780",
            role: "user"
        }
    });
    
    if (createError) {
        console.error("Create error:", createError);
        return;
    }
    
    const userId = userData.user.id;
    console.log("User created in auth. ID:", userId);
    
    console.log("Attempting direct update on auth.users table to trigger handle_new_user()...");
    
    // We update email_confirmed_at directly on the auth.users table
    const { data, error } = await supabaseAuthSchema
        .from('users')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('id', userId)
        .select();
        
    if (error) {
        console.error("Direct UPDATE Error (This is the database error!):");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("Direct UPDATE Success! No trigger error?", data);
    }
    
    console.log("Cleaning up...");
    await supabaseAdmin.auth.admin.deleteUser(userId);
}

triggerError();
