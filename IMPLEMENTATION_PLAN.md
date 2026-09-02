# IMPLEMENTATION PLAN: Perbaikan ReferenceError AlertCircle pada KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Penyebab Error**:
  Pada baris 2094 di `KostDetail.tsx`, komponen ikon `<AlertCircle />` digunakan untuk menampilkan badge peringatan kamar bertipe "Kosongan (Tanpa Perabot)":
  ```tsx
  <AlertCircle size={14} className="text-amber-600 shrink-0" />
  ```
  Namun, pada baris 13–20 (bagian import), `AlertCircle` belum disertakan dalam daftar impor dari package `lucide-react`.
  Hal ini memicu error browser:
  `Uncaught ReferenceError: AlertCircle is not defined at KostDetail (KostDetail.tsx:2094:26)`.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/pages/KostDetail.tsx`.
- **Proteksi Logika**: Menambahkan `AlertCircle` ke dalam daftar impor `lucide-react` tanpa mengubah struktur logika komponen lainnya.

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `KostDetail.tsx` (baris 13–20)**:
   - Tambahkan `AlertCircle` ke dalam impor `lucide-react`:
     ```tsx
     import { 
       Bed, Home, Camera, Sparkles, CheckCircle2, ChevronDown, Layers, Flag, 
       ShieldAlert, AlertTriangle, AlertCircle, X, Check, Upload, Image as ImageIcon, Send, 
       Phone, User as UserIcon, MessageSquare, Clock, Wifi, CookingPot, Car, 
       Bike, Bath, ShieldCheck, KeyRound, Shirt, Sun, Building2, Armchair, 
       Wind, Tv, Droplets, Utensils, Refrigerator, Lock, MapPin, Navigation, 
       GraduationCap, RotateCcw
     } from 'lucide-react';
     ```

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Halaman Detail Kost**:
   - Membuka halaman detail kost dengan kamar kosongan untuk memastikan icon `AlertCircle` ter-render sempurna tanpa error ReferenceError.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
