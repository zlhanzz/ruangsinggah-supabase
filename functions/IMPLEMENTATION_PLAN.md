# IMPLEMENTATION PLAN: Perbaikan Runtime ReferenceError TDZ 'residentStatus' pada MyKost.tsx

## 1. Analisis Masalah & Kebutuhan

### A. Gejala Error
Saat pengguna membuka rute `/my-bookings` (menu Orders), aplikasi mengalami crash fatal front-end dengan pesan:
```
MyKost.tsx:322
Uncaught ReferenceError: Cannot access 'residentStatus' before initialization
    at MyKost (MyKost.tsx:322:28)
```

### B. Akar Masalah Teknis (Root Cause)
1. Pada `functions/public/pages/MyKost.tsx`, hook `useEffect` untuk sinkronisasi tab URL dan smart context-aware tab defaulting berada di **baris 305–322**:
   ```typescript
   useEffect(() => {
       ...
   }, [tabParam, loading, residentStatus.length, navigate]); // Baris 322
   ```
2. Dependency array pada baris 322 mengakses `residentStatus.length`.
3. Namun, variabel state `residentStatus` dideklarasikan menggunakan `const [residentStatus, setResidentStatus] = useState<any[]>([]);` jauh di bawah pada **baris 371**.
4. Dalam spesifikasi ECMAScript (JavaScript/TypeScript), variabel yang dideklarasikan dengan `const` atau `let` berada dalam zona **Temporal Dead Zone (TDZ)** sejak awal *scope* hingga baris deklarasi dieksekusi.
5. Saat React merender komponen `MyKost`, React mengevaluasi argumen hook (termasuk *dependency array*) dari atas ke bawah. Saat mengeksekusi baris 322, variabel `residentStatus` belum diinisialisasi, sehingga melempar `ReferenceError: Cannot access 'residentStatus' before initialization`.

---

## 2. Komparasi & Evaluasi Standar Industri Objektif (Anti-Bias Konfirmasi)

Mengacu pada Pasal 8 Aturan Baku Workspace:

| Dimensi | Solusi Saat Ini (Sebelum Perbaikan) | Pendekatan Solusi yang Direncanakan | Klasifikasi Standar Industri | Alasan Teknis & Rekomendasi Terbaik |
| :--- | :--- | :--- | :--- | :--- |
| **Arsitektur & Struktur State React** | Deklarasi state tersebar secara acak di tengah-tengah fungsi dan hook komponen | Mengonsolidasikan seluruh *primary state hooks* di blok teratas komponen fungsi (`top of component`) sebelum helper / lifecycle effects | 🌟 **Setara Standar Industri (*Industry Standard*)** | Mengikuti *Rules of Hooks* resmi React dan panduan gaya Airbnb/Google TypeScript di mana semua deklarasi `useState` utama wajib diletakkan di puncak komponen sebelum hook turunan (`useEffect`, `useCallback`) yang mengonsumsinya. |
| **Keandalan Runtime & Pencegahan TDZ** | Mengalami *uncaught runtime exception* saat mount awal | Mengeliminasi TDZ dengan meletakkan `useState(residentStatus)` pada baris 225 bersama `activeKosts` | 🌟 **Setara Standar Industri (*Industry Standard*)** | Menjamin 100% determinisme inisialisasi variabel sehingga hook dan dependency array selalu mengakses referensi yang valid pada setiap siklus render. |

---

## 3. Dampak Perubahan (Scope & Affected Files)

- **File yang Dimodifikasi:**
  - `functions/public/pages/MyKost.tsx`
- **Tingkat Risiko:** Sangat Rendah (*Zero Logic Risk*).
  - Perubahan murni reposisi deklarasi variabel state `residentStatus` dari baris 371 ke baris 225 di puncak komponen `MyKost`.
  - Tidak ada perubahan skema database, tidak ada penghapusan state, dan tidak ada pengubahan logika bisnis.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Pindahkan Deklarasi State `residentStatus`**:
   - Di `functions/public/pages/MyKost.tsx`, letakkan:
     ```typescript
     const [residentStatus, setResidentStatus] = useState<any[]>([]);
     ```
     tepat di bawah `const [activeKosts, setActiveKosts] = useState<any[]>([]);` (di puncak komponen).
   - Hapus baris deklarasi duplikat pada baris 371.
2. **Kompilasi & Build Frontend**:
   - Jalankan `npm.cmd --prefix functions/public run build` untuk memverifikasi 0 error kompilasi.
3. **Pencatatan Progres**:
   - Catat perbaikan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
4. **Push ke Git**:
   - Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Kompilasi TypeScript / Vite**:
   - `npm run build` wajib lulus dengan 0 warning TDZ dan 0 error.
2. **Uji Runtime di Browser**:
   - Buka menu Orders (`/my-bookings`) saat login.
   - Konfirmasi tidak ada lagi `ReferenceError: Cannot access 'residentStatus' before initialization` di console.
   - Konfirmasi halaman langsung memuat tab "AKTIF" dan menampilkan kartu sewa pengguna dengan mulus.
