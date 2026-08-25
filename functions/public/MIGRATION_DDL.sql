-- =========================================================================
-- MIGRATION DDL: TRANSISI DATABASE RELASIONAL (ROOMS & BOOKINGS)
-- =========================================================================
-- Jalankan skrip ini di SQL Editor Supabase Anda secara berurutan.
-- Skrip ini akan membuat tabel 'rooms', 'room_bookings', dan memodifikasi
-- tabel 'resident_status' yang sudah ada.

BEGIN;

-- 1. PEMBUATAN TABEL KAMAR FISIK (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL, -- Contoh: "Kamar 101", "A-5"
    room_type_name VARCHAR(100) NOT NULL, -- Contoh: "Deluxe", "Standard"
    price_per_month NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (property_id, room_number)
);

-- Buat index untuk mempercepat pencarian kamar berdasarkan properti
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);


-- 2. PEMBUATAN TABEL PEMESANAN KAMAR (room_bookings)
CREATE TABLE IF NOT EXISTS public.room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Penyewa
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, -- Kamar yang dipilih
    start_date DATE NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat index untuk pencarian booking
CREATE INDEX IF NOT EXISTS idx_room_bookings_user ON public.room_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON public.room_bookings(room_id);


-- 3. MODIFIKASI TABEL RIWAYAT HUNIAN (resident_status) YANG SUDAH ADA
-- Tambahkan kolom room_id jika belum ada
ALTER TABLE public.resident_status 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Hapus UNIQUE constraint lama (jika ada) yang hanya membatasi (user_id, kost_id)
ALTER TABLE public.resident_status 
DROP CONSTRAINT IF EXISTS resident_status_user_id_kost_id_key;

-- Tambahkan UNIQUE constraint baru yang menyertakan room_id
-- Ini memungkinkan satu user menyewa beberapa kamar berbeda di kost yang sama
ALTER TABLE public.resident_status 
ADD CONSTRAINT resident_status_user_id_kost_id_room_id_key UNIQUE (user_id, kost_id, room_id);

-- Buat index pada kolom room_id untuk optimasi join query
CREATE INDEX IF NOT EXISTS idx_resident_status_room_id ON public.resident_status(room_id);


-- 4. ATUR ROW LEVEL SECURITY (RLS) UNTUK TABEL BARU
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

-- Policy untuk tabel 'rooms'
DROP POLICY IF EXISTS "Allow public read for rooms" ON public.rooms;
CREATE POLICY "Allow public read for rooms" ON public.rooms
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write for property owners and admins" ON public.rooms;
CREATE POLICY "Allow write for property owners and admins" ON public.rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = rooms.property_id 
            AND (p.owner_uid = auth.uid() OR public.is_admin())
        )
    );

-- Policy untuk tabel 'room_bookings'
DROP POLICY IF EXISTS "Allow users to manage own bookings" ON public.room_bookings;
CREATE POLICY "Allow users to manage own bookings" ON public.room_bookings
    FOR ALL USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to view bookings for their properties" ON public.room_bookings;
CREATE POLICY "Allow owners to view bookings for their properties" ON public.room_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            JOIN public.properties p ON p.id = r.property_id
            WHERE r.id = room_bookings.room_id
            AND (p.owner_uid = auth.uid() OR public.is_admin())
        )
    );

COMMIT;
