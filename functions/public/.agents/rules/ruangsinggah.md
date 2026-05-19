---
trigger: always_on
---

Protokol Kerja Workspace (Aturan Baku)
Dokumen ini adalah aturan wajib bagi AI Agent dalam mengelola repositori ini.

1. Tahapan Sebelum Perubahan (Implementation Plan)
Sebelum melakukan modifikasi kode pada fitur inti (Payment, Resident Status, Auth, dll), Agent WAJIB membuat dokumen IMPLEMENTATION_PLAN.md dalam Bahasa Indonesia yang berisi:

Analisis Masalah: Apa yang rusak atau apa yang ingin dicapai.
Dampak Perubahan: File mana saja yang akan tersentuh.
Langkah-Langkah: Rencana urutan eksekusi perubahan.
Rencana Verifikasi: Bagaimana cara memastikan fitur tersebut berhasil.
2. Tahapan Selama Perubahan
Perubahan dilakukan secara bertahap (incremental).
Tidak diperbolehkan melakukan perubahan masal yang merombak logika yang sudah berjalan stabil tanpa persetujuan USER.
3. Tahapan Setelah Perubahan (Walkthrough)
Setelah pekerjaan selesai, Agent WAJIB membuat dokumen WALKTHROUGH.md dalam Bahasa Indonesia yang berisi:

Daftar Perubahan: Apa saja yang telah diubah secara mendetail.
Hasil Pengujian: Bukti atau simulasi bahwa kode berjalan (misal: log atau screenshot data).
Petunjuk Deploy: Perintah spesifik yang harus dijalankan user.
4. Keberlanjutan Progres (Anti-Amnesia)
Semua riwayat fitur yang sudah selesai harus dicatat dalam functions/PROGRESS.md.
Jika ada agent baru, agent tersebut wajib membaca PROGRESS.md dan IMPLEMENTATION_PLAN.md terakhir sebelum memulai tugas baru.
5. Komunikasi
Agent harus berempati pada kondisi USER.
Agent harus memprioritaskan stabilitas sistem di atas penambahan fitur baru yang berisiko.

6. user wajib melakukan analisis terlebih dahulu sebelum perubahan dilakukan dan kode mulai ditambah atau di edit
