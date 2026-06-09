-- ============================================================
-- RUANGSINGGAH.ID — SUPABASE SQL SCHEMA SETUP (FIXED v2)
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Project: sgcmnsnokrztocnhxnqm
-- ============================================================


-- ============================================================
-- STEP 1: BUAT SEMUA TABEL (tanpa policies dulu)
-- ============================================================

-- Tabel USERS
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT,
  name                TEXT,
  phone               TEXT,
  role                TEXT NOT NULL DEFAULT 'user',
  is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
  occupation          TEXT,
  institution         TEXT,
  address             TEXT,
  gender              TEXT,
  religion            TEXT,
  relationship_status TEXT,
  photo_url           TEXT,
  -- Agent Verification Fields
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- unverified, pending, verified
  ktp_number          TEXT,
  ktp_address         TEXT,
  ktp_photo_url       TEXT,
  verification_notes  TEXT,
  status              TEXT NOT NULL DEFAULT 'active', -- active, blocked
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel AGENTS (Relasi 1-to-1 dengan users)
CREATE TABLE IF NOT EXISTS public.agents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  referral_code       TEXT UNIQUE NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- unverified, pending, verified
  ktp_number          TEXT,
  ktp_address         TEXT,
  ktp_photo_url       TEXT,
  verification_notes  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel MITRA (Relasi 1-to-1 dengan users)
CREATE TABLE IF NOT EXISTS public.mitra (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  referred_by         TEXT, -- Kode referral agen sponsor (jika ada)
  business_name       TEXT,
  business_address    TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free', -- free, kostmanager
  subscription_expires_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan semua kolom ada meskipun tabel sudah existed sebelumnya
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email               TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name                TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role                TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin            BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS occupation          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS institution         TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address             TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender              TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS religion            TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url           TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_number          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_address         TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_photo_url       TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_notes  TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Tabel PROPERTIES
CREATE TABLE IF NOT EXISTS public.properties (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title                TEXT,
  description          TEXT,
  price                NUMERIC(15,2) DEFAULT 0,
  facilities           JSONB DEFAULT '[]',
  address              TEXT,
  city                 TEXT,
  type                 TEXT DEFAULT 'Campur',
  status               TEXT NOT NULL DEFAULT 'draft',
  is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  rating               NUMERIC(3,1) DEFAULT 0,
  location             JSONB,
  image_urls           JSONB DEFAULT '[]',
  video_urls           JSONB DEFAULT '[]',
  instagram_url        TEXT,
  tiktok_url           TEXT,
  room_types           JSONB DEFAULT '[]',
  reviews              JSONB DEFAULT '[]',
  rules                JSONB DEFAULT '[]',
  campuses             JSONB DEFAULT '[]',
  public_facilities    JSONB DEFAULT '[]',
  virtual_tour_url     TEXT,
  additional_fee_price NUMERIC(15,2),
  additional_fee_name  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Konversi enum → TEXT (drop DEFAULT dulu agar tidak ada constraint conflict)
DO $$ BEGIN
  ALTER TABLE public.properties ALTER COLUMN status DROP DEFAULT;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.properties ALTER COLUMN status TYPE TEXT USING status::text;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.properties ALTER COLUMN status SET DEFAULT 'draft';
EXCEPTION WHEN others THEN NULL; END $$;

-- Pastikan semua kolom properties ada (jika tabel sudah existed)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_uid           UUID;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title                TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description          TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price                NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS facilities           JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city                 TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS type                 TEXT DEFAULT 'Campur';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified          BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rating               NUMERIC(3,1) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location             JSONB;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS image_urls           JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_urls           JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS instagram_url        TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tiktok_url           TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS room_types           JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviews              JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rules                JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS campuses             JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS public_facilities    JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS virtual_tour_url     TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS additional_fee_price NUMERIC(15,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS additional_fee_name  TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Set Replica Identity to FULL
ALTER TABLE public.properties REPLICA IDENTITY FULL;

-- Tabel AVAILABLE_DATABASES
CREATE TABLE IF NOT EXISTS public.available_databases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  campus      TEXT,
  city        TEXT,
  area        TEXT,
  description TEXT,
  price       NUMERIC(15,2) DEFAULT 0,
  total_data  INTEGER DEFAULT 0,
  file_urls   JSONB DEFAULT '{}',
  file_type   TEXT DEFAULT 'link',
  file_name   TEXT,
  status      TEXT NOT NULL DEFAULT 'available',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Konversi enum → TEXT (drop DEFAULT dulu agar tidak ada constraint conflict)
DO $$ BEGIN
  ALTER TABLE public.available_databases ALTER COLUMN status DROP DEFAULT;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.available_databases ALTER COLUMN status TYPE TEXT USING status::text;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.available_databases ALTER COLUMN status SET DEFAULT 'available';
EXCEPTION WHEN others THEN NULL; END $$;

-- Pastikan semua kolom available_databases ada
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS campus      TEXT;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS city        TEXT;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS area        TEXT;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS price       NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS total_data  INTEGER DEFAULT 0;

-- Tambahan kolom untuk Omnichannel Chat di PROPERTIES
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS omnichannel_contact_name TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS omnichannel_contact_phone TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS omnichannel_contact_type TEXT DEFAULT 'owner'; -- 'owner' | 'caretaker'
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS file_urls   JSONB DEFAULT '{}';
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS file_type   TEXT DEFAULT 'link';
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS file_name   TEXT;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS owner_uid   UUID;
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.available_databases ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Tabel MITRA_REQUESTS
CREATE TABLE IF NOT EXISTS public.mitra_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  property_name    TEXT,
  property_address TEXT,
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Konversi enum → TEXT (drop DEFAULT dulu agar tidak ada constraint conflict)
DO $$ BEGIN
  ALTER TABLE public.mitra_requests ALTER COLUMN status DROP DEFAULT;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.mitra_requests ALTER COLUMN status TYPE TEXT USING status::text;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.mitra_requests ALTER COLUMN status SET DEFAULT 'pending';
EXCEPTION WHEN others THEN NULL; END $$;

-- Pastikan semua kolom mitra_requests ada
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS name             TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS email            TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS phone            TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS property_name    TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS message          TEXT;
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.mitra_requests ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ============================================================
-- STEP 2: FUNCTION SECURITY DEFINER untuk cek admin
-- (HARUS dibuat sebelum policies agar tidak ada infinite loop)
-- SECURITY DEFINER = function bypass RLS saat query ke users
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_survey_agent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'survey_agent')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'owner' OR role = 'mitra')
  );
