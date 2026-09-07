import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, type RecordInput, type ServiceRecord } from "@/lib/records";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: ServiceRecord | null;
  subservices: string[];
  saving: boolean;
  onSubmit: (input: RecordInput) => void;
};

const MAIN_SERVICES = [
  "Fixed Service",
  "Land Mobile (private)",
  "Land Mobile (public)",
  "Broadcast",
  "Maritime",
  "Aeronautical",
  "Other Services",
];

const EMPTY: RecordInput = {
  item_name: "",
  main_service: "Fixed Service",
  subservice: "",
  status: "Granted",
  no_simf: "",
  site_id: "",
  station_name: "",
  station_address: "",
  callsign: "",
  freq: null,
  freq_pair: null,
  bandwidth: "",
  antenna_height: null,
  azimuth: null,
  latitude: null,
  longitude: null,
  village: "",
  district: "",
  city: "",
  province: "",
  licence_date: "",
  validity_date: "",
};

type NumField = "freq" | "freq_pair" | "antenna_height" | "azimuth" | "latitude" | "longitude";

const NUM_FIELDS: { key: NumField; label: string }[] = [
  { key: "freq", label: "Frekuensi (MHz)" },
  { key: "freq_pair", label: "Frekuensi pasangan (MHz)" },
  { key: "antenna_height", label: "Tinggi antena (m)" },
  { key: "azimuth", label: "Azimuth (°)" },
  { key: "latitude", label: "Lintang (desimal)" },
  { key: "longitude", label: "Bujur (desimal)" },
];

export function RecordFormDialog({
  open,
  onOpenChange,
  record,
  subservices,
  saving,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<RecordInput>(EMPTY);
  const [nums, setNums] = useState<Record<NumField, string>>({
    freq: "",
    freq_pair: "",
    antenna_height: "",
    azimuth: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (record) {
      setForm({
        item_name: record.item_name,
        main_service: record.main_service,
        subservice: record.subservice,
        status: record.status,
        no_simf: record.no_simf ?? "",
        site_id: record.site_id ?? "",
        station_name: record.station_name ?? "",
        station_address: record.station_address ?? "",
        callsign: record.callsign ?? "",
        freq: record.freq,
        freq_pair: record.freq_pair,
        bandwidth: record.bandwidth ?? "",
        antenna_height: record.antenna_height,
        azimuth: record.azimuth,
        latitude: record.latitude,
        longitude: record.longitude,
        village: record.village ?? "",
        district: record.district ?? "",
        city: record.city ?? "",
        province: record.province ?? "",
        licence_date: record.licence_date ?? "",
        validity_date: record.validity_date ?? "",
      });
      const s = (v: number | null) => (v === null ? "" : String(v));
      setNums({
        freq: s(record.freq),
        freq_pair: s(record.freq_pair),
        antenna_height: s(record.antenna_height),
        azimuth: s(record.azimuth),
        latitude: s(record.latitude),
        longitude: s(record.longitude),
      });
    } else {
      setForm({ ...EMPTY, subservice: subservices[0] ?? "" });
      setNums({
        freq: "",
        freq_pair: "",
        antenna_height: "",
        azimuth: "",
        latitude: "",
        longitude: "",
      });
    }
  }, [open, record, subservices]);

  const submit = () => {
    if (!form.item_name.trim()) return setError("Nama klien wajib diisi.");
    if (!form.subservice.trim()) return setError("Subservice wajib diisi.");
    const parsed = {} as Record<NumField, number | null>;
    for (const f of NUM_FIELDS) {
      const raw = nums[f.key].trim();
      if (raw === "") {
        parsed[f.key] = null;
        continue;
      }
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) return setError(`${f.label} harus berupa angka.`);
      parsed[f.key] = n;
    }
    setError(null);
    const clean = (v: string | null) => {
      const t = (v ?? "").trim();
      return t === "" ? null : t;
    };
    onSubmit({
      ...form,
      ...parsed,
      item_name: form.item_name.trim(),
      subservice: form.subservice.trim(),
      no_simf: clean(form.no_simf),
      site_id: clean(form.site_id),
      station_name: clean(form.station_name),
      station_address: clean(form.station_address),
      callsign: clean(form.callsign),
      bandwidth: clean(form.bandwidth),
      village: clean(form.village),
      district: clean(form.district),
      city: clean(form.city),
      province: clean(form.province),
      licence_date: clean(form.licence_date),
      validity_date: clean(form.validity_date),
    });
  };

  const textField = (
    key: keyof RecordInput,
    label: string,
    placeholder?: string,
    type = "text",
  ) => (
    <div className="grid gap-2">
      <Label htmlFor={String(key)}>{label}</Label>
      <Input
        id={String(key)}
        type={type}
        value={(form[key] as string | null) ?? ""}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record ? "Ubah data" : "Tambah data"}</DialogTitle>
          <DialogDescription>
            {record
              ? "Perbarui rincian izin stasiun ini."
              : "Tambahkan data izin stasiun baru ke basis data."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {textField("item_name", "Nama klien", "mis. INDOSAT TBK, PT.")}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Main service</Label>
              <Select
                value={form.main_service}
                onValueChange={(v) => setForm((f) => ({ ...f, main_service: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subservice">Subservice</Label>
              <Input
                id="subservice"
                list="subservice-options"
                value={form.subservice}
                onChange={(e) => setForm((f) => ({ ...f, subservice: e.target.value }))}
                placeholder="Pilih atau tulis"
              />
              <datalist id="subservice-options">
                {subservices.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {textField("no_simf", "No. izin (NO_SIMF)")}
            {textField("site_id", "Site ID")}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {textField("station_name", "Nama stasiun")}
            {textField("callsign", "Callsign")}
            {textField("bandwidth", "Lebar pita")}
          </div>

          {textField("station_address", "Alamat stasiun")}

          <div className="grid gap-4 sm:grid-cols-3">
            {NUM_FIELDS.map((f) => (
              <div key={f.key} className="grid gap-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  inputMode="decimal"
                  value={nums[f.key]}
                  onChange={(e) => setNums((n) => ({ ...n, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {textField("village", "Desa/Kelurahan")}
            {textField("district", "Kecamatan")}
            {textField("city", "Kota/Kabupaten")}
            {textField("province", "Provinsi")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {textField("licence_date", "Tanggal izin", undefined, "date")}
            {textField("validity_date", "Masa berlaku", undefined, "date")}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {record ? "Simpan perubahan" : "Tambah data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
