
const { createClient } = require('@supabase/supabase-client');
const fs = require('fs');
const path = require('path');

// Ambil ENV secara manual untuk menghindari error require
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function investigate() {
    console.log('=== INVESTIGASI DATABASE ===');
    
    // 1. Cari Resident Status ID yang sedang kita lihat
    const { data: residents } = await supabase.from('resident_status').select('id, user_id, end_date').limit(1);
    const resId = residents[0]?.id;
    const userId = residents[0]?.user_id;
    
    console.log(`Resident ID: ${resId}`);
    console.log(`User ID: ${userId}`);
    console.log(`End Date: ${residents[0]?.end_date}`);

    // 2. Ambil SEMUA transaksi milik user ini
    const { data: trxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    console.log('\n--- DAFTAR TRANSAKSI ---');
    trxs.forEach(t => {
        const name = t.metadata?.bill_name || t.metadata?.billName || 'Tanpa Nama';
        console.log(`[${t.status}] ${name} | Rp ${t.amount} | ID: ${t.id} | ResID: ${t.resident_status_id}`);
    });
    
    console.log('\n=== SELESAI ===');
}

investigate();
