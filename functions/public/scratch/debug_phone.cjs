
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos";

// NOTE: Using anon key might not work if table is protected. Trying anyway.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findUser() {
  const search = "6353168"; // suffix
  const testNumber = "15556353168";
  
  console.log(`Searching for suffix: ${search} or full: ${testNumber}`);

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .or(`phone.ilike.%${search}%,whatsapp.ilike.%${search}%`);

  if (userError) console.error("User Error:", userError);
  else console.log("Matched Users:", JSON.stringify(users, null, 2));

  const { data: props, error: propError } = await supabase
    .from('properties')
    .select('id, title, omnichannel_contact_phone')
    .or(`omnichannel_contact_phone.ilike.%${search}%`);

  if (propError) console.error("Prop Error:", propError);
  else console.log("Matched Props:", JSON.stringify(props, null, 2));
}

findUser();
