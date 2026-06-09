const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("Checking public.mitra...");
    const { data: mitra, error: mErr } = await supabase.from('mitra').select('*').limit(1);
    if (mErr) {
        console.error("Mitra error:", mErr);
    } else {
        console.log("Mitra columns:", mitra.length > 0 ? Object.keys(mitra[0]) : "Empty table");
    }

    console.log("Checking public.agents...");
    const { data: agents, error: aErr } = await supabase.from('agents').select('*').limit(1);
    if (aErr) {
        console.error("Agents error:", aErr);
    } else {
        console.log("Agents columns:", agents.length > 0 ? Object.keys(agents[0]) : "Empty table");
    }
}

inspect();
