const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking ALL recent PAID transactions...");
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .ilike('status', 'paid')
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching transactions:", error);
    return;
  }

  console.log("Found", data.length, "transactions.");
  data.forEach(trx => {
    console.log(`\n--- Transaction ID: ${trx.id} ---`);
    console.log(`Updated At: ${trx.updated_at}`);
    console.log(`Status: ${trx.status}`);
    console.log(`Product Type: ${trx.product_type}`);
    console.log(`User ID: ${trx.user_id}`);
    console.log(`Kost ID: ${trx.kost_id}`);
    console.log(`Product ID: ${trx.product_id}`);
    console.log(`Metadata:`, JSON.stringify(trx.metadata, null, 2));
  });

  const { data: residents, error: resError } = await supabase
    .from('resident_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);
    
  console.log("\n--- Recent Resident Status Entries ---");
  residents.forEach(res => {
    console.log(`ID: ${res.id}, User: ${res.user_id}, Kost: ${res.kost_id}, Last Trx: ${res.last_transaction_id}, Status: ${res.status}, Updated: ${res.updated_at}`);
  });
}

check();
