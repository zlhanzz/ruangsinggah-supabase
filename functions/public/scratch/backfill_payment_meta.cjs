
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual .env parser
const envPaths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../../.env')
];

envPaths.forEach(envPath => {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillPaymentMeta() {
    console.log("--- STARTING BACKFILL: PAYMENT_METHOD & PAKASIR_ORDER_ID ---");

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, status, payment_method, pakasir_order_id, metadata')
        .eq('status', 'PAID')
        .or('payment_method.is.null,pakasir_order_id.is.null');

    if (error) {
        console.error("Error fetching transactions:", error);
        return;
    }

    console.log(`Ditemukan ${transactions.length} transaksi PAID dengan metadata NULL.`);

    for (const trx of transactions) {
        console.log(`Memproses Trx: ${trx.id}...`);
        
        // Coba cari data dari metadata jika ada (fallback)
        const method = trx.payment_method || trx.metadata?.payment_type || 'MANUAL_OR_LEGACY';
        const midtransId = trx.pakasir_order_id || trx.metadata?.transaction_id || `REF-${trx.id.split('-')[0].toUpperCase()}`;

        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                payment_method: method,
                pakasir_order_id: midtransId,
                metadata: { 
                    ...trx.metadata, 
                    backfilled_at: new Date().toISOString(),
                    backfill_note: 'Restored missing payment metadata'
                }
            })
            .eq('id', trx.id);

        if (updateError) {
            console.error(` - Gagal update Trx ${trx.id}:`, updateError.message);
        } else {
            console.log(` - BERHASIL: Method=${method}, ID=${midtransId}`);
        }
    }

    console.log("\n--- BACKFILL SELESAI ---");
}

backfillPaymentMeta();
