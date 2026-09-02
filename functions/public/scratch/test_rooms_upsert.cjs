const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const admin = createClient(supabaseUrl, serviceKey);
const userClient = createClient(supabaseUrl, anonKey);

async function testRoomsUpsert() {
  const targetEmail = 'carikostindonesia@gmail.com';
  const propertyId = '93f7437a-7691-41f3-9846-984b33bbfbc2';

  const { data: link } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail
  });

  await userClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink'
  });

  console.log("Logged in as carikostindonesia@gmail.com");

  // Check if userClient can select the property
  const { data: prop, error: pErr } = await userClient
    .from('properties')
    .select('id, owner_uid, title')
    .eq('id', propertyId)
    .single();
  console.log("Can select property:", prop, "Error:", pErr);

  // Check if userClient can select from rooms
  const { data: existingRooms, error: rSelErr } = await userClient
    .from('rooms')
    .select('*')
    .eq('property_id', propertyId);
  console.log("Existing rooms in db:", existingRooms, "Sel err:", rSelErr);

  // Now test upsert rooms
  const roomsPayload = [{
    property_id: propertyId,
    room_number: '01',
    room_type_name: 'Tipe A',
    price_per_month: 1000000,
    status: 'available',
    updated_at: new Date().toISOString()
  }];

  const { data: upData, error: upErr } = await userClient
    .from('rooms')
    .upsert(roomsPayload, { onConflict: 'property_id,room_number' })
    .select();

  console.log("Upsert result:", upData, "Upsert error:", upErr);

  // Let's also test raw insert (not upsert)
  if (upErr) {
    console.log("\nTesting pure insert into rooms...");
    const { data: insData, error: insErr } = await userClient
      .from('rooms')
      .insert(roomsPayload)
      .select();
    console.log("Insert result:", insData, "Insert error:", insErr);
  }
}

testRoomsUpsert();
