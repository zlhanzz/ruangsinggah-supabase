const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Extract config from supabase.ts if possible, or just parse the file
const supabaseFile = fs.readFileSync('./supabase.ts', 'utf8');
const urlMatch = supabaseFile.match(/const supabaseUrl = ['"](.*)['"]/);
const keyMatch = supabaseFile.match(/const supabaseAnonKey = ['"](.*)['"]/);

if (!urlMatch || !keyMatch) {
  console.error('Could not find Supabase credentials');
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function debug() {
  console.log('--- DEBUGGING KOST MADANI ---');
  const { data: props, error: pErr } = await supabase
    .from('properties')
    .select('id, title, owner_uid, users(id, name, full_name, role)')
    .ilike('title', '%Madani%')
    .limit(1);

  if (pErr) console.error('Property Error:', pErr);
  else console.log('Property Data:', JSON.stringify(props, null, 2));

  console.log('--- DEBUGGING ABDULLAH USER ---');
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%abdullah%')
    .limit(1);

  if (uErr) console.error('User Error:', uErr);
  else console.log('User Data:', JSON.stringify(users, null, 2));
}

debug();
