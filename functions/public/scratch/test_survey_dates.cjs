const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM');

const getSurveyWorkDate = (r) => {
    if (r.evaluation_summary?.submitted_at) {
        return new Date(r.evaluation_summary.submitted_at);
    }
    const summary = r.evaluation_summary || {};
    for (const key in summary) {
        if (key.endsWith('_photos') && Array.isArray(summary[key])) {
            for (const url of summary[key]) {
                if (typeof url === 'string') {
                    const match = url.match(/\/(\d+)_[a-zA-Z0-9]+\.webp/);
                    if (match && match[1]) {
                        const epoch = parseInt(match[1]);
                        if (epoch > 1700000000000 && epoch < 2000000000000) {
                            return new Date(epoch);
                        }
                    }
                }
            }
        }
    }
    return new Date(r.created_at);
};

async function run() {
    try {
        const { data, error } = await supabase
            .from('survey_requests')
            .select('id, kost_name, status, created_at, updated_at, evaluation_summary')
            .eq('assigned_agent_id', '23ba3fa0-6ea0-43fd-aea7-4290c339e8a5')
            .eq('status', 'COMPLETED');

        if (error) throw error;
        
        data.forEach(r => {
            const workDate = getSurveyWorkDate(r);
            console.log(`Kost: ${r.kost_name}`);
            console.log(`  Created At: ${r.created_at}`);
            console.log(`  Updated At: ${r.updated_at}`);
            console.log(`  Calculated Work Date: ${workDate.toISOString()} (${workDate.toLocaleDateString('id-ID', { weekday: 'long' })})`);
        });
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
