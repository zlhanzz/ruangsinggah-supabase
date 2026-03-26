
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase.from('transactions').select('id, user_id, status, product_type');
    if (error) {
        console.error(error);
        return;
    }
    console.log('Transactions:', JSON.stringify(data, null, 2));
    
    const { data: users, error: userError } = await supabase.from('users').select('id, name, role');
    if (userError) {
        console.error(userError);
        return;
    }
    console.log('Users:', JSON.stringify(users, null, 2));
}

inspect();
