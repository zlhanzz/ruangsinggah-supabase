const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hzxlewhsuqfuzmvyqfsv.supabase.co', '{{SUPABASE_KEY}}');

async function check() {
    const { data: res, error } = await supabase
        .from('resident_status')
        .select('*')
        .eq('kost_id', '67F062A8')
        .eq('status', 'active');

    if (error) {
        console.error(error);
        return;
    }

    console.log('Active Resident Status:');
    res.forEach(r => {
        console.log(`ID: ${r.id}, EndDate: ${r.end_date}, Original: ${r.metadata?.lastEndDate}`);
    });
}

check();
