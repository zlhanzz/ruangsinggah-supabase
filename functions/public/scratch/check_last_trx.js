const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', process.env.SUPABASE_KEY || '');

async function check() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', '591d90b9-6a6a-41d3-963d-c8926352d94f')
        .single();
    
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
