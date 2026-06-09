const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    const userId = "ed7ce49c-0e93-4a47-9d53-5c637e7393ee"; 
    const email = "testuser_1781022859551@example.com";
    
    console.log("Cleaning up first...");
    await supabase.from('users').delete().eq('id', userId);
    
    console.log("Attempting direct insert into public.users...");
    
    const { error } = await supabase.from('users').insert([{
        id: userId,
        email: email,
        full_name: "Test User",
        name: "Test User",
        phone: "+628123456789",
        role: "user",
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]);
    
    if (error) {
        console.error("Insert Error:", error);
        return;
    }
    
    console.log("Insert Success! Fetching inserted row...");
    const { data: fetchedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
    if (fetchError) {
        console.error("Fetch Error:", fetchError);
    } else {
        console.log("Fetched User Row:", JSON.stringify(fetchedUser, null, 2));
    }
    
    // Clean up
    console.log("Cleaning up inserted row...");
    await supabase.from('users').delete().eq('id', userId);
}

testInsert();
