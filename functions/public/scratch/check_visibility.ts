import { supabase } from '../supabase';

async function checkKostMadani() {
    const { data: props, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('title', '%kost madani%');
    
    if (error) {
        console.error('Error fetching properties:', error);
        return;
    }

    console.log('Properties matching "Kost Madani":', props);

    if (props && props.length > 0) {
        const propIds = props.map(p => p.id);
        const { data: trxs, error: trxError } = await supabase
            .from('transactions')
            .select('*')
            .or(`product_id.in.("${propIds.join('","')}"),kost_id.in.("${propIds.join('","')}")`);
        
        if (trxError) {
            console.error('Error fetching transactions:', trxError);
        } else {
            console.log('Transactions for these properties:', trxs);
        }
    }
}

checkKostMadani();
