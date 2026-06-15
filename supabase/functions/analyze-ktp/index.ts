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

ATURAN EKSTRAKSI:
1. "nik": Wajib 16 digit angka bersih (perbaiki typo karakter OCR seperti 'O' -> '0', 'I/l' -> '1', 'B' -> '8', dll).
2. "name": Nama lengkap orang tersebut. Bersihkan teks awalan "NAMA" atau simbol pemisah.
3. "birth_place": Tempat lahir saja.
4. "birth_date": Tanggal lahir dalam format standar HTML date: "YYYY-MM-DD". Konversikan bulan (misal "Januari", "Desember", "DES") atau format angka "DD-MM-YYYY" menjadi format standar tersebut.
5. "gender": Jenis kelamin. Wajib bernilai "Pria" atau "Wanita".
6. "religion": Agama. Wajib bernilai salah satu dari: "Islam", "Kristen Protestan", "Kristen Katolik", "Hindu", "Buddha", "Konghucu".
7. "occupation": Pekerjaan. Format capitalized (contoh: "Karyawan Swasta", "Pelajar/Mahasiswa").
8. "relationship_status": Status perkawinan. Wajib bernilai "Single" (jika belum kawin) atau "Menikah" (jika sudah kawin/menikah).
9. "address": Alamat lengkap sesuai KTP. Gabungkan jalan, RT/RW, Kelurahan, Kecamatan jika terpisah.

FORMAT OUTPUT (JSON SAJA, TANPA DEKORASI BACKTICKS / MURNI JSON):
{
  "nik": "3171234567890001",
  "name": "NAMA LENGKAP",
  "birth_place": "JAKARTA",
  "birth_date": "1995-12-31",
  "gender": "Pria" | "Wanita",
  "religion": "Islam" | "Kristen Protestan" | "Kristen Katolik" | "Hindu" | "Buddha" | "Konghucu",
  "occupation": "Karyawan Swasta",
  "relationship_status": "Single" | "Menikah",
  "address": "JL. CONTOH NO. 123, RT. 001, RW. 002, Kel. Contoh, Kec. Contoh"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
