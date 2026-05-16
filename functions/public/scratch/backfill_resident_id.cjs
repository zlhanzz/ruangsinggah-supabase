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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials (URL or Service Role Key) in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
    console.log("--- STARTING BACKFILL: RESIDENT_STATUS_ID ---");

    // 1. Ambil transaksi yang NULL resident_status_id-nya dan bertipe sewa
    const { data: trxs, error: trxErr } = await supabase
        .from('transactions')
        .select('id, user_id, product_id, product_type, metadata')
        .is('resident_status_id', null)
        .in('product_type', ['rent', 'kost_booking', 'kost', 'perpanjangan_sewa', 'tagihan_ekstra']);

    if (trxErr) {
        console.error("Gagal mengambil transaksi:", trxErr.message);
        return;
    }

    console.log(`Ditemukan ${trxs.length} transaksi dengan resident_status_id NULL.`);

    let fixedCount = 0;

    for (const trx of trxs) {
        console.log(`Memproses Trx: ${trx.id} (User: ${trx.user_id}, Kost: ${trx.product_id})...`);

        // Cari resident_status yang cocok
        const { data: resident, error: resErr } = await supabase
            .from('resident_status')
            .select('id')
            .eq('user_id', trx.user_id)
            .eq('kost_id', trx.product_id)
            .maybeSingle();

        if (resErr) {
            console.error(` - Error mencari resident untuk trx ${trx.id}:`, resErr.message);
            continue;
        }

        if (resident) {
            console.log(` - Ditemukan Resident ID: ${resident.id}. Mengupdate...`);
            
            // Update transaksi ini dan semua saudaranya (split bill)
            const parentId = trx.metadata?.parent_order_id || trx.id;
            const { error: updateErr } = await supabase
                .from('transactions')
                .update({ resident_status_id: resident.id })
                .or(`id.eq.${parentId},metadata->>parent_order_id.eq.${parentId}`);

            if (updateErr) {
                console.error(` - Gagal update trx ${trx.id}:`, updateErr.message);
            } else {
                console.log(` - Sukses update transaksi terkait.`);
                fixedCount++;
            }
        } else {
            console.log(` - Tidak ditemukan record resident_status yang cocok.`);
        }
    }

    console.log(`\n--- BACKFILL SELESAI ---`);
    console.log(`Total transaksi yang berhasil diperbaiki: ${fixedCount}`);
}

backfill();
