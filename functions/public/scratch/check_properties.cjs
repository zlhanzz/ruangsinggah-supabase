const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env.local or env
let envContent = '';
try {
    envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
} catch (e) {
    try {
        envContent = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
    } catch (e2) {
        console.log('No env file found');
    }
}

const env = {};
if (envContent) {
    envContent.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim();
            env[key] = value;
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying properties...');
    const { data, error } = await supabase.from('properties').select('id, title, status, is_verified, is_managed');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total properties:', data ? data.length : 0);
        console.log(data);
    }
}

check();