$$;


-- ============================================================
-- STEP 3: ENABLE RLS pada semua tabel
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitra_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitra ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 4: DROP policies lama dulu (agar bisa re-run tanpa error)
-- ============================================================
DROP POLICY IF EXISTS "users_select_own"          ON public.users;
DROP POLICY IF EXISTS "users_select_admin"         ON public.users;
DROP POLICY IF EXISTS "users_update_own"           ON public.users;
DROP POLICY IF EXISTS "users_insert_own"           ON public.users;
DROP POLICY IF EXISTS "properties_select_published" ON public.properties;
DROP POLICY IF EXISTS "properties_select_own"      ON public.properties;
DROP POLICY IF EXISTS "properties_insert"          ON public.properties;
DROP POLICY IF EXISTS "properties_update"          ON public.properties;
DROP POLICY IF EXISTS "properties_delete"          ON public.properties;
DROP POLICY IF EXISTS "databases_select_available" ON public.available_databases;
DROP POLICY IF EXISTS "databases_select_admin"     ON public.available_databases;
DROP POLICY IF EXISTS "databases_insert_admin"     ON public.available_databases;
DROP POLICY IF EXISTS "databases_update_admin"     ON public.available_databases;
DROP POLICY IF EXISTS "databases_delete_admin"     ON public.available_databases;
DROP POLICY IF EXISTS "mitra_insert_public"        ON public.mitra_requests;
DROP POLICY IF EXISTS "mitra_select_admin"         ON public.mitra_requests;
DROP POLICY IF EXISTS "mitra_update_admin"         ON public.mitra_requests;
-- Drop policies dari versi SQL pertama (nama berbeda)
DROP POLICY IF EXISTS "Users dapat melihat profil sendiri"            ON public.users;
DROP POLICY IF EXISTS "Admin dapat melihat semua profil"              ON public.users;
DROP POLICY IF EXISTS "Users dapat update profil sendiri"             ON public.users;
DROP POLICY IF EXISTS "Service dapat insert user baru"                ON public.users;
DROP POLICY IF EXISTS "Siapa saja dapat melihat properti published"   ON public.properties;
DROP POLICY IF EXISTS "Owner dapat melihat properti sendiri"          ON public.properties;
DROP POLICY IF EXISTS "Owner dapat insert properti"                   ON public.properties;
DROP POLICY IF EXISTS "Owner dapat update properti sendiri"           ON public.properties;
DROP POLICY IF EXISTS "Owner dapat delete properti sendiri"           ON public.properties;
DROP POLICY IF EXISTS "Siapa saja dapat melihat database available"   ON public.available_databases;
DROP POLICY IF EXISTS "Admin dapat melihat semua database"            ON public.available_databases;
DROP POLICY IF EXISTS "Admin dapat mengelola database"                ON public.available_databases;
DROP POLICY IF EXISTS "Siapa saja dapat submit mitra request"         ON public.mitra_requests;
DROP POLICY IF EXISTS "Admin dapat melihat semua mitra requests"      ON public.mitra_requests;
DROP POLICY IF EXISTS "Admin dapat update status mitra"               ON public.mitra_requests;

