import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error("Missing text parameter");
    }

    const GEMINI_KEYS_RAW = Deno.env.get('GEMINI_API_KEY') || "";
    const GEMINI_KEYS = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k);
    const GEMINI_API_KEY = GEMINI_KEYS[0] || "";

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const prompt = `
Anda adalah AI pengekstrak data KTP khusus untuk RuangSinggah.id.
Tugas Anda adalah membaca hasil pemindaian OCR KTP (yang mungkin kotor, typo, atau berantakan) dan mengekstrak informasi terstruktur ke dalam format JSON yang bersih.

DATA KTP HASIL OCR:
"""
${text}
"""

ATURAN PENTING & KETAT:
1. ABAIKAN NOISE LATAR BELAKANG: Foto KTP mungkin diambil di atas laptop. JANGAN PERNAH mengekstrak teks stiker laptop (seperti "AMD", "RADEON", "Intel", "Ryzen", "GeForce") atau tombol keyboard (seperti "Caps Lock", "Shift", "Ctrl", "Alt", "Fn", "Space") sebagai bagian dari data KTP (misalnya jangan menjadikannya Nama atau Alamat).
2. JANGAN PERNAH MENYALIN NILAI CONTOH TEMPLATE (seperti "3171234567890001", "NAMA LENGKAP", "JAKARTA", "1995-12-31") jika data tersebut tidak ditemukan atau tidak terbaca dari teks KTP hasil OCR.
3. Jika suatu data (misalnya NIK, Nama, Tanggal Lahir, atau Agama) TIDAK terbaca, kosong, atau tidak ditemukan di DATA KTP HASIL OCR secara valid, isilah nilai kunci tersebut dengan string kosong ("") atau null.
4. KTP yang difoto mungkin memiliki kualitas gambar rendah pada sebagian area (misal sisi kiri buram/silau), sehingga data di area tersebut tidak terbaca. Pastikan Anda hanya mengekstrak data yang memang terdeteksi di teks OCR secara riil.

ATURAN EKSTRAKSI:
1. "nik": Wajib 16 digit angka bersih yang Anda temukan di teks. Perbaiki typo karakter OCR (seperti 'O'->'0', 'I/l'->'1', etc.). Jika tidak ditemukan 16 digit angka valid, set "".
2. "name": Nama lengkap orang tersebut. Bersihkan kata awalan seperti "Nama" atau ":". Jika tidak ditemukan nama valid, set "".
3. "birth_place": Tempat lahir saja (contoh: "SOPPENG", "MAKASSAR"). Perhatikan: Kota di bawah foto KTP adalah kota pembuatan KTP, bukan tempat lahir. Ambil tempat lahir dari baris "Tempat/Tgl Lahir". Jika tidak ditemukan, set "".
4. "birth_date": Tanggal lahir dalam format standar HTML date: "YYYY-MM-DD" (contoh: "2004-11-10"). Konversikan format angka "DD-MM-YYYY" atau nama bulan menjadi format standar tersebut. Jika tidak ditemukan tanggal lahir valid, set "".
5. "gender": Jenis kelamin. Wajib bernilai "Pria", "Wanita", atau "".
6. "religion": Agama. Wajib bernilai salah satu dari: "Islam", "Kristen Protestan", "Kristen Katolik", "Hindu", "Buddha", "Konghucu", atau "".
7. "occupation": Pekerjaan. Format capitalized (contoh: "Karyawan Swasta", "Pelajar/Mahasiswa"). Jika tidak ditemukan, set "".
8. "relationship_status": Status perkawinan. Wajib bernilai "Single" (belum kawin), "Menikah" (kawin), atau "".
9. "address": Alamat lengkap sesuai KTP. Gabungkan jalan, RT/RW, Kelurahan, Kecamatan jika terpisah. Jika tidak ditemukan alamat valid, set "".

FORMAT OUTPUT (JSON SAJA, TANPA DEKORASI BACKTICKS / MURNI JSON):
{
  "nik": "Isi dengan NIK riil dari teks KTP, atau \"\"",
  "name": "Isi dengan nama riil dari teks KTP, atau \"\"",
  "birth_place": "Isi dengan tempat lahir riil dari teks KTP, atau \"\"",
  "birth_date": "Isi dengan tanggal lahir riil dari teks KTP, atau \"\"",
  "gender": "Pria" | "Wanita" | "",
  "religion": "Islam" | "Kristen Protestan" | "Kristen Katolik" | "Hindu" | "Buddha" | "Konghucu" | "",
  "occupation": "Isi dengan pekerjaan riil dari teks KTP, atau \"\"",
  "relationship_status": "Single" | "Menikah" | "",
  "address": "Isi dengan alamat riil dari teks KTP, atau \"\""
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean code fences if any
    const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const resultData = JSON.parse(cleanedText);

    return new Response(
      JSON.stringify({ success: true, data: resultData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
