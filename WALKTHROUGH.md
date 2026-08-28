
# Walkthrough: Smart Auto-Detection Wilayah Administrasi (Provinsi, Kota/Kabupaten, Kecamatan)

## 📌 Ringkasan Pekerjaan
Fitur deteksi otomatis wilayah administrasi telah berhasil diintegrasikan pada Google Maps `LocationPicker` di Modal Properti Kelolaan Portal KostManager (`KostManagerPortal.tsx`). 

Ketika pengguna atau surveyor meletakkan pin peta, mencari lokasi via autocomplete, atau mengklik *"Gunakan Lokasi GPS Saya"*, sistem secara otomatis dan cerdas membagi entitas alamat Google Maps menjadi 3 kategori wilayah administratif yang bersih dan presisi:
1. 🏛️ **Provinsi**: Diekstrak dari `administrative_area_level_1` (misal: *"Sulawesi Selatan"*).
2. 🏙️ **Kota / Kabupaten**: Diekstrak dari `administrative_area_level_2` dengan pembersihan awalan *"Kota "* / *"Kabupaten "* (misal: *"Kota Makassar"* $\rightarrow$ *"Makassar"*).
3. 📍 **Kecamatan / Area**: Diekstrak dari `administrative_area_level_3` / `sublocality_level_1` / `locality` dengan pembersihan awalan *"Kecamatan "* / *"Kec. "* (misal: *"Kecamatan Tamalanrea"* $\rightarrow$ *"Tamalanrea"*).

---

## 🛠️ Detail Perubahan

### 1. Smart Geocoding Parser di `LocationPicker` (`KostManagerPortal.tsx`)
- Memperbarui fungsi `reverseGeocode` dan event listener Google Places `place_changed` autocomplete untuk mengurai `address_components` secara hierarkis:
  ```ts
  const getComp = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';
  const province = getComp('administrative_area_level_1').replace(/^(Provinsi|Prov\.)\s+/i, '').trim();
  const rawCity = getComp('administrative_area_level_2') || getComp('locality') || getComp('administrative_area_level_1');
  const city = rawCity.replace(/^(Kota|Kabupaten|Kab\.)\s+/i, '').trim();
  const rawArea = getComp('administrative_area_level_3') || getComp('sublocality_level_1') || getComp('sublocality') || getComp('locality');
  const area = rawArea.replace(/^(Kecamatan|Kec\.)\s+/i, '').trim();
  ```
- Mencegah bug lama di mana `locality` yang bernilai nama Kecamatan secara keliru mengisi kolom Kota.
- Menyalurkan `province`, `city`, `area` ke callback `onLocationChange`.

### 2. Antarmuka 3 Kolom Wilayah Terstruktur di Tab 1 Modal KostManager
- Menyediakan 3 field input yang bersih dan otomatis terisi saat pin peta berpindah:
  - 🏛️ **Provinsi**: *Sulawesi Selatan*
  - 🏙️ **Kota / Kabupaten**: *Makassar*
  - 📍 **Kecamatan / Area**: *Tamalanrea*
- Kolom alamat lengkap jalan real tetap tersedia di bawahnya untuk rincian detail (nama jalan, nomor, RT/RW, dan patokan).

### 3. Persistensi Data ke Supabase
- Menambahkan `province` pada `DEFAULT_PROP_FORM`, state `newPropForm`, payload insert/update `properties` di `handleSave`, dan pemetaan data saat mode edit `handleEditProperty`.

---

## 🧪 Hasil Verifikasi Kompilasi & Build

```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
✓ 2526 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 29.57s
The command exited with code 0 (SUCCESS).
```

---

## 🧭 Panduan Pengujian untuk Pengguna
1. Buka halaman **Portal KostManager** di Dashboard Admin (`/admin/kostmanager`).
2. Klik tombol **`+ Tambah Properti`** atau tombol **`✏️ Edit`** pada salah satu properti.
3. Pada **Tab 1: Profil Gedung**, gulir ke bagian **Lokasi & Titik Koordinat GPS**.
4. Ketik nama tempat atau geser pin marker pada Google Maps.
5. Perhatikan bahwa 3 kolom wilayah:
   - **🏛️ Provinsi**
   - **🏙️ Kota / Kabupaten**
   - **📍 Kecamatan / Area**
   langsung terisi secara otomatis, rapi, dan presisi tanpa perlu diketik manual.
6. Simpan properti dan verifikasi bahwa data tersimpan sempurna.

