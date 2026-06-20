const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sgcmnsnokrztocnhxnqm.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM'
);

async function run() {
  console.log("Calling Edge Function analyze-ktp...");
  const text = `
    NIK : 7312011011040003
    Nama : SULHAN FAJAR
    Tempat/Tgl Lahir : BUNNE, 10-11-2004
    Jenis Kelamin : LAKI-LAKI
    Gol. Darah : -
    Alamat : BUNNE
    RT/RW : 001/002
    Kel/Desa : GOARIE
    Kecamatan : MARIORIWAWO
    Agama : ISLAM
    Status Perkawinan : BELUM KAWIN
    Pekerjaan : PELAJAR/MAHASISWA
    Kewarganegaraan : WNI
    Berlaku Hingga : SEUMUR HIDUP
  `;

  try {
    const { data, error } = await supabase.functions.invoke('analyze-ktp', {
      body: { text }
    });

    if (error) {
      console.error("Supabase function error:", error);
    } else {
      console.log("Response data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fatal error invoking function:", err.message);
  }
}

run();
