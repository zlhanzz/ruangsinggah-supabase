const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Searching for putrikabila09@gmail.com in auth...");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    
    const target = users.find(u => u.email === 'putrikabila09@gmail.com');
    if (target) {
        console.log("Found in auth:", JSON.stringify(target, null, 2));
    } else {
        console.log("Not found in auth.");
    }
}

inspect();
