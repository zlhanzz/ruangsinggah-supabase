const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('survey_requests')
      .select(`
        id,
        kost_name,
        kost_address,
        notes,
        status,
        transaction_id,
        transaction:transaction_id (
          id,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching surveys:', error);
    } else {
      console.log('Last 10 survey requests details:');
      data.forEach((req, idx) => {
        console.log(`\n--- Request #${idx + 1} (${req.id}) ---`);
        console.log(`Kost Name:    `, req.kost_name);
        console.log(`Address:      `, req.kost_address);
        console.log(`Notes:        `, JSON.stringify(req.notes));
        console.log(`Status:       `, req.status);
        console.log(`Trx ID:       `, req.transaction_id);
        console.log(`Trx Meta:     `, JSON.stringify(req.transaction?.metadata || null, null, 2));
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
