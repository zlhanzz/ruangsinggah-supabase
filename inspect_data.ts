
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from functions directory
dotenv.config({ path: 'c:\\Users\\ZHULL\\Desktop\\Firebase to Supabase\\functions\\.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for inspection

async function inspectProperties() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('--- INSPECTING PROPERTIES ---');
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, title, owner_uid, status, created_at');
    
  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }
  
  console.log(`Found ${properties.length} properties:`);
  console.table(properties);
  
  console.log('\n--- INSPECTING USERS ---');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, role, is_admin');
    
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  console.log(`Found ${users.length} users:`);
  console.table(users);
}

inspectProperties();
