import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, imageUrl } = await req.json();

    const GEMINI_KEYS_RAW = Deno.env.get('GEMINI_API_KEY') || "";
    const GEMINI_KEYS = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k);
    const GEMINI_API_KEY = GEMINI_KEYS[0] || "";

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    let contentsParts: any[] = [];

    const prompt = `
Anda adalah AI pengekstrak data KTP khusus untuk RuangSinggah.id.
Tugas Anda adalah membaca gambar KTP yang diberikan dan mengekstrak informasi terstruktur ke dalam format JSON yang bersih.

ATURAN PENTING & KETAT:
1. ABAIKAN NOISE LATAR BELAKANG: Gambar KTP mungkin diletakkan di atas laptop atau meja. JANGAN PERNAH mengekstrak teks stiker laptop (seperti "AMD", "RADEON", "Intel", "Ryzen", "GeForce") atau tombol keyboard (seperti "Caps Lock", "Shift", "Ctrl", "Alt", "Fn", "Space") sebagai bagian dari data KTP (misalnya jangan menjadikannya Nama atau Alamat KTP).
2. Jika suatu data (misalnya NIK, Nama, Tanggal Lahir, atau Agama) TIDAK terbaca, kosong, atau tidak ditemukan di KTP secara valid, isilah nilai kunci tersebut dengan string kosong ("") atau null. JANGAN PERNAH MENYALIN NILAI CONTOH TEMPLATE.
3. KTP yang difoto mungkin memiliki kualitas gambar rendah pada sebagian area (misal sisi kiri buram/silau), namun bacalah sebisanya dengan cermat.

ATURAN EKSTRAKSI:
1. "nik": Wajib 16 digit angka bersih yang Anda temukan di KTP (NIK). Perbaiki typo karakter (seperti 'O'->'0', 'I/l'->'1', etc.). Jika tidak ditemukan 16 digit angka valid, set "".
2. "name": Nama lengkap orang tersebut (Nama). Bersihkan kata awalan seperti "Nama" atau ":". Jika tidak ditemukan nama valid, set "".
3. "birth_place": Tempat lahir saja (contoh: "SOPPENG", "MAKASSAR"). Perhatikan: Kota di bawah foto KTP adalah kota pembuatan KTP, bukan tempat lahir. Ambil tempat lahir dari baris "Tempat/Tgl Lahir". Jika tidak ditemukan, set "".
4. "birth_date": Tanggal lahir dalam format standar HTML date: "YYYY-MM-DD" (contoh: "2004-11-10"). Konversikan format angka "DD-MM-YYYY" atau nama bulan menjadi format standar tersebut. Jika tidak ditemukan tanggal lahir valid, set "".
5. "gender": Jenis kelamin. Wajib bernilai "Pria", "Wanita", atau "".
6. "religion": Agama. Wajib bernilai salah satu dari: "Islam", "Kristen Protestan", "Kristen Katolik", "Hindu", "Buddha", "Konghucu", atau "".
7. "occupation": Pekerjaan. Format capitalized (contoh: "Karyawan Swasta", "Pelajar/Mahasiswa"). Jika tidak ditemukan, set "".
8. "relationship_status": Status perkawinan. Wajib bernilai "Single" (belum kawin), "Menikah" (kawin), atau "".
9. "address": Alamat lengkap sesuai KTP. Gabungkan jalan, RT/RW, Kelurahan, Kecamatan jika terpisah. Jika tidak ditemukan alamat valid, set "".

FORMAT OUTPUT (JSON SAJA, TANPA DEKORASI BACKTICKS / MURNI JSON):
{
  "nik": "Isi dengan NIK riil dari KTP, atau \"\"",
  "name": "Isi dengan nama riil dari KTP, atau \"\"",
  "birth_place": "Isi dengan tempat lahir riil dari KTP, atau \"\"",
  "birth_date": "Isi dengan tanggal lahir riil dari KTP, atau \"\"",
  "gender": "Pria" | "Wanita" | "",
  "religion": "Islam" | "Kristen Protestan" | "Kristen Katolik" | "Hindu" | "Buddha" | "Konghucu" | "",
  "occupation": "Isi dengan pekerjaan riil dari KTP, atau \"\"",
  "relationship_status": "Single" | "Menikah" | "",
  "address": "Isi dengan alamat riil dari KTP, atau \"\""
}
`;

    contentsParts.push({ text: prompt });

    if (imageUrl) {
      console.log(`Fetching image from URL: ${imageUrl}`);
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to fetch KTP image from storage: ${imageRes.statusText}`);
      }
      const contentType = imageRes.headers.get("content-type") || "image/jpeg";
      const buffer = await imageRes.arrayBuffer();
      const base64Data = encodeBase64(buffer);

      contentsParts.push({
        inlineData: {
          mimeType: contentType,
          data: base64Data
        }
      });
    } else if (text) {
      contentsParts.push({ text: `DATA KTP HASIL OCR TEKS:\n${text}` });
    } else {
      throw new Error("Missing both text and imageUrl parameters");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: contentsParts }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    let resultData = {};
    try {
      resultData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", cleanedText);
    }

    return new Response(
      JSON.stringify({ success: true, data: resultData, rawResponse: json, rawText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
