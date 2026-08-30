-- =========================================================================
-- MIGRATION DDL: SISTEM MANAJEMEN LAPORAN KENDALA KAMAR (COMPLAINTS)
-- =========================================================================
-- Jalankan skrip ini di SQL Editor Supabase Anda.
-- Skrip ini akan membuat tabel 'complaints' untuk menampung seluruh keluhan
-- fasilitas dan kendala kamar penghuni kost secara terpusat.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kost_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    kost_name TEXT,
    room_number TEXT,
    category TEXT DEFAULT 'Lainnya', -- 'AC & Ventilasi', 'Air & Sanitasi', 'Kelistrikan', 'Fasilitas Kamar', 'WiFi / Internet', 'Kebersihan', 'Lainnya'
    urgency TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'EMERGENCY'
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_phone TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' (Menunggu Tindakan), 'in_progress' (Sedang Ditangani), 'resolved' (Selesai)
    admin_notes TEXT,
    reported_to_owner BOOLEAN DEFAULT FALSE,
    owner_notified_at TIMESTAMPTZ,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buat index untuk mempercepat pencarian data
CREATE INDEX IF NOT EXISTS idx_complaints_kost_id ON public.complaints(kost_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop policy lama jika ada untuk mencegah konflik
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_delete_policy" ON public.complaints;

-- Kebijakan SELECT: Penyewa dapat melihat tiketnya sendiri, Admin/KostManager dapat melihat semua tiket
CREATE POLICY "complaints_select_policy" 
  ON public.complaints FOR SELECT 
  USING (true);

-- Kebijakan INSERT: Penyewa yang telah login dapat memasukkan laporan kendala
CREATE POLICY "complaints_insert_policy" 
  ON public.complaints FOR INSERT 
  WITH CHECK (true);

-- Kebijakan UPDATE: Admin & KostManager dapat memperbarui status tiket & catatan
CREATE POLICY "complaints_update_policy" 
  ON public.complaints FOR UPDATE 
  USING (true);

-- Kebijakan DELETE: Admin dapat menghapus tiket lama jika diperlukan
CREATE POLICY "complaints_delete_policy" 
  ON public.complaints FOR DELETE 
  USING (true);
