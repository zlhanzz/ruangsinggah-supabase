# Rencana Implementasi: Tampilkan Langsung Landing Page KostManager Lengkap Tanpa Halaman Perantara & Alur Action Button ke Pendaftaran Akun Mitra (`Owner.tsx`, `KostManagerLanding.tsx`)

Dokumen ini merancang penyelesaian masalah di mana saat mengklik kartu **"Kost Manager"** di menu kemitraan ([`Owner.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Owner.tsx)), halaman akan **langsung menampilkan Landing Page KostManager Lengkap** (sama persis dengan landing page KostManager di dashboard mitra) secara instan tanpa ada layar perantara (*intermediate screen*) lagi, serta menyesuaikan seluruh **Action Button** agar mengarahkan pengguna yang belum memiliki akun untuk **membuat akun mitra terlebih dahulu**.

---

## 1. Analisis Masalah & Kebutuhan

### Masukan Pengguna:
> *"kenapa landing page nya tidak muncul langsung setelah klik ini, kenapa harus ada proses lagi satu kali setelahnya"*
> *(Disertai screenshot kartu "Pilih Kost Manager")*

### Analisis Masalah:
1. **Layar Perantara yang Tidak Perlu**:
   - Saat pengguna mengklik kartu "Kost Manager" pada layar pilihan kemitraan `/owner`, sistem sebelumnya menampilkan layar perantara dengan banner oranye dan tombol tambahan *"Pelajari Portal Kost Manager Lengkap"*.
   - Hal ini membuat pengguna harus mengklik 2 kali untuk melihat informasi lengkap Kost Manager.
2. **Solusi yang Diinginkan**:
   - Begitu kartu atau tombol **"Pilih Kost Manager"** diklik, halaman **langsung merender Landing Page KostManager Lengkap** ([`KostManagerLanding.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx)) tanpa perantara.
   - Di dalam landing page KostManager tersebut:
     - Seluruh tombol aksi (*"Mulai Auto-Pilot Kost Sekarang"*, *"Langganan KostManager Sekarang"*, *"Pilih Paket Ini"*) jika diklik oleh pengunjung yang **belum login (`!user`)** akan langsung mengarahkan ke halaman pendaftaran akun mitra (`/login?role=owner&mode=register`).
     - Jika pengunjung **sudah login**, tombol aksi langsung membuka modal formulir data kost dan aktivasi paket KostManager.
     - Disediakan tombol **"Kembali ke Pilihan Kemitraan"** yang mulus untuk kembali ke layar pilihan awal jika diinginkan.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/Owner.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Owner.tsx) | Menghilangkan layar perantara; langsung mengimpor dan merender `<KostManagerLanding user={user} onBack={() => setPartnerType(null)} isEmbedded={true} />` saat `partnerType === 'manajemen'`. |
| 2 | [`functions/public/pages/KostManagerLanding.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx) | Menyesuaikan fungsi `handleOpenRegistration` dan seluruh tombol CTA agar jika `!user`, diarahkan langsung ke pendaftaran akun mitra (`/login?role=owner&mode=register`). Menambahkan prop `onBack` dan `isEmbedded`. |
| 3 | `functions/PROGRESS.md` | Pencatatan riwayat pekerjaan (Anti-Amnesia). |
| 4 | `WALKTHROUGH.md` | Dokumentasi panduan pengujian dan detail perubahan. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Perbarui `KostManagerLanding.tsx`
- Tambahkan prop `onBack?: () => void` dan `isEmbedded?: boolean` pada `KostManagerLandingProps`.
- Perbarui `handleOpenRegistration`:
  ```tsx
  const handleOpenRegistration = () => {
    if (!user) {
      navigate('/login?role=owner&mode=register');
      return;
    }
    setIsModalOpen(true);
  };
  ```
- Perbarui tombol kembali di header dan footer: jika `onBack` diberikan, panggil `onBack()`, jika tidak panggil `navigate(-1)`.
- Jika `isEmbedded` aktif, sembunyikan drawer dashboard mitra agar navigasi bersih dan menyatu dengan halaman kemitraan.

### Langkah 2: Perbarui `Owner.tsx`
- Impor `KostManagerLanding` dari `./KostManagerLanding`.
- Pada kondisi `partnerType === 'manajemen'`, langsung render:
  ```tsx
  if (partnerType === 'manajemen') {
    return (
      <KostManagerLanding 
        user={user} 
        onBack={() => setPartnerType(null)} 
        isEmbedded={true} 
      />
    );
  }
  ```

### Langkah 3: Uji Kompilasi & Build
- Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 100% bebas error kompilasi.

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat riwayat di `functions/PROGRESS.md` (Fitur #222).
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji 1-Klik Langsung ke Landing Page KostManager**:
   - Buka `/owner` dan klik tombol **"PILIH KOST MANAGER ->"**.
   - Verifikasi bahwa halaman **seketika langsung memuat Landing Page KostManager Lengkap** (Hero Video, Pain Points, Solusi Autopilot, Fitur Unggulan, Paket Harga) tanpa ada halaman perantara banner.
2. **Uji Action Button (Kondisi Belum Login)**:
   - Klik tombol *"Mulai Auto-Pilot Kost Sekarang"* atau *"Langganan KostManager Sekarang"*.
   - Verifikasi langsung diarahkan ke `/login?role=owner&mode=register` untuk membuat akun mitra terlebih dahulu.
3. **Uji Action Button (Kondisi Sudah Login)**:
   - Login akun mitra, klik tombol aksi -> verifikasi modal pendaftaran paket terbuka.
4. **Uji Tombol Kembali**:
   - Klik *"Kembali ke Pilihan Kemitraan"* -> verifikasi kembali ke layar pilihan awal 2 kartu.
5. **Uji Build**:
   - Jalankan `npm run build` dan pastikan hasil `0 error`.
