const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../PROGRESS.md');
let code = fs.readFileSync(targetFile, 'utf8');

const insertTarget = `## Fitur Selesai (Completed Features)

### 24. Peringatan Kesesuaian Data Saat Agen Survey Melakukan Migrasi Properti (Agustus 2026)`;

const insertion = `## Fitur Selesai (Completed Features)

### 25. Opsi Fasilitas Kamar Kosongan (Tanpa Perabot) dengan Logika Eksklusif (Agustus 2026)
- **Masalah**: Agen survey membutuhkan input yang dapat mendeskripsikan secara jelas apabila suatu tipe kamar kost didata dalam keadaan "kosongan" (sama sekali tidak memiliki perabot seperti kasur, lemari, meja belajar, dll.).
- **Perbaikan**:
  * Menambahkan opsi **"Kosongan (Tanpa Perabot)"** pada daftar checklist standar di bagian Fasilitas Kamar di Wizard Step 2.
  * Mengimplementasikan logika interaksi eksklusif:
    * Jika agen menentang status kosong dengan mencentang **"Kosongan (Tanpa Perabot)"**, maka seluruh checkbox fasilitas perabot lainnya (Kasur, Lemari, Meja Belajar, AC, Kipas Angin, Water Heater) otomatis akan ter-uncheck (dihapus).
    * Sebaliknya, jika agen mencentang salah satu perabot fisik, opsi **"Kosongan (Tanpa Perabot)"** otomatis akan ter-uncheck.
  * Opsi ini dikecualikan dari bagian custom input agar data tersimpan dengan rapi tanpa duplikasi.

### 24. Peringatan Kesesuaian Data Saat Agen Survey Melakukan Migrasi Properti (Agustus 2026)`;

if (code.includes(insertTarget)) {
    code = code.replace(insertTarget, insertion);
    console.log("PROGRESS.md successfully updated with entry 25.");
} else {
    // try LF
    const insertTargetLF = insertTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(insertTargetLF)) {
        code = codeLF.replace(insertTargetLF, insertion);
        console.log("PROGRESS.md (LF) successfully updated with entry 25.");
    } else {
        console.error("ERROR: insertTarget not found in PROGRESS.md!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done patching PROGRESS.md.");
