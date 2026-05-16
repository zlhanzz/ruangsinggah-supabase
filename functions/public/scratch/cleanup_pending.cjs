const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hzxlewhsuqfuzmvyqfsv.supabase.co', '{{SUPABASE_KEY}}');

async function clean() {
    const userId = '{{USER_ID}}'; // I should get the real user ID
    // Find the pending transaction first to be sure
    const { data: trx } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .eq('product_type', 'tagihan_ekstra')
        .limit(5);

    console.log('Found pending transactions:', trx?.length || 0);
    
    if (trx && trx.length > 0) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .in('id', trx.map(t => t.id));
        
        if (error) console.error('Delete error:', error);
        else console.log('Successfully cleaned up pending transactions.');
    }
}

clean();
