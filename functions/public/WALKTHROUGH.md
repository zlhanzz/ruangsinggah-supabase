# WALKTHROUGH — Perbaikan Hero Video di Instagram In-App Browser (IAB)

**Tanggal:** 16 Juni 2026  
**Fitur:** Kompatibilitas Video Hero Jasa Survey dengan Instagram In-App Browser

---

## 1. Analisis Masalah

### Akar Penyebab
Hero video di halaman Jasa Survey (`SurveyService.tsx`) menggunakan **YouTube IFrame API** — sebuah sistem player berbasis JavaScript yang **tidak berfungsi di Instagram In-App Browser (IAB)** karena:

| Masalah | Penjelasan |
|---------|-----------|
| `postMessage` diblokir | YouTube IFrame API mengandalkan komunikasi lintas-domain via `window.postMessage()`. Instagram IAB memblokir sebagian besar komunikasi ini. |
| Script gagal init | `onYouTubeIframeAPIReady` tidak pernah terpanggil di IAB, membuat `playerRef` tetap `null`. |
| Overlay transparan | `div` overlay yang menutupi iframe memblokir interaksi user dengan iframe — bahkan jika iframe berhasil load. |

### Dampak Bisnis
User dari iklan Meta Ads Instagram membuka halaman Jasa Survey via IAB, melihat area video yang blank/hitam tanpa bisa diputar → kepercayaan turun → konversi iklan terbuang sia-sia.

---

## 2. Daftar Perubahan

### File: `functions/public/pages/SurveyService.tsx`

#### A. Fungsi Deteksi IAB (baru)
```typescript
const isInstagramIAB = (): boolean => {
  const ua = (navigator.userAgent || '').toLowerCase();
  return ua.includes('instagram');
};
```

#### B. State `isIAB` (baru)
```typescript
const [isIAB, setIsIAB] = useState(false);

useEffect(() => {
  setIsIAB(isInstagramIAB());
}, []);
```
Diisi saat komponen mount — aman untuk SSR/hydration.

#### C. YouTube API Tidak Dimuat di IAB (modifikasi)
```typescript
useEffect(() => {
  if (isIAB) return; // ← Skip load API jika di Instagram IAB
  // ... sisa logika load YT IFrame API
}, [isIAB]);
```

#### D. Render Kondisional Player (modifikasi utama)
- **Jika `isIAB === true`**: Render thumbnail YouTube statis (`maxresdefault.jpg`) + tombol Play yang saat diklik membuka `https://www.youtube.com/watch?v=VIDEO_ID` (membuka app YouTube native).
- **Jika `isIAB === false`**: Render YouTube IFrame API custom player seperti biasa.

---

## 3. Perilaku Baru

| Skenario | Tampilan |
|----------|----------|
| Buka via Instagram (IAB) | Thumbnail video muncul langsung, tombol Play orange besar di tengah, teks "Tonton di YouTube →" |
| Klik tombol Play (IAB) | Membuka YouTube di aplikasi YouTube native atau browser default |
| Buka via Chrome/Safari/Firefox | Tetap pakai custom IFrame API player seperti sebelumnya |

---

## 4. Hasil Build Produksi
```
✓ 2521 modules transformed.
dist/assets/SurveyService-DjuJrIs9.js  39.75 kB │ gzip: 10.18 kB
✓ built in 49.24s
```
**Tidak ada error TypeScript. Build berhasil.**

---

## 5. Petunjuk Deploy

Jalankan perintah berikut untuk menerapkan perubahan ke server:

```bash
# 1. Build sudah selesai (step di atas)
# 2. Deploy ke Firebase Hosting
firebase deploy --only hosting
```
