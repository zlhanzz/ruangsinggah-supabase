const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const admin = createClient(supabaseUrl, serviceKey);
const userClient = createClient(supabaseUrl, anonKey);

async function testEval() {
  const targetEmail = 'carikostindonesia@gmail.com';
  const propertyId = '93f7437a-7691-41f3-9846-984b33bbfbc2';

  const { data: link } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail
  });

  const { data: sessionData } = await userClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink'
  });

  const uid = sessionData.user.id;
  console.log("Logged in user ID:", uid);

  // Test 1: Can user select properties where id = propertyId AND owner_uid = auth.uid()?
  const { data: propCheck, error: propErr } = await userClient
    .from('properties')
    .select('id, owner_uid, status')
    .eq('id', propertyId)
    .eq('owner_uid', uid);

  console.log("Query 'properties' as owner:", propCheck, "Error:", propErr);

  // Test 2: What about with published status vs draft status?
  // Let's temporarily test updating status of property to 'published' via service role, then test rooms insert
  console.log("\nTemporarily updating property status to 'published' via admin...");
  await admin.from('properties').update({ status: 'published' }).eq('id', propertyId);

  const { data: upPubData, error: upPubErr } = await userClient
    .from('rooms')
    .insert([{
      property_id: propertyId,
      room_number: '01-PUB',
      status: 'available'
    }])
    .select();

  console.log("Insert room when property is 'published':", upPubData, "Error:", upPubErr);

  // Revert property status to 'draft'
  await admin.from('properties').update({ status: 'draft' }).eq('id', propertyId);
  if (upPubData?.[0]?.id) {
    await admin.from('rooms').delete().eq('id', upPubData[0].id);
  }
}

testEval();
