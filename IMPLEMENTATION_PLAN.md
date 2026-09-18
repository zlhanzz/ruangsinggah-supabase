# Rencana Implementasi: Optimasi Langkah 1 Verifikasi Identitas Mitra (Penghapusan Tempat/Tanggal Lahir & Eliminasi Tombol Duplikat OTP)

Dokumen ini memuat analisis masalah dan rencana modifikasi kode untuk mengoptimalkan alur Verifikasi Identitas Mitra pada `MitraProfile.tsx` (dan penyelarasan pada `AgentProfile.tsx`):
1. Menghapus input **Tempat Lahir** dan **Tanggal Lahir** pada Langkah 1 (karena sudah tersedia dan terisi otomatis melalui OCR KTP pada Langkah 2).
2. Menghilangkan tombol duplikat **Kirim Ulang** pada komponen verifikasi nomor WhatsApp.

---

## 1. Analisis Masalah & Kebutuhan

1. **Redundansi Tempat & Tanggal Lahir di Langkah 1**:
   - Saat ini, pada Langkah 1 Verifikasi Identitas Mitra (`MitraProfile.tsx`), pengguna diminta mengisi formulir:
     - Foto Profil, Nama Lengkap, No. WhatsApp, Email, **Tempat Lahir**, **Tanggal Lahir**, dan Alamat Domisili.
   - Pada Langkah 2 (Verifikasi KTP), sistem memiliki pemindai OCR KTP otomatis (`handleKtpUpload`) yang mengekstrak data KTP, termasuk kolom **Tempat Lahir (Sesuai KTP)** dan **Tanggal Lahir (Sesuai KTP)**.
   - Meminta mitra mengisi tempat dan tanggal lahir secara manual di Langkah 1 adalah tindakan mubazir (data redundan) dan memperlambat pendaftaran.
   - Solusi: Hapus kedua kolom tersebut dari Langkah 1, serta sesuaikan validasi kelengkapan Langkah 1 (`isStep1Complete`) agar mitra dapat langsung melanjutkan ke Langkah 2 setelah memverifikasi WhatsApp, mengisi nama, dan alamat domisili.

2. **Tombol Duplikat "Kirim Ulang" OTP WhatsApp**:
   - Di samping label `No. WhatsApp`, tombol awal berubah menjadi `Kirim Ulang` saat OTP telah dikirimkan, sehingga terdapat 2 tombol `KIRIM ULANG` yang muncul bersamaan dengan hitung mundur di dalam kartu OTP.
   - Solusi:
     - Di header label atas: Hanya tampilkan tombol **`Kirim Kode OTP`** jika belum kirim, atau badge status informatif **`Kode Terkirim`** jika OTP sudah aktif.
     - Di dalam kotak kartu OTP: Menjadi satu-satunya pengendali hitung mundur (`Kirim ulang dalam {waResendTimer}s` $\rightarrow$ tombol `Kirim Ulang` saat timer habis).

---

## 2. Dampak Perubahan File

1. [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
   - **Hapus Input Tempat & Tanggal Lahir Langkah 1**: Menghapus blok elemen `<ProfileItemRead label="Tempat Lahir" ... />` dan `<ProfileItemRead label="Tanggal Lahir" ... />` pada Langkah 1 (baris 1064–1067).
   - **Sesuaikan Validasi `isStep1Complete`**: Menghapus syarat `formData.birth_place.trim() !== ''` dan `formData.birth_date.trim() !== ''` dari validasi tombol *Lanjutkan* (baris 1226–1232).
   - **Eliminasi Tombol Duplikat OTP**: Merapikan header `No. WhatsApp` agar hanya menampilkan badge `Kode Terkirim` saat OTP aktif dan memusatkan kontrol kirim ulang di dalam kartu OTP.
2. [functions/public/pages/AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
   - Menyelaraskan eliminasi tombol duplikat OTP pada formulir profil agen.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Modifikasi `MitraProfile.tsx`
- **Hapus elemen JSX Tempat & Tanggal Lahir di Langkah 1**:
  Hapus baris:
  ```tsx
  <div className="grid grid-cols-2 gap-4">
      <ProfileItemRead icon={<MapPin size={18} />} label="Tempat Lahir" value={formData.birth_place} isEditing={true} name="birth_place" onChange={handleInputChange} placeholder="Tempat Lahir" />
      <ProfileItemRead icon={<Calendar size={18} />} label="Tanggal Lahir" value={formData.birth_date} isEditing={true} name="birth_date" onChange={handleInputChange} type="date" />
  </div>
  ```
- **Perbarui rumus `isStep1Complete`**:
  ```tsx
  const isStep1Complete =
      formData.display_name.trim() !== '' &&
      formData.phone.trim() !== '' &&
      waOtpVerified &&
      formData.address.trim() !== '';
  ```
- **Perbarui tombol di header label `No. WhatsApp`**:
  ```tsx
  {waOtpVerified ? (
      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
          <BadgeCheck size={12} className="text-green-500" /> Terverifikasi
      </span>
  ) : !waOtpCode ? (
      <button 
          type="button" 
          onClick={handleSendWaOtp} 
          disabled={isSubmitting || !formData.phone}
          className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:bg-gray-100 disabled:text-gray-400 px-2.5 py-1.5 rounded-lg transition-colors border border-orange-100"
      >
          {isSubmitting ? 'Mengirim...' : 'Kirim Kode OTP'}
      </button>
  ) : (
      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
          <Clock size={12} className="text-amber-500" /> Kode Terkirim
      </span>
  )}
  ```

### Langkah 2: Modifikasi `AgentProfile.tsx`
- Terapkan pembaruan header `No. WhatsApp` yang sama pada `AgentProfile.tsx`.

### Langkah 3: Uji Kompilasi & Verifikasi Frontend
- Jalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error kompilasi TypeScript dan Vite bundler.
- Pastikan form Langkah 1 bersih dari kolom tempat/tanggal lahir dan tombol "Lanjutkan" aktif saat nama, WA terverifikasi, dan domisili terisi.

### Langkah 4: Dokumentasi Progres & Walkthrough
- Catat riwayat pekerjaan di `functions/PROGRESS.md` (#418).
- Terbitkan `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi UI Langkah 1**:
   - Kolom "Tempat Lahir" dan "Tanggal Lahir" tidak lagi tampil di Langkah 1.
   - Kolom "Tempat Lahir" dan "Tanggal Lahir" tetap tampil normal dan siap terisi otomatis melalui OCR KTP di Langkah 2.
2. **Verifikasi Tombol Lanjutkan**:
   - Tombol "LANJUTKAN" aktif dan dapat diklik begitu Nomor WhatsApp berstatus terverifikasi, Nama terisi, dan Domisili terisi.
3. **Verifikasi Eliminasi Tombol Duplikat OTP**:
   - Hanya ada 1 kontrol kirim ulang yang aktif di dalam kartu OTP. Tidak ada tombol kirim ulang liar di header atas saat timer countdown berjalan.
4. **Uji Kompilasi**:
   - `npm.cmd run build` lulus 100% dengan 0 error.
