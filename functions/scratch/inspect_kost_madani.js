const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying transaction '05f00c66-bc7c-4edf-937d-33bea223a126'...");
  const { data: trxs } = await supabase.from('transactions').select('*').eq('id', '05f00c66-bc7c-4edf-937d-33bea223a126');
  console.log("Transaction:", trxs);

  if (trxs && trxs.length > 0) {
    const ownerUid = trxs[0].user_id;
    console.log("Owner UID:", ownerUid);

    console.log("Querying properties for Owner UID...");
    const { data: props } = await supabase.from('properties').select('*').eq('owner_uid', ownerUid);
    console.log("Properties found for this owner:", props.map(p => ({ id: p.id, title: p.title, is_managed: p.is_managed, status: p.status })));
  }

  console.log("Querying all kostmanager_requests...");
  const { data: kmReqs } = await supabase.from('kostmanager_requests').select('*');
  console.log("kostmanager_requests:", kmReqs);
}

run();
