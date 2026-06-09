const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.SUPABASE_URL || 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

async function check() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceKey}`);
    const schema = await res.json();
    const usersDef = schema.definitions.users;
    if (usersDef && usersDef.properties) {
      console.log("Columns in users table:", Object.keys(usersDef.properties).join(', '));
    } else {
      console.log("Could not find definition for users in OpenAPI schema.");
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}
check();
