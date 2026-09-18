# Rencana Implementasi (Implementation Plan): Protokol Ketat Penguncian Nomor WhatsApp Terverifikasi & Alur Ganti Nomor Baru

Dokumen ini disusun untuk merespons kebutuhan pengguna mengenai pengamanan nomor WhatsApp yang telah berhasil diverifikasi pada tahap verifikasi identitas (Step 1) agar tidak dapat diedit secara bebas hanya dengan mengeklik kolom input nomor telepon.

---

## 1. Analisis Masalah & Kebutuhan

### A. Masalah Saat Ini
1. **Nomor Tidak Terkunci Pasca Verifikasi OTP**:
   Setelah pengguna memasukkan kode OTP 6-digit WhatsApp dengan benar, status `waOtpVerified` berubah menjadi `true` dan muncul badge hijau "Terverifikasi". Namun, elemen input `<input name="phone" value={formData.phone} onChange={handleInputChange} />` masih berupa input teks standar yang aktif, tanpa atribut `readOnly` atau `disabled`.
2. **Rawan Perubahan Tidak Sengaja & Inkonsistensi Data**:
   Pengguna dapat secara tidak sengaja mengeklik kolom nomor telepon, mengubah angka, atau menghapus nomor tanpa memicu pembatalan status verifikasi (`waOtpVerified` tetap `true` di state). Hal ini berisiko meloloskan nomor yang belum diverifikasi ke tahap selanjutnya.
3. **Ketiadaan Protokol Resmi Ganti Nomor**:
   Belum ada tombol eksplisit **"Ganti Nomor"** dengan konfirmasi resmi dan alur reset verifikasi yang mewajibkan nomor pengganti untuk diverifikasi ulang via OTP WhatsApp.

### B. Kebutuhan Pengguna
1. **Penguncian Otomatis (Locking)**:
   Ketika nomor WhatsApp telah berstatus `waOtpVerified === true`, kolom input nomor telepon wajib otomatis terkunci (`readOnly={true}`), kursor tidak aktif untuk pengetikan bebas, dan menampilkan indikator visual yang jelas bahwa nomor telah terverifikasi dan diproteksi.
2. **Protokol Ketat Ganti Nomor**:
   Untuk mengganti nomor yang sudah diverifikasi, pengguna **wajib** mengeklik tombol **"Ganti Nomor"**.
3. **Konfirmasi & Reset Verifikasi**:
   Saat tombol "Ganti Nomor" diklik, sistem memberikan dialog konfirmasi peringatan bahwa nomor lama akan dilepas dan nomor baru wajib diverifikasi ulang. Jika disetujui:
   - Status `waOtpVerified` di-reset menjadi `false`.
   - Kode OTP lama dan isian digit OTP dibersihkan.
   - Input nomor terbuka kembali (`readOnly={false}`) untuk diedit.
   - Tombol "Kirim OTP" aktif kembali untuk mengirim kode ke nomor baru.
   - Tombol **"LANJUTKAN"** pada Step 1 otomatis terkunci (`disabled`) hingga nomor baru tersebut tervalidasi sukses via OTP WhatsApp.

---

## 2. Dampak Perubahan

Perubahan akan diterapkan secara presisi dan konsisten pada dua halaman profil verifikasi:
1. `functions/public/pages/MitraProfile.tsx` (Alur Verifikasi Identitas Mitra / Pemilik Kost)
2. `functions/public/pages/AgentProfile.tsx` (Alur Verifikasi Identitas Agen Properti)

Tidak ada perubahan pada skema database atau backend Cloud Functions, karena data yang tersimpan tetap mengikuti alur data `users.phone` dan `users.whatsapp_verified`.

---

## 3. Langkah-Langkah Eksekusi (Setelah Approval)

### Langkah 1: Implementasi Handler Protokol Ganti Nomor
Menambahkan fungsi `handleInitiateChangePhone` pada `MitraProfile.tsx` dan `AgentProfile.tsx`:
```typescript
const handleInitiateChangePhone = () => {
    const confirmChange = window.confirm(
        'Apakah Anda yakin ingin mengganti nomor WhatsApp? Nomor yang baru wajib diverifikasi ulang dengan kode OTP WhatsApp sebelum Anda dapat melanjutkan.'
    );
    if (!confirmChange) return;

    setWaOtpVerified(false);
    setWaOtpCode('');
    setWaOtpInput('');
    setOtpDigits(['', '', '', '', '', '']);
    setIsVerifyingWaOtp(false);
    setWaResendTimer(0);
};
```

### Langkah 2: Penguncian Input & Tombol "Ganti Nomor" di UI
Memperbarui baris render No. WhatsApp pada Step 1:
1. **Header Label**:
   - Ketika `waOtpVerified === true`, tampilkan badge `Terverifikasi` berdampingan dengan tombol **"Ganti Nomor"** yang berpenampilan sekunder/outline rapi:
     ```tsx
     <div className="flex items-center gap-2">
         <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
             <BadgeCheck size={12} className="text-green-500" /> Terverifikasi
         </span>
         <button
             type="button"
             onClick={handleInitiateChangePhone}
             className="text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md border border-orange-200 transition-all active:scale-95"
         >
             Ganti Nomor
         </button>
     </div>
     ```
2. **Input Telepon**:
   - Tambahkan properti `readOnly={waOtpVerified}`.
   - Tambahkan styling penguncian ketika `waOtpVerified`: `cursor-not-allowed bg-gray-100/70 border-green-300 text-gray-800 select-none`.
   - Menghindari manipulasi nilai telepon saat sedang berstatus terverifikasi.

### Langkah 3: Penyelarasan Penuh pada `AgentProfile.tsx`
Menerapkan struktur handler dan UI penguncian yang sama persis pada `AgentProfile.tsx` agar standar keamanan nomor WhatsApp seragam di seluruh aplikasi.

### Langkah 4: Kompilasi & Verifikasi Build
1. Menjalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error kompilasi TypeScript dan bundler Vite.
2. Memverifikasi kelancaran alur kunci/buka dan reset tombol LANJUTKAN.

---

## 4. Rencana Verifikasi
1. **Uji Penguncian Kolom**:
   - Masukkan nomor telepon dan lakukan verifikasi OTP.
   - Setelah sukses, klik dan ketik pada kolom input nomor WhatsApp.
   - Pastikan teks di dalam input **tidak dapat diubah**, dihapus, atau dimodifikasi secara langsung.
2. **Uji Protokol Ganti Nomor**:
   - Klik tombol **"Ganti Nomor"**.
   - Sistem memunculkan jendela dialog konfirmasi keamanan.
   - Jika pengguna membatalkan (Cancel), nomor tetap terkunci dan status tetap terverifikasi.
   - Jika disetujui (OK):
     - Kolom nomor terbuka kembali untuk diedit.
     - Tombol "LANJUTKAN" otomatis menjadi abu-abu / tidak dapat diklik (`disabled`).
     - Pengguna memasukkan nomor pengganti dan wajib menekan "Kirim OTP" serta menyelesaikan verifikasi OTP baru sebelum dapat melanjutkan ke Step 2.
3. **Uji Build**:
   - Memastikan `npm run build` berhasil tanpa error.
