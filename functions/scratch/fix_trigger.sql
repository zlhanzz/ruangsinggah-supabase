-- ============================================================
-- SCRIPT PERBAIKAN TRIGGER handle_new_user()
-- Jalankan script ini di Supabase Dashboard > SQL Editor
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

-- Re-create the trigger to make sure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
