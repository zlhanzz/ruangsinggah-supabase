import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model priority cascade: Prioritaskan Gemini 3.7 Flash, dengan fallback otomatis ke versi Flash lainnya
const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, base64Image, mimeType } = await req.json();

    const GEMINI_KEYS_RAW = Deno.env.get('GEMINI_API_KEY') || "";
    const GEMINI_KEYS = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k);

    if (GEMINI_KEYS.length === 0) {
      throw new Error("Gemini API key is not configured");
    }

    let contentsParts: any[] = [];

    const prompt = `
Anda adalah AI vision inspeksi foto properti sewa khusus untuk platform RuangSinggah.id.
Tugas Anda adalah mendeteksi apakah di dalam foto ini terdapat:
1. SPANDUK / BANNER / PLANG / PAPAN NAMA PENYEWAAN KOST (misalnya bertuliskan "TERIMA KOST", "MENERIMA KOST", "KOST PUTRI", "KOST PUTRA", "DISEWAKAN", spanduk kain/terpal di pagar atau dinding).
2. INFORMASI KONTAK LANGSUNG (seperti nomor HP, nomor WhatsApp, kata "Hubungi", "Hub", "Telp", "WA", "SMS", "CP", nomor 08xx / +62xx).

PANDUAN DETEKSI KETAT:
1. Pindai seluruh bagian foto, termasuk spanduk kain/terpal di pagar, dinding, tiang, atau gerbang depan (misal spanduk hijau/merah/kuning bertuliskan "Menerima Kost... Hub: ...").
2. Jika DITEMUKAN spanduk penyewaan kost atau teks kontak:
   - Buat kotak bounding box (skala 0 sampai 1000: ymin, xmin, ymax, xmax) yang MENCAKUP SELURUH AREA SPANDUK / BANNER tersebut (atau setidaknya seluruh blok teks nomor telepon & keterangannya) agar sistem dapat menyamarkannya secara rapi dan bersih.
   - Set "has_contact": true.
3. Jika foto bersih dari spanduk penyewaan kamar dan tidak ada nomor kontak (misal hanya bangunan tanpa spanduk, interior kamar tidur bersih, atau hanya plat nomor kendaraan kecil di jalan), set "has_contact": false dan "boxes": [].

FORMAT OUTPUT (JSON SAJA, TANPA BACKTICKS):
{
  "has_contact": true / false,
  "detected_texts": ["daftar teks yang terbaca pada spanduk/kontak"],
  "boxes": [
    {
      "ymin": 0-1000,
      "xmin": 0-1000,
      "ymax": 0-1000,
      "xmax": 0-1000,
      "label": "contact_banner" / "phone_number"
    }
  ]
}
`;

    contentsParts.push({ text: prompt });

    if (base64Image) {
      contentsParts.push({
        inlineData: {
          mimeType: mimeType || "image/webp",
          data: base64Image
        }
      });
    } else if (imageUrl) {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
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
    } else {
      throw new Error("Missing imageUrl or base64Image parameter");
    }

    let lastError: any = null;
    let successfulResult: any = null;

    // Model and Key cascade loop
    outerLoop:
    for (const model of CANDIDATE_MODELS) {
      for (let kIdx = 0; kIdx < GEMINI_KEYS.length; kIdx++) {
        const apiKey = GEMINI_KEYS[kIdx];
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: contentsParts }],
                generationConfig: { 
                  response_mime_type: "application/json",
                  temperature: 0.1
                }
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Model ${model} with Key #${kIdx + 1} returned status ${response.status}: ${errorText}`);
            lastError = `Gemini API error ${response.status}: ${errorText}`;
            if (response.status === 404) {
              // Jika model tidak tersedia di endpoint tersebut, langsung beralih ke model berikutnya
              break;
            }
            continue;
          }

          const json = await response.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          
          let resultData = { has_contact: false, boxes: [], detected_texts: [] };
          try {
            resultData = JSON.parse(cleanedText);
          } catch (e) {
            console.error("Failed to parse JSON from Gemini:", cleanedText);
          }

          successfulResult = {
            success: true,
            modelUsed: model,
            data: resultData
          };
          break outerLoop;
        } catch (callErr) {
          console.warn(`Fetch error with model ${model} key #${kIdx + 1}:`, callErr);
          lastError = callErr;
        }
      }
    }

    if (!successfulResult) {
      throw new Error(lastError || "All Gemini models and API keys failed");
    }

    return new Response(
      JSON.stringify(successfulResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error", data: { has_contact: false, boxes: [] } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
