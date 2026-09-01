import { supabase } from "@/integrations/supabase/client";

export type RecordStatus = "Active" | "Inactive";

export type ServiceRecord = {
  id: string;
  item_name: string;
  main_service: string;
  subservice: string;
  status: string;
  last_updated: string;
  created_at: string;
};

export type SortColumn = "item_name" | "main_service" | "subservice" | "status" | "last_updated";

export type RecordsQuery = {
  page: number;
  pageSize: number;
  search: string;
  subservice: string;
  status: string;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchRecords(q: RecordsQuery) {
  const from = (q.page - 1) * q.pageSize;
  let builder = supabase.from("records").select("*", { count: "exact" });

  const search = q.search.trim();
  if (search) {
    if (UUID_RE.test(search)) builder = builder.eq("id", search);
    else builder = builder.ilike("item_name", `%${search}%`);
  }
  if (q.subservice !== "all") builder = builder.eq("subservice", q.subservice);
  if (q.status !== "all") builder = builder.eq("status", q.status);

  const { data, error, count } = await builder
    .order(q.sortBy, { ascending: q.sortDir === "asc" })
    .range(from, from + q.pageSize - 1);

  if (error) throw error;
  return { rows: (data ?? []) as ServiceRecord[], total: count ?? 0 };
}

export async function fetchSubservices() {
  const { data, error } = await supabase.rpc("distinct_subservices");
  if (error) throw error;
  return ((data ?? []) as { subservice: string }[]).map((r) => r.subservice);
}

export type RecordInput = {
  item_name: string;
  main_service: string;
  subservice: string;
  status: string;
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