-- Drop policies baru untuk agents dan mitra
DROP POLICY IF EXISTS "agents_select_own" ON public.agents;
DROP POLICY IF EXISTS "agents_select_public_referral" ON public.agents;
DROP POLICY IF EXISTS "agents_update_own" ON public.agents;
DROP POLICY IF EXISTS "agents_insert_own" ON public.agents;
DROP POLICY IF EXISTS "agents_admin_all" ON public.agents;
DROP POLICY IF EXISTS "mitra_select_own" ON public.mitra;
DROP POLICY IF EXISTS "mitra_update_own" ON public.mitra;
DROP POLICY IF EXISTS "mitra_insert_own" ON public.mitra;
DROP POLICY IF EXISTS "mitra_admin_all" ON public.mitra;


-- ============================================================
-- STEP 5: POLICIES untuk tabel USERS
-- ============================================================

-- User melihat profil sendiri
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admin melihat semua profil (pakai function, bukan subquery recursive)
CREATE POLICY "users_select_admin"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- User update profil sendiri
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Insert profil sendiri saat register
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin update profil siapa saja (untuk verifikasi)
CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- Izinkan semua user yang login melihat profil publik (Nama, Foto) satu sama lain
-- Ini memastikan dashboard mitra selalu bisa menampilkan nama pelamar dengan lancar.
CREATE POLICY "users_select_basic_profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- POLICIES untuk tabel AGENTS
-- ============================================================
CREATE POLICY "agents_select_public_referral" ON public.agents FOR SELECT USING (true);
CREATE POLICY "agents_select_own" ON public.agents FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "agents_update_own" ON public.agents FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "agents_insert_own" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "agents_admin_all" ON public.agents FOR ALL USING (public.is_admin());

-- ============================================================
-- POLICIES untuk tabel MITRA
-- ============================================================
CREATE POLICY "mitra_select_own" ON public.mitra FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "mitra_update_own" ON public.mitra FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "mitra_insert_own" ON public.mitra FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "mitra_admin_all" ON public.mitra FOR ALL USING (public.is_admin());


-- ============================================================
-- STEP 5: POLICIES untuk tabel PROPERTIES
-- ============================================================

-- Siapa saja bisa lihat properti published
CREATE POLICY "properties_select_published"
  ON public.properties FOR SELECT
  USING (status::text = 'published');

-- Owner/Admin lihat properti sendiri (termasuk draft)
CREATE POLICY "properties_select_own"
  ON public.properties FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (owner_uid = auth.uid() OR public.is_admin())
  );

-- Owner/Admin insert properti
CREATE POLICY "properties_insert"
  ON public.properties FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (owner_uid = auth.uid() OR public.is_admin())
  );

-- Owner/Admin update properti
CREATE POLICY "properties_update"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (owner_uid = auth.uid() OR public.is_admin())
  );

-- Owner/Admin delete properti
CREATE POLICY "properties_delete"
  ON public.properties FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (owner_uid = auth.uid() OR public.is_admin())
  );

-- AKTIFKAN REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;


-- ============================================================
-- STEP 6: POLICIES untuk tabel AVAILABLE_DATABASES
-- ============================================================

-- Siapa saja bisa lihat database available
CREATE POLICY "databases_select_available"
  ON public.available_databases FOR SELECT
  USING (status::text = 'available');

-- Admin bisa lihat semua
CREATE POLICY "databases_select_admin"
  ON public.available_databases FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.is_admin());

-- Admin bisa insert, update, delete
CREATE POLICY "databases_insert_admin"
  ON public.available_databases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin());

CREATE POLICY "databases_update_admin"
  ON public.available_databases FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.is_admin());

