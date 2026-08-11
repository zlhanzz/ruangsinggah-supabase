const fs = require('fs');
const path = require('path');

const progressFile = path.join(__dirname, '../PROGRESS.md');
let content = fs.readFileSync(progressFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const insertionText = `### 1. Sistem Multi-Tarif, Fasilitas Kustom, & Sub-Fasilitas WC Dinamis (Agustus 2026)
- **Modul Skema Tarif / Harga Kamar Fleksibel**:
  * Menambahkan editor profil multi-tarif dinamis (\`pricing: [{ period, price }]\`) pada form penambahan dan pengeditan kamar di Langkah 2 Wizard.
  * Mendukung pengaturan harga berbasis periode kustom: **Bulanan**, **3 Bulan**, **6 Bulan**, **Tahunan**, **Mingguan**, dan **Harian**.
  * Menerapkan logika kelipatan default (12x harga bulanan) jika tarif tahunan tidak diisi secara eksplisit.
- **Fasilitas Kamar Mandi Dalam Beranak & Kustom**:
  * Memindahkan modul Fasilitas Kamar agar selalu muncul baik untuk kamar status Terisi maupun Kosong.
  * Menggeser opsi checklist **Kamar Mandi Dalam** ke posisi paling akhir pada daftar utama untuk kerapian tata letak.
  * Menyediakan sub-checklist kelengkapan fasilitas kamar mandi dalam secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah untuk mendata kelengkapan fasilitas WC kustom secara bebas.
- **Fasilitas WC Umum Beranak & Kustom pada Wizard Properti (Langkah 1)**:
  * Menambahkan opsi **WC Umum** pada checklist Fasilitas Umum Properti.
  * Menyediakan sub-checklist kelengkapan WC Umum secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, **Bak Mandi**, **Cermin**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah kelengkapan WC Umum kustom yang secara dinamis tersimpan ke dalam JSONB \`metadata.publicBathroomFacilities\` pada tabel \`properties\` dan \`mitra_kostmanager\`.
- **Pembaruan Skema Database**:
  * Menambahkan kolom \`metadata\` (\`JSONB DEFAULT '{}'\`) pada tabel \`mitra_kostmanager\` di [supabase_schema.sql](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/supabase_schema.sql) untuk menyimpan properti metadata kustom secara aman.

`;

// Insert right under "## Fitur Selesai (Completed Features)"
const targetHeader = `## Fitur Selesai (Completed Features)\n\n`;
if (content.includes(targetHeader)) {
  content = content.replace(targetHeader, targetHeader + insertionText);
  console.log("PROGRESS.md successfully updated.");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, content, 'utf8');
