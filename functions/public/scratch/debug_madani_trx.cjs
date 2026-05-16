const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hzxlewhsuqfuzmvyqfsv.supabase.co', '{{SUPABASE_KEY}}');

async function check() {
    const { data: res, error } = await supabase
        .from('resident_status')
        .select(`
            *,
            transactions!resident_status_id (*)
        `)
        .eq('kost_id', '67F062A8') // From screenshot
        .order('created_at', { foreignTable: 'transactions', ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log('Resident Count:', res.length);
    res.forEach(r => {
        console.log(`Resident ID: ${r.id}, User: ${r.user_id}, Status: ${r.status}`);
        console.log('Transactions:');
        r.transactions.forEach(t => {
            console.log(` - ID: ${t.id}, Status: ${t.status}, Type: ${t.product_type}, Amount: ${t.amount}, Created: ${t.created_at}`);
        });
    });
}

check();
