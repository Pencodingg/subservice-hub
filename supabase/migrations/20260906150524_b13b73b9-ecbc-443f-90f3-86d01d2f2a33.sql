-- 1. New data columns
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS lat_dms text,
  ADD COLUMN IF NOT EXISTS long_dms text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS station_address text,
  ADD COLUMN IF NOT EXISTS callsign text,
  ADD COLUMN IF NOT EXISTS freq_pair numeric,
  ADD COLUMN IF NOT EXISTS bandwidth text,
  ADD COLUMN IF NOT EXISTS antenna_height numeric,
  ADD COLUMN IF NOT EXISTS azimuth numeric,
  ADD COLUMN IF NOT EXISTS licence_date date,
  ADD COLUMN IF NOT EXISTS validity_date date,
  ADD COLUMN IF NOT EXISTS clnt_id text,
  ADD COLUMN IF NOT EXISTS appl_id text;

CREATE INDEX IF NOT EXISTS records_city_idx ON public.records (city);
CREATE INDEX IF NOT EXISTS records_province_idx ON public.records (province);

-- 2. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can claim the basic role" ON public.user_roles;
CREATE POLICY "Users can claim the basic role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'user');

-- 3. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();

-- 4. Records access: signed-in users read, admins write
DROP POLICY IF EXISTS "Anyone can view records" ON public.records;
DROP POLICY IF EXISTS "Anyone can insert records" ON public.records;
DROP POLICY IF EXISTS "Anyone can update records" ON public.records;
DROP POLICY IF EXISTS "Anyone can delete records" ON public.records;

REVOKE ALL ON public.records FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO authenticated;
GRANT ALL ON public.records TO service_role;

CREATE POLICY "Signed-in users can view records"
ON public.records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert records"
ON public.records FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update records"
ON public.records FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete records"
ON public.records FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));