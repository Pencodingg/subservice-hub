ALTER TABLE public.records
ADD COLUMN dedupe_key_normalized text GENERATED ALWAYS AS (
  lower(
    coalesce(btrim(item_name), '') || '|' ||
    coalesce(btrim(main_service), '') || '|' ||
    coalesce(btrim(subservice), '') || '|' ||
    coalesce(btrim(no_simf), '') || '|' ||
    coalesce(btrim(site_id), '') || '|' ||
    coalesce(btrim(station_name), '') || '|' ||
    coalesce(trim_scale(freq)::text, '') || '|' ||
    coalesce(btrim(city), '') || '|' ||
    coalesce(btrim(province), '')
  )
) STORED;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY dedupe_key_normalized
      ORDER BY last_updated DESC, created_at DESC, id DESC
    ) AS row_rank
  FROM public.records
)
DELETE FROM public.records r
USING ranked d
WHERE r.id = d.id
  AND d.row_rank > 1;

DROP INDEX IF EXISTS public.records_dedupe_key_uidx;
ALTER TABLE public.records DROP COLUMN dedupe_key;
ALTER TABLE public.records RENAME COLUMN dedupe_key_normalized TO dedupe_key;
CREATE UNIQUE INDEX records_dedupe_key_uidx ON public.records (dedupe_key);