
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Searching for fragment: 527080656");
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, phone, email')
        .ilike('phone', '%527080656%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Matches found in Users:", users);

    if (users && users.length > 0) {
        for (const user of users) {
            const { data: props } = await supabase
                .from('properties')
                .select('id, title, owner_uid')
                .eq('owner_uid', user.id);
            console.log(`Properties for ${user.name} (${user.id}):`, props);
        }
    }
}

inspect();
