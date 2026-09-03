import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import type { RecordInput } from "@/lib/records";

const ALIASES: Record<keyof RecordInput, string[]> = {
  item_name: [
    "item_name",
    "item name",
    "clnt_name",
    "clnt name",
    "client_name",
    "nama",
    "client",
    "klien",
    "nama klien",
    "name",
  ],
  main_service: ["main_service", "main service", "service", "layanan", "service utama"],
  subservice: ["subservice", "sub service", "sub_service", "sub layanan", "subservis"],
  status: ["status", "status_simf", "status simf", "status izin"],
  no_simf: ["no_simf", "no simf", "no izin", "no_izin", "nomor izin", "izin"],
  site_id: ["site_id", "site id", "siteid", "id site"],
  station_name: ["station_name", "station name", "stn_name", "stn name", "nama stasiun", "stasiun"],
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
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) throw new Error("File tidak memiliki sheet data.");
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const first = raw[0];
  if (!first) throw new Error("File tidak berisi baris data.");

  const headers = Object.keys(first);
  const map = buildMap(headers);
  if (!map.item_name) {
    throw new Error(
      "Kolom nama klien tidak ditemukan. Pastikan file punya kolom seperti CLNT_NAME / item_name / klien.",
    );
  }

  const rows: RecordInput[] = [];
  let skipped = 0;
  for (const r of raw) {
    const get = (k: keyof RecordInput) => (map[k] ? r[map[k]!] : null);
    const item_name = text(get("item_name"));
    const subservice = text(get("subservice"));
    if (!item_name) {
      skipped++;
      continue;
    }
    const freqRaw = text(get("freq"));
    const freqNum = freqRaw === null ? null : Number(freqRaw.replace(/,/g, "."));
    rows.push({
      item_name,
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

const keyOf = (r: RecordInput) =>
  [
    r.item_name,
    r.main_service,
    r.subservice,
    r.no_simf,
    r.site_id,
    r.station_name,
    r.freq,
    r.city,
    r.province,
  ]
    .map((v) => (v === null || v === undefined ? "" : String(v)))
    .join("|")
    .toLowerCase();

export async function insertRecordsBatched(
  allRows: RecordInput[],
  onProgress?: (done: number, total: number) => void,
) {
  // Hilangkan duplikat di dalam file itu sendiri (baris terakhir menang).
  const map = new Map<string, RecordInput>();
  for (const r of allRows) map.set(keyOf(r), r);
  const rows = [...map.values()];
  const size = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    // Data yang identik tidak diduplikasi — baris lama diperbarui (upsert).
    const { error } = await supabase
      .from("records")
      .upsert(chunk, { onConflict: "dedupe_key", ignoreDuplicates: false });
    if (error) throw error;
    done += chunk.length;
    onProgress?.(done, rows.length);
  }
  return done;
}
