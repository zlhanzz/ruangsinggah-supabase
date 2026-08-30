# Rencana Implementasi: Notifikasi Email ke Admin pada Pengajuan Verifikasi Identitas (`MitraProfile.tsx`, `AgentProfile.tsx`, `emailService.ts`)

Dokumen ini merancang implementasi pengiriman notifikasi email otomatis ke seluruh admin setiap kali ada pengajuan verifikasi identitas (KTP) baru yang masuk dari calon mitra (pemilik kost) maupun calon agen.

---

## 1. Analisis Kebutuhan

### Kebutuhan:
- Ketika calon mitra atau calon agen menyelesaikan pengisian profil dan mengunggah dokumen KTP untuk verifikasi identitas (`verification_status: 'pending'`), sistem harus segera mengirimkan notifikasi email ke email admin.
- Email notifikasi harus memuat rincian lengkap agar admin dapat langsung meninjau data tanpa tertunda:
  1. **Tipe Akun / Role**: Calon Mitra / Pemilik Kost atau Calon Agen Pemasaran.
  2. **Nama Lengkap**: Sesuai KTP / Profil.
  3. **Email & Nomor WhatsApp**: Untuk keperluan kontak / koordinasi.
  4. **Nomor NIK KTP & Alamat KTP**.
  5. **Tautan Foto KTP**: Untuk pratinjau instan.
  6. **ID Pengguna & Tautan Langsung ke Dashboard Verifikasi Admin**.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`functions/public/emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts) | Menambahkan fungsi `notifyAdminIdentityVerification` yang mengirimkan email berformat profesional ke seluruh admin terdaftar secara dinamis (via FormSubmit / gateway). |
| 2 | [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) | Memanggil `notifyAdminIdentityVerification` saat mitra mengajukan verifikasi identitas KTP. |
| 3 | [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx) | Memanggil `notifyAdminIdentityVerification` saat agen mengajukan verifikasi identitas KTP. |
| 4 | [`functions/public/pages/Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx) | Memanggil `notifyAdminIdentityVerification` jika agen memperbarui berkas verifikasi dari halaman profil umum. |
| 5 | `functions/PROGRESS.md` | Pencatatan riwayat (Anti-Amnesia) Fitur #224. |
| 6 | `WALKTHROUGH.md` | Dokumentasi pengujian dan verifikasi. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Buat Fungsi Helper Notifikasi Email di `emailService.ts`
- Implementasikan `notifyAdminIdentityVerification` dengan format payload email terstruktur (Tipe Akun, Nama, Email, WhatsApp, NIK, Alamat KTP, Foto KTP, Link Dashboard).

### Langkah 2: Integrasikan ke Handler Submit di `MitraProfile.tsx` & `AgentProfile.tsx`
- Pasang pemicu notifikasi saat `user_verifications` di-upsert dengan status `'pending'`.

### Langkah 3: Uji Kompilasi & Pengujian
- Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan lulus 100% (0 error).
- Simulasikan pengiriman email notifikasi via unit test script.

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat riwayat di `functions/PROGRESS.md` (Fitur #224).
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Build**:
   - `npm run build` berhasil tanpa error kompilasi TypeScript/Vite.
2. **Uji Pengiriman Email**:
   - Menjalankan simulasi submit verifikasi dan memastikan payload email terkirim ke alamat email admin terdaftar (`adminEmails`).
3. **Uji Alur UI**:
   - Memastikan proses penyimpanan profil di UI tetap responsif (notifikasi email berjalan secara *non-blocking* di latar belakang).
