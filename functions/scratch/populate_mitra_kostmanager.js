const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const propertyId = '67f062a8-b5a5-4adb-bd40-928e6e8d9ee6';
  
  console.log("Fetching property details...");
  const { data: prop, error: pErr } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (pErr || !prop) {
    console.error("Property not found:", pErr);
    return;
  }

  const kmPropertyPayload = {
    property_id: prop.id,
    owner_uid: prop.owner_uid,
    title: prop.title,
    description: prop.description || '',
    price: prop.price,
    facilities: prop.facilities || [],
    address: prop.address || '',
    city: prop.city || '',
    area: prop.area || '',
    location: prop.location || {},
    rules: prop.rules || [],
    campuses: prop.campuses || [],
    image_urls: prop.image_urls || [],
    room_types: prop.room_types || []
  };

  console.log("Inserting/updating into mitra_kostmanager without 'metadata' column...");
  const { data: existingKM } = await supabase
    .from('mitra_kostmanager')
    .select('id')
    .eq('property_id', prop.id)
    .maybeSingle();

  if (existingKM) {
    const { error } = await supabase
      .from('mitra_kostmanager')
      .update(kmPropertyPayload)
      .eq('property_id', prop.id);
    if (error) console.error("Error updating:", error);
    else console.log("Successfully updated existing mitra_kostmanager row!");
  } else {
    const { error } = await supabase
      .from('mitra_kostmanager')
      .insert([kmPropertyPayload]);
    if (error) console.error("Error inserting:", error);
    else console.log("Successfully inserted new mitra_kostmanager row!");
  }
}

run();
