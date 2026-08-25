const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../PROGRESS.md');
let code = fs.readFileSync(targetFile, 'utf8');

const insertTarget = `## Fitur Selesai (Completed Features)

### 23. Ekstraksi Koordinat GPS Otomatis`;

const insertion = `## Fitur Selesai (Completed Features)

### 24. Peringatan Kesesuaian Data Saat Agen Survey Melakukan Migrasi Properti (Agustus 2026)
- **Masalah**: Saat pendataan properti yang sebelumnya terdaftar sebagai Mitra biasa (migrasi) diaktifkan, data-data properti lama (nama, alamat, tipe, dll.) terisi secara otomatis (*pre-filled*). Hal ini berpotensi membuat agen survey langsung melanjutkan proses tanpa meninjau kesesuaian data yang sebenarnya di lapangan.
- **Perbaikan**:
  * Menambahkan overlay pop-up peringatan interaktif bertema peringatan (kuning-oranye) yang memblokir layar wizard pendataan jika terdeteksi bahwa properti yang sedang diedit sudah ada di database (\`existingProp\` ditemukan).
  * Meminta agen untuk mengonfirmasi peninjauan ulang data dengan mengklik tombol **"Saya Mengerti"** sebelum alur pengisian form pendataan diizinkan untuk dilanjutkan.
  * Menyinkronkan status verifikasi peringatan agar direset setiap kali wizard ditutup atau draf baru dibuka.

### 23. Ekstraksi Koordinat GPS Otomatis`;

if (code.includes(insertTarget)) {
    code = code.replace(insertTarget, insertion);
    console.log("PROGRESS.md successfully updated with entry 24.");
} else {
    // try LF
    const insertTargetLF = insertTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(insertTargetLF)) {
        code = codeLF.replace(insertTargetLF, insertion);
        console.log("PROGRESS.md (LF) successfully updated with entry 24.");
    } else {
        console.error("ERROR: insertTarget not found in PROGRESS.md!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done patching PROGRESS.md.");
