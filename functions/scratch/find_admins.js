const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdmins() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', 'admin');
        
    if (error) {
        console.error(error);
    } else {
        console.log("Admin users:", data);
    }
}

findAdmins();
