# Rencana Implementasi: Perbaikan Scanner Landmark Mikro (Eliminasi False-Positive 'Mobil' & 'Bintang Khalifah', Serta Penajaman Deteksi Minimarket & SPBU Terdekat)

Dokumen ini merinci rencana investigasi, eliminasi anomali deteksi, serta penguatan logika pemindai fasilitas mikro (*Micro Landmark Scanner*) pada antarmuka input properti mitra dan agen.

---

## 1. Analisis Masalah & Investigasi Akar Masalah

Berdasarkan pengujian pada lokasi kost baru dan bukti tangkapan layar yang dilampirkan:
1. **Munculnya Landmark Anomali 'Mobil' (0.4 km) & Hilangnya SPBU Terdekat**:
   - **Penyebab**: Pada fungsi `isValidMicroFacility('gas_station', place)`, pemeriksaan mengizinkan tempat lolos jika Google Places mengembalikan `types.includes('gas_station')` tanpa mewajibkan nama tempat mengandung kata kunci SPBU resmi. Di Indonesia, jaringan SPBU mini ExxonMobil atau bengkel pelumas terdaftar di Google Maps dengan nama tunggal **"Mobil"** (atau "Mobil 1").
   - Karena tempat bernama "Mobil" tersebut berjarak sangat dekat (0.4 km), ia mengalahkan SPBU Pertamina resmi (yang berjarak 0.8 km s/d 1.5 km) dalam pengurutan jarak murni `sort((a, b) => a.kmVal - b.kmVal)`.
   - Dengan pemotongan `.slice(0, 1)`, SPBU resmi terbuang dan yang muncul di kartu form adalah landmark aneh bernama "Mobil".
2. **Munculnya Landmark Anomali 'Bintang khalifah' (0.2 km) & Hilangnya Minimarket Terdekat**:
   - **Penyebab**: Pada fungsi `isValidMicroFacility('minimarket', place)`, validasi memperbolehkan tempat masuk jika memiliki `hasType` (`convenience_store`, `supermarket`, `grocery_or_supermarket`) atau kata generik seperti `'toko'`.
   - Entitas lokal non-minimarket (seperti toko busana muslim, toko kelontong rumahan, atau lembaga yang terdaftar sebagai toko serba ada) bernama **"Bintang khalifah"** memiliki tag tersebut dan berada di jarak 0.2 km (sangat dekat).
   - Akibatnya, "Bintang khalifah" (0.2 km) mengalahkan gerai **Indomaret / Alfamart / Alfamidi** nyata terdekat (yang mungkin berjarak 0.5 km) dan terpilih sebagai satu-satunya minimarket melalui `.slice(0, 1)`.

---

## 2. Dampak Perubahan File

Perubahan difokuskan secara presisi pada logika pemindaian dan sanitasi landmark di 2 file utama:
1. `functions/public/components/KostFormMitra.tsx`:
   - Formulir pendaftaran dan edit properti oleh Mitra Kost.
2. `functions/public/pages/AgentDashboard.tsx`:
   - Formulir input dan kurasi listing KostManager oleh Agen / Tim Operasional RuangSinggah.

---

## 3. Rencana Langkah-Langkah Eksekusi

### Langkah 1: Penguatan Sanitasi Global (`isGarbageFacility`)
- Menambahkan aturan penolakan mutlak untuk:
  - Nama tunggal `'mobil'` atau `'mobil 1'` (yang tidak disertai kata 'spbu', 'pom', atau 'indostation').
  - Usaha otomotif/rental: `'rental mobil'`, `'sewa mobil'`, `'cuci mobil'`, `'variasi mobil'`, `'showroom'`.
  - Entitas non-publik: `'bintang khalifah'`, `'toko baju'`, `'toko pakaian'`, `'toko plastik'`, `'toko beras'`, `'toko bangunan'`, `'toko emas'`, `'warung sembako'`, `'paud'`, `'kb '`.

