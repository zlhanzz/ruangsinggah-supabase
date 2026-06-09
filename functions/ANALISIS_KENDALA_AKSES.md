# ANALISIS KENDALA AKSES DAN LOGIN PENGGUNA (TERUTAMA SAFARI / INDONESIA ISP)

Dokumen ini disusun untuk menganalisis mengapa beberapa pengguna (terutama pengguna browser Safari atau ISP tertentu di Indonesia) mengalami kegagalan saat mengakses atau melakukan login ke aplikasi RuangSinggah, sementara pengguna lain berhasil.

---

## 1. Penyebab Utama Kendala Akses

### A. Blokir DNS ISP Lokal Indonesia (Indihome / Telkomsel)
* **Masalah**: Banyak pengguna di Indonesia menggunakan jaringan Telkomsel atau IndiHome. Server DNS bawaan dari ISP ini sering kali menyaring dan memblokir domain pihak ketiga yang kurang populer atau berstatus subdomain dinamis seperti `*.supabase.co` (dikarenakan pembersihan berkala IP AWS/Fly.io yang terasosiasi dengan konten judi/negatif).
* **Gejala**: Halaman memuat dengan lambat, tombol login tidak merespons, atau muncul error `ERR_CONNECTION_RESET` / `ERR_NAME_NOT_RESOLVED` di konsol browser.
* **Dampak**: Pengguna dengan ISP tertentu sama sekali tidak bisa menghubungi server autentikasi Supabase, sementara pengguna dengan ISP Biznet, XL, atau yang menggunakan DNS Cloudflare (`1.1.1.1`) dapat menggunakan aplikasi dengan lancar.

### B. Kebijakan Privasi Safari - Intelligent Tracking Prevention (ITP)
* **Masalah**: Safari menerapkan fitur *Intelligent Tracking Prevention* (ITP) yang sangat agresif. Fitur ini memblokir akses penyimpanan data antar-domain (cross-origin storage & cookies).
* **Gejala**: Pengguna berhasil login, namun ketika halaman di-refresh, mereka otomatis logout kembali. Atau link konfirmasi email dari Supabase gagal melakukan verifikasi token di Safari.
* **Dampak**: Karena domain frontend kita berada di Firebase Hosting (misal: `ruangsinggah.id`) sedangkan endpoint API Supabase berada di domain berbeda (misal: `[project-id].supabase.co`), Safari mendeteksi pembacaan session token di `localStorage` dari domain eksternal sebagai aktivitas "tracking" dan memblokirnya.

### C. Mode Samaran Safari (Private Browsing Mode)
* **Masalah**: Supabase Client secara default menyimpan session token di `localStorage`. Di beberapa versi iOS/Safari, Mode Private melarang penuh penulisan ke `localStorage` (mengembalikan error *QuotaExceededError*).
* **Gejala**: Pengguna tidak dapat masuk sama sekali atau session langsung hilang sesaat setelah dialihkan.
* **Dampak**: Supabase terpaksa turun ke *in-memory storage*, yang berarti session akan hangus seketika halaman dimuat ulang atau ketika pengguna berpindah tab.

### D. Supabase Cold Start / Auto-Pause (Free Tier)
* **Masalah**: Jika proyek Supabase berjalan di atas tingkat gratisan (*Free Tier*), database akan otomatis dijeda (*paused*) apabila tidak ada aktivitas API selama 1 minggu.
* **Gejala**: Pengguna pertama yang mengakses web setelah masa sepi akan mengalami kegagalan login atau timeout selama 30-60 detik pertama.
* **Dampak**: Sistem terlihat "rusak" sementara database sedang dibangunkan ulang (*waking up*).

---

## 2. Rencana Solusi Konkret

### Solusi 1: Menerapkan Custom Domain pada Supabase Auth (SANGAT DIREKOMENDASIKAN)
Dengan membuat custom domain untuk API Supabase (misalnya dari `[project-id].supabase.co` menjadi `api.ruangsinggah.id` atau `auth.ruangsinggah.id`):
1. **Mengatasi Safari ITP**: API dan Frontend berada pada root domain yang sama (`ruangsinggah.id`), sehingga Safari mengklasifikasikannya sebagai *first-party data* yang aman dan tidak memblokir token atau cookie auth.
2. **Mengatasi Blokir DNS ISP**: ISP Indonesia tidak akan memblokir domain `ruangsinggah.id` karena merupakan domain lokal resmi, sehingga akses API dijamin aman dari pemblokiran DNS Indihome/Telkomsel.

*Cara konfigurasi:*
* Buka Dashboard Supabase -> Project Settings -> Custom Domains.
* Masukkan custom subdomain (misal: `api.ruangsinggah.id`) dan lakukan konfigurasi DNS CNAME pada domain provider Anda.

### Solusi 2: Menggunakan Fallback Cookie Storage pada Supabase Client
Jika `localStorage` diblokir (seperti pada Safari Private Mode), kita dapat mengonfigurasi Supabase Client agar menggunakan penyimpanan berbasis Cookie yang aman dengan atribut `SameSite=Lax` dan `Secure`.

*Contoh konfigurasi di `supabase.ts`:*
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'ruangsinggah-auth-token',
    storage: {
      getItem: (key) => {
        // Fallback ke cookie jika localStorage tidak tersedia
        try {
          return localStorage.getItem(key);
        } catch {
          const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          document.cookie = `${key}=; path=/; max-age=-1; SameSite=Lax; Secure`;
        }
      }
    }
  }
});
```

### Solusi 3: Edukasi Pengguna Menggunakan DNS Cloudflare/Google (Jangka Pendek)
Jika ada pengguna yang mengeluh tidak bisa mengakses login dari ponsel Android/iOS saat menggunakan paket data Telkomsel:
* Edukasikan mereka untuk mengaktifkan **Private DNS** pada ponsel mereka menggunakan alamat:
  - `1.1.1.1` atau `cloudflare-dns.com` (Cloudflare)
  - `dns.google` (Google)
* Hal ini akan secara instan memotong jalur blokir DNS ISP lokal.
