const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual .env parser
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

// Use service role key if available to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function debugSync(transactionId) {
    console.log(`\n--- DEBUGGING SYNC FOR TRANSACTION: ${transactionId} ---`);
    
    // 1. Fetch Transaction
    const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
    
    if (trxErr) {
        console.error("Error fetching transaction:", trxErr.message);
        return;
    }
    
    console.log("Transaction found:", {
        id: trx.id,
        user_id: trx.user_id,
        product_id: trx.product_id,
        product_type: trx.product_type,
        status: trx.status,
        metadata: trx.metadata
    });

    // 2. Check Resident Status
    const { data: residents, error: resErr } = await supabase
        .from('resident_status')
        .select('*')
        .eq('user_id', trx.user_id);
    
    if (resErr) {
        console.error("Error fetching resident_status:", resErr.message);
    } else {
        console.log(`Found ${residents.length} resident_status records for this user.`);
        residents.forEach(r => {
            console.log(` - ID: ${r.id}, Kost: ${r.kost_id}, Status: ${r.status}, Last Trx: ${r.last_transaction_id}`);
        });
    }

    // 3. Check Property
    const { data: prop, error: propErr } = await supabase
        .from('properties')
        .select('id, title, owner_uid')
        .eq('id', trx.product_id)
        .single();
    
    if (propErr) {
        console.error("Error fetching property:", propErr.message);
    } else {
        console.log("Property found:", prop);
    }
}

// Transaction ID from user's image (approximate) or first PAID transaction found
async function findAndDebug() {
    console.log("Searching for recent kost_booking transactions...");
    const { data: trxs, error } = await supabase
        .from('transactions')
        .select('id, status, product_type, created_at')
        .eq('product_type', 'kost_booking')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error("Error searching transactions:", error.message);
        return;
    }

    if (trxs && trxs.length > 0) {
        console.log(`Found ${trxs.length} recent kost_booking transactions:`);
        trxs.forEach(t => console.log(` - ${t.id} [${t.status}] (${t.created_at})`));
        
        // Debug the first one regardless of status
        await debugSync(trxs[0].id);
    } else {
        console.log("No kost_booking transactions found at all.");
    }
}

findAndDebug();
