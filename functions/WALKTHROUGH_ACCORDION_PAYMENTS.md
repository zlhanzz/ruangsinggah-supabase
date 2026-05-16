# WALKTHROUGH: Categorized Accordion Payment Methods

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Categorization Mapping**: Menambahkan sistem label kategori pada setiap metode pembayaran:
    *   `qris`: QRIS.
    *   `ewallet`: ShopeePay.
    *   `va`: Bank Virtual Account (BRI, BNI, BCA, Mandiri, dll).
    *   `retail`: Alfamart & Indomaret.
    *   `paylater`: Akulaku & Kredivo.
    *   `card`: Kartu Kredit.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Sistem Accordion Interaktif**: Mengubah daftar pembayaran yang panjang menjadi grup-grup kategori yang rapi.
*   **Urutan Prioritas (Custom Order)**: Mengatur urutan tampilan sesuai permintaan:
    1.  **QRIS All Payment** (Tampil paling atas).
    2.  **E-Wallet**.
    3.  **Virtual Account**.
    4.  **Lainnya** (Minimarket, Paylater, Kartu Kredit).
*   **Default State**: Kategori **QRIS** akan terbuka secara otomatis saat pertama kali dibuka untuk memudahkan user melakukan scan cepat.
*   **Aesthetic Headers**: Setiap kategori memiliki header dengan ikon dan indikator panah yang bergerak halus saat dibuka/ditutup.

## Hasil Pengujian
User sekarang tidak lagi melihat daftar 10+ bank sekaligus yang membingungkan. UI terlihat jauh lebih bersih dan profesional. User yang ingin membayar via VA cukup mengklik kategori "Virtual Account" untuk melihat daftar bank lengkapnya.

## Petunjuk Deploy
Jalankan perintah berikut untuk mengaktifkan sistem kategori ini:
```bash
npm run build
firebase deploy --only functions
```
Pastikan backend di-deploy agar metadata kategori dari server dapat diterima oleh frontend dengan benar.
