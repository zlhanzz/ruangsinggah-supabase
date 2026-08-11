const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    const { data: trx, error: errTrx } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', 'e5b905f0-90bf-4044-a80c-f576b12c9530')
        .maybeSingle();

    console.log("Transaction:", trx);
    console.log("Error:", errTrx);
}

inspect();
