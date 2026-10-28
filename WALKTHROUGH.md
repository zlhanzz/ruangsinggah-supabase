# WALKTHROUGH - Pencegahan Over-Blur Layar Penuh pada Fallback Heuristik Spanduk & Pemasangan Hard Safety Guardrails

## 📌 Ringkasan Masalah & Solusi
Pekerjaan ini menyelesaikan masalah di mana foto properti yang diunggah berubah menjadi hampir gelap gulita / hitam pekat dan merusak tampilan watermark foto saat proses upload:
1. **Akar Masalah (Root Cause)**:
   - Kuota Gemini AI Free Tier habis (HTTP 429), sehingga sistem mengalihkan pemindaian ke *Fallback Heuristik Client-Side* (`detectBannerRegionsClientSide`).
   - Pada clustering sebelumnya, terjadi efek bola salju (*cascading snowball merging*): tekstur alami dinding/pagar/aspal memicu deteksi sel di hampir setiap baris dan digabungkan secara longgar dengan toleransi padding 30px, sehingga kotak sensor membesar menyerap 80–90% foto menjadi satu kotak raksasa.
   - Fungsi `applyPerspectivePolygonSensorToCanvas` menerapkan efek frosted glass gelap `rgba(15, 23, 42, 0.84)` di atas kotak raksasa tersebut dan menambahkan watermark capsule, lalu `drawRuangSinggahWatermarkPattern` menggambar watermark diagonal di atas foto yang sudah gelap gulita, menghasilkan efek "foto hitam berantakan".
2. **Solusi yang Diterapkan**:
   - **Batas Geometris Keras pada Fallback Heuristik**: Membatasi ukuran maksimal spanduk wajar (`MAX_ALLOWED_W = width * 0.38`, `MAX_ALLOWED_H = height * 0.28`, `MAX_ALLOWED_AREA = (width * height) * 0.08`). Menghapus padding longgar (`pad = 30px`), mewajibkan baris bersebelahan (`rowDist <= 1`) dengan overlap horizontal >= 40%, serta membatasi maksimal 2 kluster terbaik.
   - **Hard Safety Guardrail di Level Rendering**: Menambahkan proteksi mutlak pada `applyPerspectivePolygonSensorToCanvas`: jika kotak memiliki lebar > 42% lebar foto, tinggi > 32% tinggi foto, atau luas > 10% total luas foto, fungsi langsung mengabaikan kotak tersebut dan tidak akan pernah menggambar sensor gelap di atas foto.

---

## 🛠️ Detail Perubahan Kode

### 1. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)

- **Hard Geometric Bounds pada Algoritma Heuristik (`detectBannerRegionsClientSide`)**:
  ```typescript
  // Batas geometris keras: spanduk sewa/plang kontak di dunia nyata
  // tidak pernah menutupi sebagian besar foto rumah.
  const MAX_ALLOWED_W = Math.round(width * 0.38);
  const MAX_ALLOWED_H = Math.round(height * 0.28);
  const MAX_ALLOWED_AREA = Math.round((width * height) * 0.08);
  ```

- **Clustering Ketat Berbasis Overlap Baris (Mencegah Efek Domino Bola Salju)**:
  ```typescript
  // Overlap minimal 40% dari segmen terkecil
  if (minLen > 0 && (overlapWidth / minLen) >= 0.40) {
      const proposedW = (newMaxCol - newMinCol + 1) * step;
      const proposedH = (newMaxRow - newMinRow + 1) * step;

      // Pastikan hasil penggabungan TIDAK MELEBIHI batas spanduk yang wajar
      if (proposedW <= MAX_ALLOWED_W && proposedH <= MAX_ALLOWED_H && (proposedW * proposedH) <= MAX_ALLOWED_AREA) {
          cl.minCol = newMinCol;
          cl.maxCol = newMaxCol;
          cl.minRow = newMinRow;
          cl.maxRow = newMaxRow;
          cl.totalEnergy += seg.avgEnergy;
          cl.segmentCount++;
          merged = true;
          break;
      }
  }
  ```

- **Hard Safety Guardrail di Level Rendering (`applyPerspectivePolygonSensorToCanvas`)**:
  ```typescript
  // HARD SAFETY GUARDRAIL: Jangan pernah menggelapkan foto jika kotak lebih besar dari batas spanduk wajar
  const maxAreaAllowed = (width * height) * 0.10;
  if (bW > width * 0.42 || bH > height * 0.32 || (bW * bH) > maxAreaAllowed) {
      console.warn(`[AI_SENSOR] Kotak sensor ditolak oleh Hard Safety Guardrail karena melebihi ukuran spanduk wajar (Area: ${Math.round((bW * bH) / (width * height) * 100)}% foto).`);
      return;
  }
  ```

---

## 🧪 Hasil Verifikasi Build

1. **Frontend Build (`npm --prefix functions/public run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - Waktu Kompilasi: **40.25s**
   - Modul: **2,512 modules transformed** tanpa error TypeScript.

2. **Backend Build (`npm --prefix functions run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - Compiler: TypeScript `tsc` selesai tanpa error.

---

## 📋 Catatan Riwayat Progres
- Dicatat pada [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) di bawah entri **#453**.

---

## 🚀 Panduan Pengujian bagi Pengguna

1. Buka formulir Tambah Kost atau Edit Kost di Mitra Dashboard.
2. Unggah foto properti (misalnya foto bangunan depan, pagar gerbang, atau kamar tidur).
3. Perhatikan hasil proses:
   - Foto tidak akan pernah lagi menjadi gelap gulita atau hitam pekat.
   - Watermark diagonal `ruangsinggah.id` berulang tetap tampil elegan, jernih, dan tajam di atas foto beresolusi penuh.
   - Jika terdapat spanduk nomor telepon atau plang sewa, sensor frosted glass hanya akan menutupi area kecil spanduk tersebut secara presisi.
