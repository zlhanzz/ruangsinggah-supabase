const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Simulating Kelola click logic using service role key...");
  
  // 1. Fetch the request object first
  const { data: requests, error: rErr } = await supabase
    .from('kostmanager_requests')
    .select(`
      *,
      user:user_id (
        name,
        email,
        phone
      )
    `)
    .eq('status', 'PENDING_ONBOARDING')
    .limit(1);

  if (rErr || !requests || requests.length === 0) {
    console.error("No pending onboarding requests found:", rErr);
    return;
  }

  const req = requests[0];
  console.log("Simulated Click for Request:", { id: req.id, kost_name: req.kost_name, user_id: req.user_id, property_id: req.property_id });

  let propertyId = req.property_id;
  let propData = null;

  // Step 1:
  if (propertyId) {
    console.log("Step 1: Fetching using propertyId:", propertyId);
    const { data, error } = await supabase
        .from('mitra_kostmanager')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();
    if (error) console.error("Step 1 Error:", error);
    propData = data;
  }

  // Step 2:
  if (!propData && req.user_id) {
    console.log("Step 2: Fetching using user_id:", req.user_id);
    const { data, error } = await supabase
        .from('mitra_kostmanager')
        .select('*')
        .eq('owner_uid', req.user_id)
        .limit(1)
        .maybeSingle();
    if (error) console.error("Step 2 Error:", error);
    propData = data;
    if (propData && propData.property_id) {
        propertyId = propData.property_id;
        console.log("Step 2 found propertyId:", propertyId, "Updating kostmanager_requests...");
        const { error: uErr } = await supabase
            .from('kostmanager_requests')
            .update({ property_id: propertyId })
            .eq('id', req.id);
        if (uErr) {
          console.error("Step 2 Update Error (expected since property_id column is missing):", uErr);
        } else {
          console.log("Step 2 Update Succeeded!");
        }
    }
  }

  // Step 3:
  if (!propData && req.user_id) {
    console.log("Step 3: Fetching from properties using user_id:", req.user_id);
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_uid', req.user_id)
        .eq('is_managed', true)
        .limit(1)
        .maybeSingle();
    if (error) console.error("Step 3 Error:", error);
    propData = data;
  }

  console.log("Final selectedPropertyDetails:", propData ? { id: propData.id, title: propData.title } : null);
}

run();
