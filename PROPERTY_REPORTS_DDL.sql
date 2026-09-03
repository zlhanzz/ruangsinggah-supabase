-- =========================================================================
-- MIGRATION DDL: SISTEM PELAPORAN IKLAN KOST (PROPERTY REPORTS)
-- =========================================================================
-- Jalankan skrip ini di Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste & Run (Ctrl + Enter)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.property_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reporter_phone TEXT NOT NULL,
    category TEXT NOT NULL, -- 'fraud', 'mismatch', 'fake_location', 'closed_or_full', 'inappropriate', 'other'
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    admin_notes TEXT,
    action_taken TEXT, -- 'frozen', 'contacted_owner', 'dismissed', etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk kecepatan query
CREATE INDEX IF NOT EXISTS idx_property_reports_property_id ON public.property_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reports_reporter_id ON public.property_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_property_reports_status ON public.property_reports(status);
CREATE INDEX IF NOT EXISTS idx_property_reports_created_at ON public.property_reports(created_at DESC);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- Reset policies jika sudah ada sebelumnya
DROP POLICY IF EXISTS "property_reports_select_policy" ON public.property_reports;
DROP POLICY IF EXISTS "property_reports_insert_policy" ON public.property_reports;
DROP POLICY IF EXISTS "property_reports_update_policy" ON public.property_reports;
DROP POLICY IF EXISTS "property_reports_delete_policy" ON public.property_reports;

-- 1. Kebijakan INSERT: Siapapun (publik maupun terotentikasi) dapat mengirim laporan iklan kost
CREATE POLICY "property_reports_insert_policy"
    ON public.property_reports FOR INSERT
    WITH CHECK (true);

-- 2. Kebijakan SELECT: Pengguna dan Admin dapat membaca laporan
CREATE POLICY "property_reports_select_policy"
    ON public.property_reports FOR SELECT
    USING (true);

-- 3. Kebijakan UPDATE: Admin dapat memperbarui status laporan dan mencatat penalti/revisi
CREATE POLICY "property_reports_update_policy"
    ON public.property_reports FOR UPDATE
    USING (true);

-- 4. Kebijakan DELETE: Admin dapat menghapus laporan jika diperlukan
CREATE POLICY "property_reports_delete_policy"
    ON public.property_reports FOR DELETE
    USING (true);
