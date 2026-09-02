ALTER TABLE public.records
  ADD COLUMN dedupe_key text GENERATED ALWAYS AS (
    lower(
      coalesce(item_name,'') || '|' || coalesce(main_service,'') || '|' || coalesce(subservice,'') || '|' ||
      coalesce(no_simf,'') || '|' || coalesce(site_id,'') || '|' || coalesce(station_name,'') || '|' ||
      coalesce(freq::text,'') || '|' || coalesce(city,'') || '|' || coalesce(province,'')
    )
  ) STORED;

DELETE FROM public.records r
USING public.records r2
WHERE r.dedupe_key = r2.dedupe_key
  AND (r.last_updated, r.id) < (r2.last_updated, r2.id);

CREATE UNIQUE INDEX records_dedupe_key_uidx ON public.records (dedupe_key);