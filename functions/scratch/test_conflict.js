const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConflict() {
    const userId = "ed7ce49c-0e93-4a47-9d53-5c637e7393ee"; // Test UUID
    const email = "testuser_conflict@example.com";
    
    console.log("1. Cleaning up any existing test user...");
    await supabase.from('users').delete().eq('id', userId);
    
    console.log("2. Inserting first time...");
    const { error: insertError } = await supabase.from('users').insert([{
        id: userId,
        email: email,
        full_name: "Test User 1",
        name: "Test User 1",
        phone: "+628123456789",
        role: "user",
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]);
    
    if (insertError) {
        console.error("First insert failed:", insertError);
        return;
    }
    
    console.log("3. Inserting second time (triggering conflict)...");
    // Since we cannot run raw SQL INSERT ON CONFLICT directly via Supabase API (upsert does it, but we want to test the exact PostgREST conflict behavior)
    // Actually, Supabase's .upsert() uses ON CONFLICT (id) DO UPDATE.
    // Let's test if .upsert() works:
    const { data: upsertData, error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        email: email,
        full_name: "Test User 2",
        name: "Test User 2",
        phone: "+628123456789",
        role: "user",
        is_admin: false,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (upsertError) {
        console.error("Upsert failed:", upsertError);
    } else {
        console.log("Upsert succeeded:", upsertData);
    }
    
    console.log("4. Cleaning up...");
    await supabase.from('users').delete().eq('id', userId);
}

testConflict();
