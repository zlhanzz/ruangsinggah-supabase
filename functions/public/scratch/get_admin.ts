
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAdminId() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (error) {
    // If no explicit 'admin' role, check is_admin = true
    const { data: data2, error: error2 } = await supabase
      .from('users')
      .select('id, email')
      .eq('is_admin', true)
      .limit(1)
      .single();
    
    if (error2) {
       console.log("No admin found:", error2.message);
       return;
    }
    console.log("Found admin (is_admin=true):", data2);
    return;
  }
  console.log("Found admin (role=admin):", data);
}

getAdminId();
