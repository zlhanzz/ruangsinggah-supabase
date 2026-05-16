
const { createClient } = require('@supabase/supabase-client');

async function checkTransactions() {
  const supabase = createClient(
    'https://hzxlewhsuqfdfscfjpnz.supabase.co',
    'PASTE_SERVICE_ROLE_KEY_HERE_IF_NEEDED' // I will use environment variable if possible
  );

  // ... (rest of the script)
}