CREATE POLICY "databases_delete_admin"
  ON public.available_databases FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.is_admin());


-- ============================================================
-- STEP 7: POLICIES untuk tabel MITRA_REQUESTS
-- ============================================================

-- Siapa saja bisa submit
CREATE POLICY "mitra_insert_public"
  ON public.mitra_requests FOR INSERT
  WITH CHECK (TRUE);

-- Hanya admin yang bisa baca
CREATE POLICY "mitra_select_admin"
  ON public.mitra_requests FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.is_admin());

-- Hanya admin yang bisa update status
CREATE POLICY "mitra_update_admin"
  ON public.mitra_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.is_admin());


-- ============================================================
-- STEP 8: TRIGGER auto-buat profil saat user baru register
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya sinkronisasi ke public.users jika email sudah diverifikasi
  IF (NEW.email_confirmed_at IS NOT NULL) THEN
    -- 1. Insert/Update data dasar ke public.users
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      name, 
      phone, 
      role, 
      is_admin, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role,
      FALSE,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = COALESCE(EXCLUDED.role, users.role),
      updated_at = NOW();

    -- 2. Jika role adalah owner atau mitra, masukkan ke tabel public.mitra
    IF (COALESCE(NEW.raw_user_meta_data->>'role', 'user') IN ('owner', 'mitra')) THEN
      INSERT INTO public.mitra (user_id, referred_by, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'referred_by',
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        referred_by = COALESCE(EXCLUDED.referred_by, mitra.referred_by),
        updated_at = NOW();
    END IF;

    -- 3. Jika role adalah survey_agent, masukkan ke tabel public.agents
    IF (COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'survey_agent') THEN
      INSERT INTO public.agents (user_id, referral_code, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'referral_code', 'AG-' || upper(substring(md5(random()::text) from 1 for 6))),
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- STEP 9: STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('databases', 'databases', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('surveys', 'surveys', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('survey-photos', 'survey-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', TRUE)
ON CONFLICT (id) DO NOTHING;



-- ============================================================
-- STEP 10: STORAGE POLICIES
-- ============================================================

-- Bucket: properties
CREATE POLICY "storage_properties_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'properties' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_properties_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

CREATE POLICY "storage_properties_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'properties' AND auth.uid() IS NOT NULL);

-- Bucket: databases
CREATE POLICY "storage_databases_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'databases' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_databases_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'databases');

-- Bucket: surveys
CREATE POLICY "storage_surveys_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'surveys' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_surveys_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'surveys');

CREATE POLICY "storage_surveys_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'surveys' AND auth.uid() IS NOT NULL);

-- Bucket: survey-photos
CREATE POLICY "storage_photos_survey_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'survey-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_photos_survey_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'survey-photos');

CREATE POLICY "storage_photos_survey_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'survey-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_databases_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'databases' AND auth.uid() IS NOT NULL);

-- Bucket: profile-photos
CREATE POLICY "storage_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "storage_photos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

-- Bucket: banners
CREATE POLICY "storage_banners_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "storage_banners_all_admin"
  ON storage.objects FOR ALL
  USING (bucket_id = 'banners' AND public.is_admin())
  WITH CHECK (bucket_id = 'banners' AND public.is_admin());


-- ============================================================
-- STEP 11: TRANSACTIONS TABLE & POLICIES (Unified for All Products)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL, -- ID of the Cost/Database/Service
  product_type     TEXT NOT NULL, -- 'database', 'kost_booking', 'survey', etc.
  amount           NUMERIC(15,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, AWAITING_PAYMENT, PAID, REJECTED, CANCELLED
  payment_method   TEXT,
  pakasir_order_id TEXT,
  pakasir_link     TEXT,
  metadata         JSONB DEFAULT '{}'::jsonb, -- Store extra info like booking dates
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set Replica Identity to FULL for DELETE event reliability
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- ENABLE RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "transactions_select_own" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "transactions_insert_own" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_admin_all" 
  ON public.transactions FOR ALL 
  USING (public.is_admin());

-- Mitra melihat transaksi yang terkait dengan properti miliknya
CREATE POLICY "transactions_select_owner" 
  ON public.transactions FOR SELECT 
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = transactions.product_id 
      AND properties.owner_uid = auth.uid()
    )
  );

-- AKTIFKAN REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ============================================================
-- STEP 12: COMPLAINTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.complaints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_id          UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  kost_name        TEXT,
  user_id          UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name        TEXT,
  user_phone       TEXT,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  photo_url        TEXT,
  status           TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "complaints_select_all" 
  ON public.complaints FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "complaints_insert_own" 
  ON public.complaints FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "complaints_admin_all" 
  ON public.complaints FOR ALL 
  USING (public.is_admin());

-- ============================================================
-- STEP 13: SECURE REVIEW FUNCTION (Bypass RLS for rating updates)
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_property_review(
  prop_id UUID,
  new_review JSONB,
  new_rating NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Perform the update
  UPDATE public.properties
  SET 
    reviews = reviews || new_review,
    rating = new_rating,
    updated_at = NOW()
  WHERE id = prop_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_property_review(UUID, JSONB, NUMERIC) TO authenticated;


-- ============================================================
-- STEP 14: CHAT TABLES (Sessions & Messages)
-- ============================================================

-- 1. Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, owner_id, property_id)
);

-- AKTIFKAN REALTIME & REPLICA IDENTITY
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'owner')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Hapus policy lama jika ada (mencegah error 42710)
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can start a chat session" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their sessions" ON public.chat_messages;

