const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM');

async function run() {
    try {
        const { data: wdData, error: wdError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (wdError) throw wdError;

        if (wdData && wdData.length > 0) {
            const agentIds = [...new Set(wdData.map(w => w.agent_id).filter(Boolean))];
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, name, email, phone')
                .in('id', agentIds);
            
            if (usersError) throw usersError;

            const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
            const mappedWithdrawals = wdData.map(w => ({
                ...w,
                agent: userMap.get(w.agent_id) || undefined
            }));

            console.log("Success! Mapped withdrawals:", JSON.stringify(mappedWithdrawals, null, 2));
        } else {
            console.log("No withdrawals found.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
