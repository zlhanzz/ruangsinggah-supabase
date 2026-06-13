const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    const userId = "4ee89bb2-96f8-467a-8ad2-2005c476c4bf";
    const email = "tipexpesta@gmail.com";
    
    console.log("Attempting direct insert into public.users...");
    
    const { error } = await supabase.from('users').insert([{
        id: userId,
        email: email,
        full_name: "wul",
        name: "wul",
        phone: "+6282347479329",
        role: "user",
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]);
    
    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success!");
    }
}

testInsert();
