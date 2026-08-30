const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sgcmnsnokrztocnhxnqm.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'
);

async function run() {
  console.time('edge-invoke');
  const { data, error } = await supabase.functions.invoke('analyze-ktp', {
    body: { 
      text: "NIK: 7312011011040003\nNAMA: SULHAN FAJAR\nTEMPAT/TGL LAHIR: SOPPENG, 10-11-2004\nJENIS KELAMIN: LAKI-LAKI\nALAMAT: JALAN MERDEKA NO 12 RT 01 RW 02\nAGAMA: ISLAM\nSTATUS: BELUM KAWIN\nPEKERJAAN: PELAJAR/MAHASISWA"
    }
  });
  console.timeEnd('edge-invoke');
  console.log("Result data:", JSON.stringify(data, null, 2));
  if (error && error.context) {
    console.log("Error text:", await error.context.text());
  } else {
    console.log("Result error:", error);
  }
}

run();
