-- ============================================================
-- Phase 2: Tax Trial System
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Thêm cột trial vào profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tax_trial_started_at timestamptz;

-- 2. Thêm cột số ngày dùng thử (admin cấu hình) vào site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS tax_trial_days int NOT NULL DEFAULT 14;

-- 3. Auto-set trial cho user mới khi đăng ký (trigger)
--    Giả sử đã có trigger handle_new_user → update thêm tax_trial_started_at
--    Nếu chưa có trigger, tạo mới:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin, tax_trial_started_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    false,
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET tax_trial_started_at = COALESCE(profiles.tax_trial_started_at, now());
  RETURN new;
END;
$$;

-- Nếu trigger chưa tồn tại, tạo mới:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- 4. Set trial cho tất cả user hiện tại chưa có (tính từ ngày tạo account)
UPDATE profiles p
SET tax_trial_started_at = COALESCE(
  (SELECT created_at FROM auth.users WHERE id = p.id),
  now()
)
WHERE tax_trial_started_at IS NULL
  AND tax_access_until IS NULL
  AND is_admin = false;