### Langkah 2: Pengetatan Validasi Fasilitas Mikro (`isValidMicroFacility`)
- **Kategori `minimarket`**:
  - Mewajibkan nama tempat (`name`) secara eksplisit mengandung merek ritel resmi atau kata minimarket:
    `'indomaret'`, `'alfamart'`, `'alfamidi'`, `'circle k'`, `'familymart'`, `'family mart'`, `'lawson'`, `'super indo'`, `'superindo'`, `'hypermart'`, `'minimarket'`, `'mini market'`, `'swalayan'`, atau akhiran `' mart'`.
  - Menghapus kata kunci longgar seperti `'toko'` dan `'toko kelontong'` agar warung/toko biasa tidak menyamar sebagai minimarket.
  - `hasType` dari Google Places **tidak boleh** meloloskan tempat jika namanya tidak cocok dengan kata kunci ritel di atas.
  - Blacklist kata non-minimarket: `'bintang'`, `'khalifah'`, `'busana'`, `'baju'`, `'pakaian'`, `'distributor'`, `'grosir'`.
- **Kategori `gas_station`**:
  - Mewajibkan nama tempat mengandung identitas SPBU resmi:
    `'spbu'`, `'pertamina'`, `'shell'`, `'bp '`, `'bp-'`, `'pom bensin'`, `'vivo'`.
  - Jika nama memuat kata `'mobil'`, wajib disertai kata `'spbu'`, `'pom'`, atau `'indostation'` (contoh: *"SPBU Mobil Indostation"*), dan menolak keras nama yang hanya berbunyi *"Mobil"*.
  - Menolak mutlak `'pertamini'`, `'eceran'`, `'pom mini'` (kios bensin botolan tidak resmi).

### Langkah 3: Penerapan Sistem Prioritas Bertingkat (*Tiered Priority Ranking*)
- **Minimarket**:
  - **Tier 1 (Ritel Nasional Terverifikasi)**: Indomaret, Alfamart, Alfamidi, Circle K, FamilyMart, Lawson, Super Indo.
  - **Tier 2 (Minimarket/Swalayan Independen)**: Memuat kata "minimarket", "swalayan".
  - Logika seleksi: Jika ada Tier 1 dalam radius toleransi (hingga 3.5 km), pilih yang paling dekat dari Tier 1. Jika tidak ada sama sekali, baru gunakan Tier 2 terdekat.
- **SPBU / Pom Bensin**:
  - **Tier 1 (SPBU Resmi Nasional)**: Pertamina, Shell, BP, Vivo, atau diawali "SPBU".
  - **Tier 2 (SPBU Mikro Terverifikasi)**: Indostation Mobil resmi.
  - Logika seleksi: Utamakan SPBU resmi Pertamina/Shell/BP terdekat (radius hingga 5.0 km).

### Langkah 4: Penguatan Query Penelusuran Google Places
- Menambahkan query penelusuran paralel:
  - Minimarket: menambahkan penelusuran eksplisit `keyword: 'alfamidi'`.
  - SPBU: menambahkan penelusuran eksplisit `keyword: 'pertamina'`.
- Menyesuaikan batas radius filter agar ramah kawasan perumahan/suburban:
  - Minimarket: radius toleransi hingga `3.5 KM`.
  - SPBU: radius toleransi hingga `5.0 KM`.

---

## 4. Rencana Verifikasi & Pengujian

1. **Uji Kompilasi Kode**:
   - Menjalankan `cmd /c npm run build` pada `functions/public` untuk memastikan 0 error kompilasi Vite dan TypeScript.
2. **Uji Simulasi Sanitasi & Filter**:
   - Memastikan nama "Mobil" tereliminasi 100% dan digantikan oleh SPBU Pertamina/Shell terdekat.
   - Memastikan nama "Bintang khalifah" tereliminasi 100% dan digantikan oleh Indomaret/Alfamart/Alfamidi terdekat.
3. **Pencatatan Riwayat & Git**:
   - Mencatat progres ke `functions/PROGRESS.md` (Entri #331).
   - Menerbitkan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.
