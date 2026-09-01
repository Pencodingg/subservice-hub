DELETE FROM public.records;

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS no_simf text,
  ADD COLUMN IF NOT EXISTS site_id text,
  ADD COLUMN IF NOT EXISTS station_name text,
  ADD COLUMN IF NOT EXISTS freq numeric,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text;

CREATE INDEX IF NOT EXISTS records_no_simf_idx ON public.records (no_simf);
CREATE INDEX IF NOT EXISTS records_province_idx ON public.records (province);
CREATE INDEX IF NOT EXISTS records_station_name_idx ON public.records (station_name);