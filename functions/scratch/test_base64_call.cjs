const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://sgcmnsnokrztocnhxnqm.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'
);

// Create a small 1x1 base64 sample
const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function run() {
  console.time('base64-invoke');
  const { data, error } = await supabase.functions.invoke('analyze-ktp', {
    body: { 
      base64Image: sampleBase64,
      mimeType: "image/png"
    }
  });
  console.timeEnd('base64-invoke');
  console.log("Result data:", JSON.stringify(data, null, 2));
  console.log("Result error:", error);
}

run();
