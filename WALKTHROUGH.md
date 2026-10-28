# WALKTHROUGH: Perbaikan Tampilan Default Tombol KostManager Menjadi "Silahkan Pilih Kamar Tersedia"

## Ringkasan Eksekusi
Telah diselesaikan perbaikan tampilan tombol default pada properti yang dikelola melalui **KostManager** ([KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)). Saat calon penyewa pertama kali membuka halaman kost yang memiliki kamar kosong, tombol utama di sidebar kini **BUKAN lagi bertuliskan "Kamar Penuh" (disabled abu-abu)**, melainkan tombol aktif oranye cerah bertuliskan **"Silahkan Pilih Kamar Tersedia"**.

---

## 1. Detail Perubahan Kode

### `functions/public/pages/KostDetail.tsx`
1. **Penambahan State Pelacak Kamar Eksplisit**:
   ```typescript
   const [hasSelectedSpecificRoom, setHasSelectedSpecificRoom] = useState(false);
   ```
2. **Penyelesaian `selectedChildRoom` yang Akurat**:
   ```typescript
   const selectedChildRoom = hasSelectedSpecificRoom
     ? (currentParentGroup?.rooms.find(r => r.variantIdx === selectedVariantIdx) || null)
     : null;
   ```
   Sebelumnya, saat awal muat, sistem langsung mengambil `currentParentGroup?.rooms[0]`. Jika kamar pertama kebetulan sedang terisi (`isAvailable: false`), sistem langsung menganggap tipe kamar tersebut penuh. Dengan perubahan ini, kamar terisi tidak lagi otomatis tercentang sepihak di awal muat.

3. **Logika Tombol Aksi Utama**:
   ```typescript
   const hasAvailableInGroup = isManaged ? Boolean(currentParentGroup?.isAvailable) : false;
   const isAvailable = isManaged
     ? hasAvailableInGroup
     : Boolean(selectedRoom && selectedRoom.isAvailable !== false);

   const buttonText = isUnpublished
     ? 'Pratinjau (Belum Tayang)'
     : isManaged
       ? (!hasAvailableInGroup
           ? 'Kamar Penuh'
           : (!hasSelectedSpecificRoom || !selectedChildRoom || !selectedChildRoom.isAvailable)
             ? 'Silahkan Pilih Kamar Tersedia'
             : `Ajukan Sewa ${selectedChildRoom.displayName}`)
       : (!isAvailable
           ? 'Kamar Penuh'
           : `Ajukan Sewa (${periodLabels[selectedPeriod] || selectedPeriod})`);
   ```

4. **Interaktivitas Tombol Utama (Smooth Scroll & Highlight)**:
   ```typescript
   const handleMainActionClick = () => {
     if (isUnpublished) {
       alert('Ini adalah mode pratinjau pemilik...');
       return;
     }

     if (isManaged && (!hasSelectedSpecificRoom || !selectedChildRoom || !selectedChildRoom.isAvailable)) {
       const roomSelectorElem = document.getElementById('pilih-nomor-kamar-section');
       if (roomSelectorElem) {
         roomSelectorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
         roomSelectorElem.classList.add('ring-4', 'ring-orange-500/50', 'ring-offset-2', 'bg-orange-50/70');
         setTimeout(() => {
           roomSelectorElem.classList.remove('ring-4', 'ring-orange-500/50', 'ring-offset-2', 'bg-orange-50/70');
         }, 1500);
       }
       return;
     }

     handleBookingClick();
   };
   ```

5. **Pilihan Nomor Kamar di Grid**:
   - Menambahkan `id="pilih-nomor-kamar-section"` pada kontainer pilihan nomor kamar.
   - Saat calon penyewa mengeklik nomor kamar di grid:
     `setHasSelectedSpecificRoom(true)` aktif, chip kamar tercentang oranye, dan tombol seketika berganti menjadi **"Ajukan Sewa [Nama/Nomor Kamar]"**.
   - Saat berpindah tipe kamar (`setSelectedParentTypeIdx`), `hasSelectedSpecificRoom` di-reset ke `false` agar alur pemandu tetap berjalan rapi di tipe yang baru.

---

## 2. Hasil Verifikasi & Pengujian

### A. Uji Kompilasi Build Frontend
```bash
cmd.exe /c "npm --prefix functions/public run build"
```
- **Hasil**: **LULUS 100% (Exit code 0)**.
- `✓ 2512 modules transformed.`
- `✓ built in 30.73s`.
- 0 error, 0 warning fatal.

### B. Uji Kompilasi Build Backend
```bash
cmd.exe /c "npm --prefix functions run build"
```
- **Hasil**: **LULUS 100% (Exit code 0)**.
- TypeScript compiler (`tsc`) berhasil tanpa error.

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. Buka halaman detail kost yang terdaftar di **KostManager** (memiliki unit-unit nomor kamar individual).
2. Perhatikan tombol aksi utama di sidebar kanan:
   - **Ekspektasi Default**: Tombol tampil berwarna **oranye cerah** bertuliskan **"SILAHKAN PILIH KAMAR TERSEDIA"** (bukan "KAMAR PENUH" abu-abu).
3. Klik tombol **"SILAHKAN PILIH KAMAR TERSEDIA"**:
   - Layar akan melakukan *smooth scroll* otomatis ke blok **PILIH NOMOR KAMAR** dan menyorot grid nomor kamar dengan kilatan oranye lembut.
4. Klik salah satu nomor kamar yang tersedia di grid (misal: "Kamar 01" atau "Kamar 102"):
   - Chip kamar terpilih dengan tanda centang.
   - Tombol utama seketika bertransformasi menjadi **"AJUKAN SEWA [KAMAR]"**.
5. Klik tombol tersebut: modal formulir sewa langsung terbuka untuk kamar yang dipilih.
