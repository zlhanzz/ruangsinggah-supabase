const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const adminClient = createClient(supabaseUrl, serviceKey);

async function simulate() {
  const targetEmail = 'andiafzalasir@gmail.com';
  console.log("Generating link for:", targetEmail);
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail
  });

  if (linkErr) {
    console.error("Link error:", linkErr);
    return;
  }

  const tokenHash = linkData.properties?.hashed_token;
  const userClient = createClient(supabaseUrl, anonKey);
  
  const { data: sessionData, error: otpErr } = await userClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink'
  });

  if (otpErr) {
    console.error("OTP error:", otpErr);
    return;
  }

  console.log("Logged in successfully as user:", sessionData.user.id, sessionData.user.email);

  // Now test INSERT using this authenticated user client!
  const testPayload = {
    owner_uid: sessionData.user.id,
    mitra_id: sessionData.user.id,
    title: 'Simulated Mitra Kost',
    description: 'Test Description',
    price: 1500000,
    facilities: ['WiFi', 'Dapur Bersama'],
    address: 'Jl. Test No. 123',
    city: 'Makassar',
    area: 'Tamalanrea',
    metadata: {
      province: 'Sulawesi Selatan',
      photos_meta: []
    },
    type: 'Campur',
    property_type: 'Campur',
    status: 'published',
    is_verified: false,
    is_managed: false,
    rating: 0,
    location: { lat: -5.14, lng: 119.41 },
    image_urls: [],
    video_urls: [],
    instagram_url: '',
    tiktok_url: '',
    room_types: [],
    reviews: [],
    rules: [],
    campuses: [],
    public_facilities: [],
    virtual_tour_url: '',
    additional_fee_price: null,
    additional_fee_name: '',
    additional_fee_starts_from: 'month_1',
    omnichannel_contact_name: 'Pak Owner',
    omnichannel_contact_phone: '08123456789',
    omnichannel_contact_type: 'owner'
  };

  const { data: insData, error: insErr } = await userClient
    .from('properties')
    .insert([testPayload])
    .select('id')
    .single();

  console.log("INSERT RESULT:", insData, "ERROR:", insErr);

  if (insErr) {
    // Let's test with status: 'draft'
    console.log("\nTesting with status: 'draft'...");
    const { data: dData, error: dErr } = await userClient
      .from('properties')
      .insert([{ ...testPayload, status: 'draft' }])
      .select('id')
      .single();
    console.log("Draft insert result:", dData, "ERROR:", dErr);

    // Let's test without mitra_id
    console.log("\nTesting without mitra_id...");
    const { mitra_id, ...noMitraPayload } = testPayload;
    const { data: nmData, error: nmErr } = await userClient
      .from('properties')
      .insert([{ ...noMitraPayload, status: 'draft' }])
      .select('id')
      .single();
    console.log("No mitra_id insert result:", nmData, "ERROR:", nmErr);
  }
}

simulate();
