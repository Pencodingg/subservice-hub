CREATE OR REPLACE FUNCTION public.distinct_subservices()
RETURNS TABLE (subservice TEXT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT r.subservice FROM public.records r ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.distinct_subservices() TO anon, authenticated, service_role;