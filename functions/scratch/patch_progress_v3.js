const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../PROGRESS.md');
let code = fs.readFileSync(targetFile, 'utf8');

const insertTarget = `### 25. Opsi Fasilitas Kamar Kosongan (Tanpa Perabot) dengan Logika Eksklusif (Agustus 2026)
- **Masalah**: Agen survey membutuhkan input yang dapat mendeskripsikan secara jelas apabila suatu tipe kamar kost didata dalam keadaan "kosongan" (sama sekali tidak memiliki perabot seperti kasur, lemari, meja belajar, dll.).
- **Perbaikan**:
  * Menambahkan opsi **"Kosongan (Tanpa Perabot)"** pada daftar checklist standar di bagian Fasilitas Kamar di Wizard Step 2.
  * Mengimplementasikan logika interaksi eksklusif:
    * Jika agen menentang status kosong dengan mencentang **"Kosongan (Tanpa Perabot)"**, maka seluruh checkbox fasilitas perabot lainnya (Kasur, Lemari, Meja Belajar, AC, Kipas Angin, Water Heater) otomatis akan ter-uncheck (dihapus).
    * Sebaliknya, jika agen mencentang salah satu perabot fisik, opsi **"Kosongan (Tanpa Perabot)"** otomatis akan ter-uncheck.
  * Opsi ini dikecualikan dari bagian custom input agar data tersimpan dengan rapi tanpa duplikasi.`;

const insertion = `### 25. Panel Kontrol Eksklusif "Kosongan vs Furnished" dengan Visual Menarik & Dinamis (Agustus 2026)
- **Masalah**: Centang "Kosongan" di tengah-tengah fasilitas lain terlihat kaku dan kurang mencerminkan alur pendataan modern.
- **Perbaikan**:
  * Mengganti checkbox "Kosongan" dengan **Segmented Pill Switcher (Pill Toggle)** yang diletakkan di bagian atas panel fasilitas kamar (berupa pilihan **[Kosongan]** vs **[Furnished (Isian)]**).
  * Menampilkan visualisasi canggih: Ketika opsi **[Kosongan]** aktif, semua checkbox fasilitas perabot fisik (Kasur, Lemari, Meja Belajar, AC, Kipas Angin, Water Heater) secara dinamis berubah menjadi **setengah transparan (low opacity - 40%)** dan **dinonaktifkan (disabled / pointer-events-none)**.
  * Memungkinkan input tata letak struktural (Kamar Mandi Dalam, Jendela Luar, Dapur Dalam) tetap dapat diisi meskipun status kamar adalah Kosongan.
  * Menjaga kompatibilitas data dengan Supabase: status "Kosongan (Tanpa Perabot)" tetap tersimpan dengan format array yang sama agar terintegrasi sempurna dengan halaman detail properti di sisi pengguna.`;

if (code.includes(insertTarget)) {
    code = code.replace(insertTarget, insertion);
    console.log("PROGRESS.md successfully updated with entry 25 v2.");
} else {
    // try LF
    const insertTargetLF = insertTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(insertTargetLF)) {
        code = codeLF.replace(insertTargetLF, insertion);
        console.log("PROGRESS.md (LF) successfully updated with entry 25 v2.");
    } else {
        console.error("ERROR: insertTarget not found in PROGRESS.md!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done patching PROGRESS.md.");
