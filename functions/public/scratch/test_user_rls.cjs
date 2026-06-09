const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

// Create user client by simulating the user's role and sub claim in a custom token, 
// or simply query the catalog to see how Postgrest behaves.
// Better: We can generate a JWT using the secret key (which is the first part of the service_role key, or we can just use the service role client and mock the auth header).
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'; // Typically the signature key from service role is NOT the JWT secret, but let's check.
// In Supabase, the JWT secret is different. But we can generate a signed JWT with the service role key or use the service role key to inspect pg_policies and RLS.

async function testUserRLS() {
  const userId = 'a29dd46f-7754-4da4-904e-6b90176bc15d';
  
  // We can construct a client that sends the user's claims using the service role token but setting custom claims.
  // Actually, we can test RLS by running a SQL query through rpc or check the exact policy.
  // Wait, let's write a query to see if we can get the list of active policies in PostgreSQL.
  // Let's create a client with a token signed with the JWT secret. What is the JWT secret?
  // Let's check if the service role key can be used to execute a pg query.
  // Wait, we don't have sql rpc, but let's see if we can find any other rpc or inspect the policies.
  
  // Let's print out the exact RLS policies on survey_requests and users.
  // Let's run a query to select pg_policies. We can query pg_policies using the service role client!
  const serviceClient = createClient(supabaseUrl, supabaseKey);
  const { data: policies, error: polError } = await serviceClient
    .from('pg_policies')
    .select('*');
  
  if (polError) {
    console.error("Error fetching pg_policies:", polError);
  } else {
    console.log("=== POLICIES ===");
    policies.forEach(p => {
      if (['survey_requests', 'users', 'transactions'].includes(p.tablename)) {
        console.log(`Table: ${p.tablename} | Name: ${p.policyname} | Qual: ${p.qual} | WithCheck: ${p.with_check}`);
      }
    });
  }
}

testUserRLS();
