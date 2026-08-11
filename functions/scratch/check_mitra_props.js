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

async function check() {
    // 1. Get user 'abdullah' or mitrakost@ruangsinggah.id
    const { data: users } = await supabase
        .from('users')
        .select('id, email, name, role')
        .ilike('email', '%mitrakost%');
    console.log("Users:", users);

    if (users && users.length > 0) {
        const userId = users[0].id;
        // 2. Get properties for this user
        const { data: props } = await supabase
            .from('properties')
            .select('id, title, owner_uid, is_managed, status')
            .eq('owner_uid', userId);
        console.log("Properties for user:", props);
    }
}

check();
