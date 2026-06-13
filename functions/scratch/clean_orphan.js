const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanOrphan() {
    const orphanedId = "3ce56ea1-94db-4f05-9559-7d7f9b1ad491";
    console.log(`Deleting orphaned user ${orphanedId} from public.users...`);
    
    const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', orphanedId);
        
    if (error) {
        console.error("Delete error:", error);
    } else {
        console.log("Delete success! Orphaned user profile removed.");
    }
}

cleanOrphan();
