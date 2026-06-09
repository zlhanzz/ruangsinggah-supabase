const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const userClient = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = 'carikostindonesia@gmail.com';
  const userId = 'a29dd46f-7754-4da4-904e-6b90176bc15d';
  const tempPassword = 'TempPassword123!';

  try {
    console.log(`Updating password for ${email} to run tests...`);
    const { data: userUpdate, error: updateErr } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateErr) {
      console.error("Failed to update password:", updateErr);
      return;
    }
    console.log("Password updated successfully.");

    console.log("Signing in as user...");
    const { data: sessionData, error: signInErr } = await userClient.auth.signInWithPassword({
      email,
      password: tempPassword
    });

    if (signInErr) {
      console.error("Sign in failed:", signInErr);
      return;
    }
    console.log("Sign in successful. Access Token exists:", !!sessionData.session.access_token);

    // Query 1: survey_requests directly
    console.log("\n--- Querying survey_requests directly as user ---");
    const { data: directData, error: directErr } = await userClient
      .from('survey_requests')
      .select('*');
    console.log("Direct query result:", directData, "Error:", directErr);

    // Query 2: survey_requests with agent join
    console.log("\n--- Querying survey_requests with agent join as user ---");
    const { data: joinData, error: joinErr } = await userClient
      .from('survey_requests')
      .select(`
        *,
        agent:assigned_agent_id (
          name,
          phone,
          photo_url
        )
      `);
    console.log("Join query result:", joinData, "Error:", joinErr);

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

test();
