-- =============================================
-- Template Store - Supabase Schema
-- Chạy trong Supabase SQL Editor
-- =============================================

-- Profiles (extend auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Templates catalog
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  thumbnail_url text,
  google_sheet_embed_url text,
  google_sheet_copy_url text,
  tutorial_video_url text,
  sale_price decimal(12,0),
  original_price decimal(12,0),
  tags text[],
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subscription packages
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sale_price decimal(12,0) NOT NULL,
  original_price decimal(12,0),
  features jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Which templates belong to which packages
CREATE TABLE IF NOT EXISTS public.package_templates (
  package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, template_id)
);

-- Orders (manual bank transfer)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  total_amount decimal(12,0) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  bank_transfer_note text,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User purchases (created after admin confirms order)
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_type text NOT NULL CHECK (purchase_type IN ('template', 'package')),
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- Templates: public read for published
CREATE POLICY "Anyone can view published templates" ON public.templates FOR SELECT USING (is_published = true);
CREATE POLICY "Service role full access templates" ON public.templates FOR ALL USING (auth.role() = 'service_role');

-- Packages: public read for active
CREATE POLICY "Anyone can view active packages" ON public.packages FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access packages" ON public.packages FOR ALL USING (auth.role() = 'service_role');

-- Package templates: public read
CREATE POLICY "Anyone can view package templates" ON public.package_templates FOR SELECT USING (true);
CREATE POLICY "Service role full access package_templates" ON public.package_templates FOR ALL USING (auth.role() = 'service_role');

-- Orders: users see own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access orders" ON public.orders FOR ALL USING (auth.role() = 'service_role');

-- User purchases: users see own purchases
CREATE POLICY "Users can view own purchases" ON public.user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access purchases" ON public.user_purchases FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Sample data (tuỳ chỉnh trước khi dùng)
-- =============================================

-- INSERT INTO public.packages (slug, name, description, sale_price, original_price, features, sort_order) VALUES
-- ('goi-co-ban', 'Gói Cơ Bản', 'Dành cho cá nhân và doanh nghiệp nhỏ', 299000, 500000, '["5 templates cơ bản", "Video hướng dẫn", "Hỗ trợ 30 ngày"]', 1),
-- ('goi-nang-cao', 'Gói Nâng Cao', 'Dành cho doanh nghiệp vừa và lớn', 599000, 900000, '["Tất cả templates", "Video hướng dẫn chi tiết", "Cập nhật miễn phí", "Hỗ trợ ưu tiên"]', 2);
