# WALKTHROUGH - Perbaikan Penanganan Quota AI 429, Deteksi Validasi Respon Gagal, dan Penguatan Fallback Heuristik Client-Side

## 📌 Ringkasan Pekerjaan
Pekerjaan ini menyelesaikan masalah di mana sensor banner/spanduk kontak tidak bekerja pada foto yang baru diunggah mitra:
1. **Pencegahan Silent Failure**: Memperbaiki pembacaan respon Supabase Edge Function `detect-contact-banner` di [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts). Respon gagal atau kuota habis (`success: false` / `data.error`) kini terdeteksi secara tegas, bukan lagi disalahartikan sebagai "foto bersih".
2. **Aktivasi Otomatis Fallback Heuristik Client-Side**: Ketika AI offline, kuota API 429 habis, atau model sedang overload (503), sistem seketika mengeksekusi `detectBannerRegionsClientSide` langsung di canvas lokal browser tanpa membiarkan foto lolos tanpa sensor.
3. **Penyempurnaan Algoritma Heuristik Lokal**: Menerapkan *Multi-Row Union Cluster* dan penambahan outward padding 12% untuk mendeteksi spanduk berukuran kecil pada pagar gerbang, pilar, maupun dinding secara rapat dan presisi.
4. **Ekspansi Model & Kompatibilitas Edge Function**: Menambahkan model cadangan Gemini lintas keluarga (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.0-flash-lite`) serta auto-retry tanpa `thinkingConfig` jika terjadi error 400.

---

## 🛠️ Detail Perubahan Kode

### 1. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)
- **Validasi Tegas Status Respon AI**:
  ```typescript
  if (data) {
      // Jika edge function mengembalikan success: false atau ada pesan error AI
      if (data.success === false || data.error) {
          console.warn('[AI_SENSOR] Edge Function AI mengembalikan kegagalan/kuota habis:', data.error);
          return {
              hasContact: false,
              detectedTexts: [],
              boxes: [],
              error: data.error || 'Pemindaian AI tidak tersedia'
          };
      }
      ...
  }
  ```
- **Peningkatan Algoritma `detectBannerRegionsClientSide`**:
  - Ambang batas kontras dan saturasi spanduk dioptimalkan (`sat > 0.22`, `lumDiff > 45`) agar plang putih/krem dengan tulisan teks di gerbang kayu/besi atau dinding depan dapat terdeteksi.
  - Menggabungkan kotak-kotak bertingkat multi-baris yang berdekatan (*Multi-Row Union Cluster*) agar spanduk tinggi tidak terpotong menjadi garis-garis tipis terpisah.
  - Menambahkan *outward radial padding* proporsional 12% (15-20px) di sekeliling kotak deteksi.

### 2. [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts)
- **Ekspansi Model Multi-Family**:
  ```typescript
  const CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash"
  ];
  ```
- **Auto-Retry Tanpa `thinkingConfig`**:
  Jika model mengembalikan HTTP 400 (karena tidak mendukung parameter `thinkingBudget: 0`), sistem secara otomatis mencoba kembali request tanpa parameter tersebut sebelum beralih ke model lain.
- **Status Kode HTTP 503**:
  Mengembalikan status HTTP 503 Service Unavailable ketika seluruh model gagal, sehingga terdeteksi secara tegas baik pada layer jaringan maupun layer aplikasi.

---

## 🧪 Hasil Verifikasi Build

1. **Frontend Build (`npm --prefix functions/public run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - Waktu kompilasi: **30.28s** (`✓ 2512 modules transformed`).
   - Bundle production di `functions/public/dist` disinkronkan ke root `public/`.
2. **Backend Functions Build (`npm --prefix functions run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - TypeScript compiler (`tsc`) berhasil tanpa error tipe data.

---

## 💡 Tips & Panduan bagi Pengguna

### A. Deploy Edge Function ke Supabase (Jika Diperlukan)
Untuk memperbarui Edge Function di Supabase Cloud dengan daftar model baru, jalankan perintah berikut di terminal:
```bash
npx supabase functions deploy detect-contact-banner
```

### B. Menghindari Limit Kuota Free-Tier (Multi-Key)
Untuk mencegah limit kuota 20 request/hari pada akun gratis Google AI Studio, Anda dapat membuat 2–3 API Key tambahan dari akun Google lain dan menyimpannya ke Supabase Secret `GEMINI_API_KEY` dipisahkan dengan tanda koma:
```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSy...,AIzaSy...,AIzaSy..."
```
Sistem Edge Function secara otomatis melakukan *round-robin / key fallback* jika salah satu key kehabisan kuota.
