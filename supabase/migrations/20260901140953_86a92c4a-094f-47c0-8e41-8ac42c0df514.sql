CREATE TABLE public.records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  main_service TEXT NOT NULL,
  subservice TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO authenticated;
GRANT ALL ON public.records TO service_role;

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view records" ON public.records FOR SELECT USING (true);
CREATE POLICY "Anyone can insert records" ON public.records FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update records" ON public.records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete records" ON public.records FOR DELETE USING (true);

CREATE INDEX records_subservice_idx ON public.records (subservice);
CREATE INDEX records_status_idx ON public.records (status);
CREATE INDEX records_item_name_idx ON public.records (item_name);
CREATE INDEX records_last_updated_idx ON public.records (last_updated DESC);

CREATE OR REPLACE FUNCTION public.touch_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER records_touch_last_updated
BEFORE UPDATE ON public.records
FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();

INSERT INTO public.records (item_name, main_service, subservice, status, last_updated)
SELECT
  (ARRAY['Fiber Link','Core Router','Access Node','Edge Switch','Cloud VM','Backup Vault','Firewall Unit','Load Balancer','Storage Array','DNS Zone'])[1 + (i % 10)] || ' ' || LPAD(i::text, 5, '0'),
  (ARRAY['Connectivity','Cloud Platform','Managed Security','Data Center'])[1 + (i % 4)],
  (ARRAY['Broadband','Dedicated Internet','IP Transit','VPN','Colocation','Hosting','Backup & Recovery','Firewall Management','DDoS Protection','Monitoring','Voice','SD-WAN'])[1 + (i % 12)],
  CASE WHEN i % 5 = 0 THEN 'Inactive' ELSE 'Active' END,
  now() - (i % 500) * interval '3 hours'
FROM generate_series(1, 10000) AS s(i);