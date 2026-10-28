import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model priority cascade: mengutamakan model aktif tercepat dan stabil di Google AI Studio
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
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
    const rawBody = await req.json().catch(() => ({}));

    // ── Endpoint Handler Ping Cepat untuk Background Pre-Warming ───────────
    if (rawBody.ping) {
      return new Response(
        JSON.stringify({ success: true, ping: "pong", warm: true, timestamp: Date.now() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_KEYS_RAW = Deno.env.get('GEMINI_API_KEY') || "";
    const GEMINI_KEYS = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k);

    const { imageUrl, mimeType } = rawBody;
    const base64Image = rawBody.base64Image || rawBody.image;
    console.log("[EDGE_BANNER] Request diterima, panjang base64:", base64Image ? base64Image.length : 0);

    if (GEMINI_KEYS.length === 0) {
      throw new Error("Gemini API key is not configured");
    }

    let contentsParts: any[] = [];

    const prompt = `
Anda adalah AI vision inspeksi foto properti sewa kamar khusus untuk platform RuangSinggah.id.
Tugas utama Anda adalah mendeteksi secara SANGAT AKURAT dan PRESISI objek:
1. SPANDUK / BANNER / PAPAN NAMA / PLANG / LEMBARAN KAIN / KERTAS / STIKER yang memuat penawaran sewa kamar, penjualan rumah/tanah, atau informasi kontak langsung, seperti:
   - Tulisan "TERIMA KOST", "TERIMA KOS", "DISEWAKAN", "MENERIMA KOST", "KOST PUTRA", "KOST PUTRI", "KOST KARYAWAN", "KOST CAMPUR", "ADA KAMAR KOSONG", "KAMAR DISEWAKAN".
   - Tulisan penjualan rumah/properti: "RUMAH INI DI JUAL", "DIJUAL", "DI JUAL", "TANPA PERANTARA", "DIKONTRAKKAN", "SEWA/KONTRAK".
   - Tulisan instruksi kontak seperti "Hubungi:", "Hub:", "Telp:", "WA:", "CP:", "Informasi:".
   - Nomor telepon genggam atau telepon rumah (format 08xx, +62xx, atau deretan angka kontak).
   - Catatan: Deteksi objek ini BAIK YANG BERUKURAN BESAR MAUPUN BERUKURAN KECIL yang terpasang di pagar, pilar gerbang, dinding depan, garasi, atau pintu masuk.

2. TEKS NOMOR TELEPON atau kontak WhatsApp langsung yang sengaja dipajang untuk transaksi di luar platform.

ATURAN DETEKSI SUDUT BANNER PRESISI & KOREKSI PERSPEKTIF (QUADRILATERAL POLYGON):
1. FOKUS HANYA PADA LEMBARAN SPANDUK / PAPAN ITU SENDIRI:
   - Tentukan 4 titik sudut terluar dari lembaran spanduk/papan tersebut secara berurutan searah jarum jam:
     * Point 0 (Top-Left): [x, y] sudut kiri atas lembaran spanduk
     * Point 1 (Top-Right): [x, y] sudut kanan atas lembaran spanduk
     * Point 2 (Bottom-Right): [x, y] sudut kanan bawah lembaran spanduk
     * Point 3 (Bottom-Left): [x, y] sudut kiri bawah lembaran spanduk
   - Koordinat titik sudut x dan y berskala 0 sampai 1000 (normalisasi terhadap lebar dan tinggi foto).
   - JIKA FOTO DIAMBIL DARI SUDUT MENYAMPING / MIRING (PERSPEKTIF), 4 titik sudut polygon HARUS MENGIKUTI KEMIRINGAN PERSPEKTIF LEMBARAN SPANDUK TERSEBUT.
   - Sediakan juga bounding box konvensional (ymin, xmin, ymax, xmax skala 0-1000) sebagai batas terluar.

2. NEGATIVE CONSTRAINTS (HINDARI OVER-BLUR):
   - DILARANG menyertakan seluruh struktur pintu gerbang, jeruji pagar besi/kayu vertikal, dinding rumah besar, lantai/aspal, tanaman/pot, kanopi atap, atau langit-langit.
   - Jika spanduk berukuran kecil terpasang pada pagar/gerbang kayu/besi (seperti plang kecil di pagar atau dinding pilar), TITIK SUDUT HANYA BOLEH MENUTUPI SPANDUK KECIL TERSEBUT! DILARANG menandai seluruh pagar atau pintu gerbang.
   - JANGAN tandai plang nama instansi/kantor atau nomor alamat rumah permanen yang TIDAK MEMUAT penawaran sewa/jual/nomor kontak.

3. Jika foto bersih dari spanduk penawaran kost/jual atau nomor kontak, kembalikan "has_contact": false, "boxes": [], "banners": [].

FORMAT OUTPUT (JSON MURNI SAJA, TANPA BACKTICKS/MARKDOWN):
{
  "has_contact": true / false,
  "detected_texts": ["daftar teks kontak atau tulisan spanduk yang terbaca"],
  "boxes": [
    {
      "ymin": 0-1000,
      "xmin": 0-1000,
      "ymax": 0-1000,
      "xmax": 0-1000,
      "polygon": [
        [x0, y0],
        [x1, y1],
        [x2, y2],
        [x3, y3]
      ],
      "label": "contact_banner" / "phone_number"
    }
  ]
}
`;

    contentsParts.push({ text: prompt });

    if (base64Image) {
      contentsParts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
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
    const triedErrors: any[] = [];

    // Model and Key cascade loop dengan True Load Balancing
    outerLoop:
    for (const model of CANDIDATE_MODELS) {
      // Acak titik awal key agar beban terdistribusi merata (100% Load-Balanced) ke seluruh akun Google
      const startKeyIdx = Math.floor(Math.random() * GEMINI_KEYS.length);
      for (let step = 0; step < GEMINI_KEYS.length; step++) {
        const kIdx = (startKeyIdx + step) % GEMINI_KEYS.length;
        const apiKey = GEMINI_KEYS[kIdx];
        try {
          const genConfig: any = {
            response_mime_type: "application/json",
            temperature: 0.1,
            maxOutputTokens: 800
          };
          if (!model.includes("lite") && !model.includes("1.5")) {
            genConfig.thinkingConfig = { thinkingBudget: 0 };
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(6000),
              body: JSON.stringify({
                contents: [{ parts: contentsParts }],
                generationConfig: genConfig
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Model ${model} with Key #${kIdx + 1} returned status ${response.status}: ${errorText}`);

            // Coba sekali lagi tanpa thinkingConfig jika model menolak parameter tersebut (HTTP 400)
            if (response.status === 400 && genConfig.thinkingConfig) {
              try {
                const retryResponse = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(6000),
                    body: JSON.stringify({
                      contents: [{ parts: contentsParts }],
                      generationConfig: {
                        response_mime_type: "application/json",
                        temperature: 0.1,
                        maxOutputTokens: 800
                      }
                    })
                  }
                );
                if (retryResponse.ok) {
                  const retryJson = await retryResponse.json();
                  const rawText = retryJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                  const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                  let resultData: any = { has_contact: false, boxes: [], detected_texts: [] };
                  try {
                    resultData = JSON.parse(cleanedText);
                  } catch (e) {
                    console.error("Failed to parse JSON from Gemini:", cleanedText);
                  }
                  if (Array.isArray(resultData.banners) && (!Array.isArray(resultData.boxes) || resultData.boxes.length === 0)) {
                    resultData.boxes = resultData.banners;
                  }
                  if (Array.isArray(resultData.boxes)) {
                    resultData.boxes = resultData.boxes.map((b: any) => {
                      let poly = b.polygon;
                      if (Array.isArray(poly) && poly.length >= 4) {
                        poly = poly.map((pt: any) => {
                          if (Array.isArray(pt)) return [pt[0], pt[1]];
                          if (typeof pt === 'object' && pt !== null) return [pt.x ?? pt.col ?? 0, pt.y ?? pt.row ?? 0];
                          return [0, 0];
                        });
                      } else {
                        poly = [
                          [b.xmin, b.ymin],
                          [b.xmax, b.ymin],
                          [b.xmax, b.ymax],
                          [b.xmin, b.ymax]
                        ];
                      }
                      return {
                        ymin: b.ymin,
                        xmin: b.xmin,
                        ymax: b.ymax,
                        xmax: b.xmax,
                        polygon: poly,
                        label: b.label || 'contact_banner'
                      };
                    });
                  }
                  successfulResult = {
                    success: true,
                    modelUsed: model,
                    data: resultData,
                    triedErrors
                  };
                  break outerLoop;
                }
              } catch (retryErr) {
                console.warn(`Retry without thinkingConfig failed for ${model}:`, retryErr);
              }
            }

            lastError = `Gemini API error ${response.status}: ${errorText}`;
            triedErrors.push({ model, keyIdx: kIdx + 1, status: response.status, error: errorText });
            if (response.status === 404 || response.status === 400 || response.status === 503 || response.status === 429) {
              // Jika model tidak tersedia, quota habis, atau 503 demand spike, langsung switch ke model berikutnya
              break;
            }
            continue;
          }

          const json = await response.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          
          let resultData: any = { has_contact: false, boxes: [], detected_texts: [] };
          try {
            resultData = JSON.parse(cleanedText);
          } catch (e) {
            console.error("Failed to parse JSON from Gemini:", cleanedText);
          }

          // Sinkronisasi data struktur boxes dan banners
          if (Array.isArray(resultData.banners) && (!Array.isArray(resultData.boxes) || resultData.boxes.length === 0)) {
            resultData.boxes = resultData.banners;
          }

          if (Array.isArray(resultData.boxes)) {
            resultData.boxes = resultData.boxes.map((b: any) => {
              let poly = b.polygon;
              if (Array.isArray(poly) && poly.length >= 4) {
                poly = poly.map((pt: any) => {
                  if (Array.isArray(pt)) return [pt[0], pt[1]];
                  if (typeof pt === 'object' && pt !== null) return [pt.x ?? pt.col ?? 0, pt.y ?? pt.row ?? 0];
                  return [0, 0];
                });
              } else {
                poly = [
                  [b.xmin, b.ymin],
                  [b.xmax, b.ymin],
                  [b.xmax, b.ymax],
                  [b.xmin, b.ymax]
                ];
              }
              return {
                ymin: b.ymin,
                xmin: b.xmin,
                ymax: b.ymax,
                xmax: b.xmax,
                polygon: poly,
                label: b.label || 'contact_banner'
              };
            });
          }

          successfulResult = {
            success: true,
            modelUsed: model,
            keyIndexUsed: kIdx + 1,
            data: resultData,
            triedErrors
          };
          break outerLoop;
        } catch (callErr: any) {
          console.warn(`Fetch error with model ${model} key #${kIdx + 1}:`, callErr);
          lastError = callErr?.message || String(callErr);
          triedErrors.push({ model, keyIdx: kIdx + 1, error: lastError });
        }
      }
    }

    if (!successfulResult) {
      throw new Error(`Semua model Gemini gagal: ${JSON.stringify(triedErrors)}`);
    }

    return new Response(
      JSON.stringify(successfulResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error", data: { has_contact: false, boxes: [] } }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
