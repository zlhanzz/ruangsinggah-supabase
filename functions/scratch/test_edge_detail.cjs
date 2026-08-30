const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sgcmnsnokrztocnhxnqm.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'
);

async function run() {
  const { data, error } = await supabase.functions.invoke('analyze-ktp', {
    body: { text: "NIK: 7312011011040003 Nama: SULHAN FAJAR" }
  });
  if (error && error.context) {
    try {
      const errJson = await error.context.json();
      console.log("Error JSON from edge function:", JSON.stringify(errJson, null, 2));
    } catch(e) {
      console.log("Could not parse json from error.context:", e);
    }
  }
}

run();