-- 5. Kebijakan RLS (Hanya pihak terlibat yang bisa akses)
CREATE POLICY "Users can view their own chat sessions"
ON public.chat_sessions FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can start a chat session"
ON public.chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = owner_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

-- 5. Policies for chat_messages
CREATE POLICY "Users can view messages in their sessions"
ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND (chat_sessions.user_id = auth.uid() OR chat_sessions.owner_id = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their sessions"
ON public.chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND (chat_sessions.user_id = auth.uid() OR chat_sessions.owner_id = auth.uid())
    )
    AND auth.uid() = sender_id
);

-- 6. Realtime Enrollment
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Enroll (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- ============================================================
-- STEP 15: SURVEY REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.survey_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE,
  kost_name         TEXT NOT NULL,
  kost_address      TEXT NOT NULL,
  owner_phone       TEXT,
  survey_date       DATE,
  survey_time       TIME,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT', 
  -- Statuses: AWAITING_PAYMENT, PENDING_ASSIGNMENT, AGENT_ASSIGNED, SURVEYING, COMPLETED, CANCELLED
  agent_name        TEXT,
  agent_phone       TEXT,
  assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  result_drive_link TEXT,
  evaluation_summary JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set Replica Identity to FULL
ALTER TABLE public.survey_requests REPLICA IDENTITY FULL;

-- ENABLE RLS
ALTER TABLE public.survey_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "surveys_select_own" ON public.survey_requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_agent_id OR public.is_admin());
CREATE POLICY "surveys_insert_own" ON public.survey_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "surveys_update_agent" ON public.survey_requests FOR UPDATE USING (auth.uid() = assigned_agent_id OR public.is_admin());
CREATE POLICY "surveys_admin_all" ON public.survey_requests FOR ALL USING (public.is_admin());

-- AKTIFKAN REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_requests;

-- ============================================================
-- STEP 16: NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, assignment, submission
  metadata    JSONB DEFAULT '{}'::jsonb,
  link        TEXT,  -- Kolom tambahan untuk link redirect notifikasi
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set Replica Identity to FULL
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ENABLE RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "notifications_select_own" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- AKTIFKAN REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ============================================================
-- STEP 17: RETROACTIVE DATA MIGRATION (Lari setelah tabel baru terbuat)
-- ============================================================
-- A. Migrasi user dengan role agen ke tabel agents
INSERT INTO public.agents (user_id, referral_code, verification_status, ktp_number, ktp_address, ktp_photo_url, verification_notes, created_at, updated_at)
SELECT 
  id as user_id,
  COALESCE(referral_code, 'AG-' || upper(substring(md5(random()::text) from 1 for 6))) as referral_code,
  verification_status,
  ktp_number,
  ktp_address,
  ktp_photo_url,
  verification_notes,
  created_at,
  updated_at
FROM public.users
WHERE role IN ('survey_agent', 'agen', 'agent')
ON CONFLICT (user_id) DO NOTHING;

-- B. Migrasi user dengan role owner/mitra ke tabel mitra
INSERT INTO public.mitra (user_id, referred_by, created_at, updated_at)
SELECT 
  id as user_id,
  referred_by,
  created_at,
  updated_at
FROM public.users
WHERE role IN ('owner', 'mitra')
ON CONFLICT (user_id) DO NOTHING;
