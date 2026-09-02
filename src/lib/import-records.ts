import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import type { RecordInput } from "@/lib/records";

const ALIASES: Record<keyof RecordInput, string[]> = {
  item_name: ["item_name", "item name", "nama", "client", "klien", "nama klien", "name"],
  main_service: ["main_service", "main service", "service", "layanan", "service utama"],
  subservice: ["subservice", "sub service", "sub_service", "sub layanan", "subservis"],
  status: ["status", "status izin"],
  no_simf: ["no_simf", "no simf", "no izin", "no_izin", "nomor izin", "izin"],
  site_id: ["site_id", "site id", "siteid", "id site"],
  station_name: ["station_name", "station name", "nama stasiun", "stasiun"],
  freq: ["freq", "frequency", "frekuensi", "freq (mhz)", "frekuensi (mhz)"],
  city: ["city", "kota", "kabupaten", "kota/kabupaten"],
  province: ["province", "provinsi", "prov"],
};

const norm = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, " ");

function buildMap(headers: string[]) {
  const map: Partial<Record<keyof RecordInput, string>> = {};
  for (const key of Object.keys(ALIASES) as (keyof RecordInput)[]) {
    const found = headers.find((h) => ALIASES[key].includes(norm(h)));
    if (found) map[key] = found;
  }
  return map;
}

export type ParsedImport = {
  rows: RecordInput[];
  skipped: number;
  matched: string[];
  missing: string[];
  fileName: string;
};

const text = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "-" ? null : s;
};

export async function parseImportFile(file: File): Promise<ParsedImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("File tidak memiliki sheet data.");
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  if (raw.length === 0) throw new Error("File tidak berisi baris data.");

  const headers = Object.keys(raw[0]);
  const map = buildMap(headers);
  if (!map.item_name && !map.subservice) {
    throw new Error(
      "Kolom tidak dikenali. Pastikan ada kolom seperti: item_name / klien, main_service, subservice, status.",
    );
  }

  const rows: RecordInput[] = [];
  let skipped = 0;
  for (const r of raw) {
    const get = (k: keyof RecordInput) => (map[k] ? r[map[k]!] : null);
    const item_name = text(get("item_name"));
    const subservice = text(get("subservice"));
    if (!item_name && !subservice) {
      skipped++;
      continue;
    }
    const freqRaw = text(get("freq"));
    const freqNum = freqRaw === null ? null : Number(freqRaw.replace(/,/g, "."));
    rows.push({
      item_name: item_name ?? "(tanpa nama)",
      main_service: text(get("main_service")) ?? "-",
      subservice: subservice ?? "-",
      status: text(get("status")) ?? "Granted",
      no_simf: text(get("no_simf")),
      site_id: text(get("site_id")),
      station_name: text(get("station_name")),
      freq: freqNum !== null && Number.isFinite(freqNum) ? freqNum : null,
      city: text(get("city")),
      province: text(get("province")),
    });
  }

  const allKeys = Object.keys(ALIASES) as (keyof RecordInput)[];
  return {
    rows,
    skipped,
    fileName: file.name,
    matched: allKeys.filter((k) => map[k]),
    missing: allKeys.filter((k) => !map[k]),
  };
}

export async function insertRecordsBatched(
  rows: RecordInput[],
  onProgress?: (done: number, total: number) => void,
) {
  const size = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from("records").insert(chunk);
    if (error) throw error;
    done += chunk.length;
    onProgress?.(done, rows.length);
  }
  return done;
}
