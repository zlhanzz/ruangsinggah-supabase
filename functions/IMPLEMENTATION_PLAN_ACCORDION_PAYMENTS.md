# IMPLEMENTATION PLAN: Categorized & Accordion Payment Methods

## Analisis Masalah
Dengan bertambahnya metode pembayaran (10+ pilihan), daftar yang memanjang ke bawah membuat user kewalahan (decision fatigue). User menginginkan pengelompokan (kategorisasi) yang rapi dan dapat di-minimize (accordion) untuk meningkatkan kenyamanan navigasi.

## Solusi: Accordion Category UI
1. **Categorization**: Menambahkan field `category` pada setiap metode pembayaran di backend.
2. **Ordered Sections**: Mengatur urutan tampilan sesuai permintaan: QRIS -> E-Wallet -> Virtual Account -> Lainnya.
3. **Accordion Interaction**: Membuat komponen kategori yang dapat dibuka/tutup, sehingga UI tetap ringkas.

## Langkah-Langkah Eksekusi

### 1. Backend Update (`functions/src/index.ts`)
*   Tambahkan field `category` pada array `MASTER_PAYMENT_METHODS`.
*   Kategori yang akan digunakan: `qris`, `ewallet`, `va`, `retail`, `paylater`, `card`.

### 2. Frontend Update (`public/components/PaymentGateway.tsx`)
*   Buat state `expandedCategories` untuk melacak kategori mana yang sedang terbuka.
*   Lakukan pengelompokan `availableMethods` berdasarkan kategori.
*   Ubah rendering daftar metode menjadi struktur kategori (Header Kategori -> List Metode).
*   Tambahkan animasi transisi saat kategori dibuka/ditutup menggunakan Tailwind.

## Urutan Tampilan
1. **QRIS**: Selalu tampil di paling atas.
2. **E-Wallet**: ShopeePay, dll.
3. **Virtual Account**: BRI, BNI, BCA, Mandiri, dll.
4. **Minimarket & Paylater**: Alfamart, Akulaku, dll.

## Rencana Verifikasi
1. Buka Gateway -> Pastikan hanya kategori utama yang terlihat atau kategori pertama terbuka otomatis.
2. Klik "Virtual Account" -> Pastikan daftar bank muncul dengan animasi halus.
3. Pastikan urutan kategori sesuai permintaan user.
