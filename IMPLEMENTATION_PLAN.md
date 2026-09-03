# IMPLEMENTATION PLAN: Pembaruan Akurasi Ikon SVG Fasilitas Umum & Fasilitas Kamar di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Pada seksian *Fasilitas Umum*, sub-kelengkapan seperti *Kompor*, *Kulkas Bersama*, *Wastafel Cuci Piring*, *Peralatan Masak*, *Dispenser Air*, dan *Parkir Motor* masih menggunakan ikon centang generik (`<Check />`).
  - Beberapa fasilitas kamar dan gedung juga masih menggunakan fallback centang (`<CheckCircle2 />`).
- **Tujuan**:
  - Mengganti seluruh ikon centang generik dengan **ikon vector SVG murni yang akurat dan presisi** dari paket `lucide-react` (seperti `<Flame />` untuk Kompor, `<Refrigerator />` untuk Kulkas, `<UtensilsCrossed />` untuk Peralatan Masak, `<Droplets />` untuk Wastafel/Dispenser, `<Bike />` untuk Parkir Motor, `<Car />` untuk Parkir Mobil, `<ShowerHead />` untuk Shower, `<Fan />` untuk Kipas Angin, `<KeyRound />` untuk Akses 24 Jam, dll.).
  - Memastikan gaya visual (warna oranye/biru/amber dengan rounded container yang halus) seragam, rapi, dan konsisten di seluruh halaman detail.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Parser ikon fasilitas umum & fasilitas kamar)

---

## 3. Langkah-Langkah Eksekusi
1. **Pembuatan Icon Resolver Terpadu & Akurat (`getFacilityIcon`)**:
   - Menambahkan helper fungsi yang memetakan nama fasilitas ke ikon SVG `lucide-react` yang sangat spesifik dan akurat:
     - Dapur & Masak: `Flame` (Kompor/Gas), `Refrigerator` (Kulkas), `UtensilsCrossed` (Peralatan Masak), `Utensils` (Peralatan Makan), `Droplets` (Wastafel/Dispenser/Air), `CookingPot` (Rice Cooker/Panci), `Zap` (Microwave).
     - Parkir: `Bike` (Parkir Motor/Sepeda), `Car` (Parkir Mobil/Garasi), `ShieldCheck` (Parkir Gratis/Aman).
     - Kamar Mandi: `Bath` (Kamar Mandi/Bak), `ShowerHead` (Shower), `Droplets` (Wastafel/Gayung/Air Panas), `Flame` / `ThermometerSun` (Water Heater).
     - Kamar Tidur: `Bed` (Kasur/Springbed), `Layers` (Lemari/Storage/Rak), `Armchair` (Meja/Kursi), `Wind` (AC/Ventilasi), `Fan` (Kipas Angin), `Tv` (TV), `Sun` / `AppWindow` (Jendela/Balkon).
     - Gedung & Keamanan: `Wifi` (WiFi), `Camera` (CCTV), `ShieldCheck` (Security), `KeyRound` / `Clock` (Akses 24 Jam), `Shirt` (Laundry), `Sun` (Jemuran/Rooftop), `Building2` (Lift), `Dumbbell` (Gym).
2. **Penerapan pada Sub-Kelengkapan Fasilitas Umum**:
   - Mengganti `<Check />` pada chips sub-kelengkapan Dapur Bersama, Area Parkir, WC Umum, dan Ruang Tamu menjadi ikon SVG spesifik hasil resolve `getFacilityIcon(sub)`.
3. **Penerapan pada Fasilitas Kamar & Gedung**:
   - Memastikan seluruh item fasilitas kamar dan fasilitas mandiri menggunakan ikon spesifik tanpa centang generic.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 298 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) pada layar desktop dan mobile.
- Memeriksa chips pada *Dapur Bersama* (Kompor = Api/Flame, Kulkas = Refrigerator, Wastafel = Droplets, Alat Masak = Utensils, Dispenser = Droplets/Cup).
- Memeriksa chips pada *Area Parkir* (Parkir Motor = Bike, Parkir Mobil = Car).
- Memeriksa bahwa tidak ada lagi ikon centang generik pada kartu fasilitas.
