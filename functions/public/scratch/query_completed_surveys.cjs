const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM');

async function run() {
    try {
        const { data, error } = await supabase
            .from('survey_requests')
            .select('id, kost_name, status, created_at, updated_at')
            .eq('assigned_agent_id', '23ba3fa0-6ea0-43fd-aea7-4290c339e8a5')
            .eq('status', 'COMPLETED');

        if (error) throw error;
        console.log("Completed Survey Requests:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
