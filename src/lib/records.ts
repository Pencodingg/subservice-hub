import { supabase } from "@/integrations/supabase/client";

export type ServiceRecord = {
  id: string;
  item_name: string;
  main_service: string;
  subservice: string;
  status: string;
  no_simf: string | null;
  site_id: string | null;
  station_name: string | null;
  station_address: string | null;
  callsign: string | null;
  freq: number | null;
  freq_pair: number | null;
  bandwidth: string | null;
  antenna_height: number | null;
  azimuth: number | null;
  latitude: number | null;
  longitude: number | null;
  lat_dms: string | null;
  long_dms: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  licence_date: string | null;
  validity_date: string | null;
  clnt_id: string | null;
  appl_id: string | null;
  last_updated: string;
  created_at: string;
};

export type SortColumn =
  | "item_name"
  | "main_service"
  | "subservice"
  | "status"
  | "city"
  | "province"
  | "freq"
  | "validity_date"
  | "last_updated";

export type RecordsQuery = {
  page: number;
  pageSize: number;
  search: string;
  subservice: string;
  status: string;
  province: string;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
};

export const STATUSES = ["Granted", "Granted (Under modification)", "Prelim. Canceled"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchRecords(q: RecordsQuery) {
  const from = (q.page - 1) * q.pageSize;
  let builder = supabase.from("records").select("*", { count: "exact" });

  const search = q.search.trim();
  if (search) {
    if (UUID_RE.test(search)) {
      builder = builder.eq("id", search);
    } else {
      const term = search.replace(/[,()"']/g, " ").trim();
      builder = builder.or(
        [
          `item_name.ilike.%${term}%`,
          `station_name.ilike.%${term}%`,
          `no_simf.ilike.%${term}%`,
          `site_id.ilike.%${term}%`,
          `callsign.ilike.%${term}%`,
          `city.ilike.%${term}%`,
          `district.ilike.%${term}%`,
        ].join(","),
      );
    }
  }
  if (q.subservice !== "all") builder = builder.eq("subservice", q.subservice);
  if (q.status !== "all") builder = builder.eq("status", q.status);
  if (q.province !== "all") builder = builder.eq("province", q.province);

  const { data, error, count } = await builder
    .order(q.sortBy, { ascending: q.sortDir === "asc", nullsFirst: false })
    .range(from, from + q.pageSize - 1);

  if (error) throw error;
  return { rows: (data ?? []) as ServiceRecord[], total: count ?? 0 };
}

export async function fetchSubservices() {
  const { data, error } = await supabase.rpc("distinct_subservices");
  if (error) throw error;
  return ((data ?? []) as { subservice: string }[]).map((r) => r.subservice);
}

export async function fetchProvinces() {
  const { data, error } = await supabase
    .from("records")
    .select("province")
    .not("province", "is", null)
    .limit(10000);
  if (error) throw error;
  const set = new Set((data ?? []).map((r) => r.province as string));
  return [...set].sort();
}

export type RecordInput = {
  item_name: string;
  main_service: string;
  subservice: string;
  status: string;
  no_simf: string | null;
  site_id: string | null;
  station_name: string | null;
  station_address: string | null;
  callsign: string | null;
  freq: number | null;
  freq_pair: number | null;
  bandwidth: string | null;
  antenna_height: number | null;
  azimuth: number | null;
  latitude: number | null;
  longitude: number | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  licence_date: string | null;
  validity_date: string | null;
};

export async function createRecord(input: RecordInput) {
  const { error } = await supabase.from("records").insert(input);
  if (error) throw error;
}

export async function updateRecord(id: string, input: RecordInput) {
  const { error } = await supabase.from("records").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from("records").delete().eq("id", id);
  if (error) throw error;
}
