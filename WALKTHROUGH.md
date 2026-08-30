# Walkthrough: Penyelarasan Scroll & Sticky Section Booking (Desktop vs Mobile)

Dokumen ini mendokumentasikan implementasi dan hasil verifikasi penyesuaian perilaku *scroll* dan *sticky* pada card booking halaman detail kost ([`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)).

---

## 1. Daftar Perubahan

### A. Penyelarasan Responsive Breakpoint pada Sidebar Booking (`KostDetail.tsx`)
- Mengisolasi properti `sticky`, batas tinggi `max-h-[calc(100vh-5.5rem)]`, `overflow-y-auto`, dan `overscroll-contain` agar **hanya aktif pada breakpoint desktop** (`lg:` $\ge 1024\text{px}$).
- **Di Desktop (`lg:` ke atas)**:
  - Sidebar booking tetap bersifat *sticky* (`lg:sticky lg:top-20`) dan memiliki scroll internal mandiri (`lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain`) dengan scrollbar ramping oranye (`lg:scrollbar-thin lg:scrollbar-thumb-orange-200`).
  - Pengguna desktop dapat menggulir seluruh form booking di kolom kanan tanpa menggerakkan konten di sebelah kiri.
- **Di Mobile (`< lg` / Ponsel & Tablet)**:
  - Pembatasan tinggi dinonaktifkan (`max-h-none`), *overflow* bernilai *visible*, dan posisi bersifat normal (*static*).
  - Gestur sentuh jari (*touch swipe*) pengguna ponsel dapat menggulir halaman secara alami ke bawah maupun ke atas tanpa terperangkap di dalam card booking (*Zero Scroll Trapping*).

```diff
           {/* Right Sidebar - Booking Card */}
           <div className="relative">
-            <div className="sticky top-20">
-              <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain pr-4 lg:pr-5 scrollbar-thin scrollbar-thumb-orange-200">
+            <div className="lg:sticky lg:top-20">
+              <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200">
                 <div className="mb-6">
```

---

## 2. Hasil Pengujian & Kompilasi

Kompilasi build produksi Vite (`functions/public/`):
```text
> vite build
✓ 2531 modules transformed.
✓ built in 19.87s
Status: 0 errors / Lulus 100%
```

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Guide)

### Skenario 1: Pengujian Tampilan Mobile (Ponsel / Layar < 1024px)
1. Buka browser di perangkat ponsel atau gunakan mode responsive DevTools (misal ukuran 375px atau 412px).
2. Kunjungi halaman detail kost (misal Kost Madani atau properti lainnya).
3. Gulir ke bawah hingga masuk ke card booking (area pilihan kamar, fasilitas, dan tombol ajukan sewa).
4. Lakukan gestur sentuh / *swipe* ke atas dari area mana saja di dalam card booking:
   - **Ekspektasi**: Layar langsung bergulir kembali ke atas dengan mulus menuju galeri foto dan informasi kost tanpa tersendat atau terjebak di dalam card.

### Skenario 2: Pengujian Tampilan Desktop (Layar $\ge$ 1024px)
1. Buka halaman detail kost di browser desktop.
2. Perhatikan kolom kanan (card booking):
   - Card booking tetap *sticky* mengikuti layar saat konten sebelah kiri digulir.
   - Jika daftar kamar / pilihan durasi panjang, arahkan kursor ke dalam card dan lakukan *mouse wheel scroll*. Card booking dapat di-scroll internal secara mandiri tanpa merusak tata letak halaman utama.
