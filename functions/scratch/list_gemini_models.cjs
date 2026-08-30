const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sgcmnsnokrztocnhxnqm.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'
);

// We can invoke an edge function or check if we can test models
async function listModels() {
  console.log("Checking available models...");
}
listModels();
