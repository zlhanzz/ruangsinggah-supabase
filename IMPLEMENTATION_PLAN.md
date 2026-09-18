# Rencana Implementasi (Implementation Plan): Perbaikan Sistem OCR AI Verifikasi KTP (`analyze-ktp`)

Dokumen ini memuat analisis akar masalah dan rencana perbaikan atas kendala kegagalan pemindaian OCR KTP (`FunctionsHttpError: Edge Function returned a non-2xx status code` pada baris 563 `MitraProfile.tsx`).

---

## 1. Analisis Masalah & Akar Masalah

### A. Gejala yang Ditemukan
Saat pengguna mengunggah foto KTP pada halaman verifikasi identitas (Step 2), sistem memunculkan peringatan *"Pemindaian otomatis belum optimal. Silakan periksa dan lengkapi data profil Anda secara manual"* dan di konsol browser tercatat error:
```text
MitraProfile.tsx:563 AI Extraction response: FunctionsHttpError: Edge Function returned a non-2xx status code
```

### B. Hasil Investigasi Empiris & Akar Masalah
Setelah dilakukan simulasi pengujian langsung ke Edge Function Supabase `analyze-ktp` menggunakan file KTP asli yang diunggah pengguna:
1. **Pengujian dengan `imageUrl` murni dari Supabase Storage**:
   - **Hasil**: **SUKSES 100%** (Status: 200 OK, waktu pemrosesan < 3 detik).
   - **Data yang Berhasil Diekstrak Secara Presisi**:
     - NIK: `7312011011040003`
     - Nama: `SULHAN`
     - Tempat Lahir: `SUNNE`
     - Tanggal Lahir: `2004-11-10`
     - Jenis Kelamin: `Pria`
     - Agama: `Islam`
     - Pekerjaan: `Pelajar/Mahasiswa`
     - Status Perkawinan: `Single`
     - Alamat: `BUNNE RT 001/RW 003, GOARIE, MARIORIWAWO`
2. **Akar Masalah di Sisi Front-End (`MitraProfile.tsx` & `AgentProfile.tsx`)**:
   - Pada fungsi `handleKtpUpload`, front-end mencoba mengonversi file WebP lokal menjadi string base64 dengan perulangan karakter JavaScript (`for (...) binary += String.fromCharCode(bytes[i]); base64String = btoa(binary);`).
   - Kode kemudian memanggil `performOcr(publicUrl, base64String)` dan mengirimkan `{ imageUrl, base64Image, mimeType }` ke Edge Function.
   - Di dalam Edge Function `analyze-ktp`:
     ```typescript
     if (base64Image) {
         // Menggunakan base64Image
     } else if (imageUrl) {
         // Menggunakan imageUrl
     }
     ```
   - Karena `base64Image` terisi, Edge Function memprioritaskan base64 tersebut dan mengabaikan `imageUrl`.
   - String base64 yang dihasilkan di sisi klien browser berukuran besar (>130 KB - beberapa MB), rawan terpotong/korup di memori browser atau menyebabkan ukuran payload HTTP body melampaui batas yang diterima Deno/Edge Function, sehingga Edge Function melempar error status 400.
3. **Karakter Spasi pada Nama File**:
   - Nama file upload menyertakan nama file mentah tanpa sanitasi (misal: `Screenshot 2026-06-15 143554.webp`). Karakter spasi mentah pada URL dapat memicu masalah decoding pada beberapa HTTP client.

---

## 2. Dampak Perubahan

Perubahan akan difokuskan pada pengoptimalan pemanggilan OCR di sisi front-end:
1. `functions/public/pages/MitraProfile.tsx`
2. `functions/public/pages/AgentProfile.tsx`

*Catatan: Edge Function `analyze-ktp` di Supabase backend sudah terbukti berfungsi sempurna ketika menerima `imageUrl`.*

---

## 3. Langkah-Langkah Eksekusi (Setelah Approval)

### Langkah 1: Sanitasi Nama File Upload KTP
Pada `handleKtpUpload` di `MitraProfile.tsx` dan `AgentProfile.tsx`:
- Membersihkan `baseName` dari spasi dan karakter non-alphanumeric:
  ```typescript
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${uid}-${Date.now()}_${safeBaseName}.webp`;
  ```

### Langkah 2: Eliminasi Generasi Base64 Klien & Gunakan `imageUrl` Bersih
- Menghapus perulangan berat `String.fromCharCode` dan pembuatan `base64String` dari `handleKtpUpload`.
- Memanggil `performOcr(publicUrl)` secara langsung.
- Pada `performOcr`:
  ```typescript
  const invokePromise = supabase.functions.invoke('analyze-ktp', {
      body: { 
          imageUrl: imageUrl,
          mimeType: 'image/webp'
      }
  });
  ```
- Keuntungan:
  - Payload request ke Edge Function menjadi sangat kecil (< 200 bytes), cepat, dan stabil.
  - 0% risiko memory overflow atau string encoding korup di browser pengguna.
  - Pemrosesan gambar di Edge Function mengambil file WebP langsung dari storage Supabase berkecepatan tinggi.

### Langkah 3: Ekstraksi Pesan Error Detail pada `aiErr`
Memperbarui penanganan error pada `performOcr`:
```typescript
if (aiErr) {
    let detailMsg = aiErr.message;
    if (aiErr.context) {
        try {
            const errBody = await aiErr.context.json();
            if (errBody?.error) detailMsg = errBody.error;
        } catch (_) {}
    }
    console.warn('AI Extraction error detail:', detailMsg);
}
```

### Langkah 4: Kompilasi & Verifikasi Build
- Menjalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error kompilasi.

---

## 4. Rencana Verifikasi
1. **Uji Simulasi Pemanggilan**:
   - Memastikan request body hanya berisi `imageUrl`.
   - Menjalankan pemindaian otomatis pada foto KTP yang diunggah pengguna.
2. **Uji Pengisian Formulir Otomatis**:
   - NIK, Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, dan Alamat terisi otomatis di form Step 2 tanpa memunculkan error.
3. **Uji Kompilasi Front-End**:
   - Memastikan `npm run build` sukses 100%.
