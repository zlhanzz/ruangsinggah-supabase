
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Point to the correct node_modules path if needed, but here we assume we run from a place that can see them
// or we use absolute paths for the require if we must.

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNaming() {
    console.log("Starting Retroactive Naming Fix (JS)...");

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, product_type, bill_name, metadata')
        .or('bill_name.ilike.%sewa%kost%,bill_name.is.null');

    if (error) {
        console.error("Error fetching transactions:", error);
        return;
    }

    console.log(`Found ${transactions?.length || 0} transactions to analyze.`);

    for (const trx of transactions || []) {
        let prefix = 'Pembayaran';
        if (trx.product_type === 'kost_booking') {
            prefix = 'Pembayaran Booking';
        } else if (['perpanjangan_sewa', 'rent', 'kost'].includes(trx.product_type)) {
            prefix = 'Perpanjangan Sewa';
        } else if (trx.product_type === 'tagihan_ekstra') {
            prefix = 'Fasilitas';
        } else {
            continue;
        }

        const currentName = trx.bill_name || trx.metadata?.bill_name || 'Sewa Kost';
        let newName = currentName;

        if (currentName.toLowerCase().includes('sewa')) {
            newName = currentName.replace(/sewa\s+kost/i, prefix);
        } else if (!currentName.startsWith(prefix)) {
            newName = `${prefix}: ${currentName}`;
        }

        if (newName !== trx.bill_name) {
            console.log(`Updating Trx ${trx.id}: "${trx.bill_name}" -> "${newName}"`);
            await supabase.from('transactions').update({ 
                bill_name: newName,
                metadata: { ...trx.metadata, bill_name: newName }
            }).eq('id', trx.id);
        }
    }

    console.log("Retroactive Naming Fix Completed.");
}

fixNaming();
