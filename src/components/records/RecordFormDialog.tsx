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
  freq: null,
  city: "",
  province: "",
};

export function RecordFormDialog({
  open,
  onOpenChange,
  record,
  subservices,
  saving,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<RecordInput>(EMPTY);
  const [freqText, setFreqText] = useState("");
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
        freq: record.freq,
        city: record.city ?? "",
        province: record.province ?? "",
      });
      setFreqText(record.freq === null ? "" : String(record.freq));
    } else {
      setForm({ ...EMPTY, subservice: subservices[0] ?? "" });
      setFreqText("");
    }
  }, [open, record, subservices]);

  const submit = () => {
    if (!form.item_name.trim()) return setError("Client name is required.");
    if (!form.subservice.trim()) return setError("Subservice is required.");
    const freq = freqText.trim() === "" ? null : Number(freqText);
    if (freq !== null && Number.isNaN(freq)) return setError("Frequency must be a number.");
    setError(null);
    const clean = (v: string | null) => {
      const t = (v ?? "").trim();
      return t === "" ? null : t;
    };
    onSubmit({
      ...form,
      item_name: form.item_name.trim(),
      subservice: form.subservice.trim(),
      no_simf: clean(form.no_simf),
      site_id: clean(form.site_id),
      station_name: clean(form.station_name),
      city: clean(form.city),
      province: clean(form.province),
      freq,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "Edit record" : "Add record"}</DialogTitle>
          <DialogDescription>
            {record
              ? "Update the details of this licence record."
              : "Create a new licence record in the dataset."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="item_name">Client name</Label>
            <Input
              id="item_name"
              value={form.item_name}
              onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
              placeholder="e.g. INDOSAT TBK, PT."
            />
          </div>

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
                placeholder="Select or type"
              />
              <datalist id="subservice-options">
                {subservices.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="no_simf">Licence no. (NO_SIMF)</Label>
              <Input
                id="no_simf"
                value={form.no_simf ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, no_simf: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="site_id">Site ID</Label>
              <Input
                id="site_id"
                value={form.site_id ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="station_name">Station name</Label>
              <Input
                id="station_name"
                value={form.station_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, station_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="freq">Frequency (MHz)</Label>
              <Input
                id="freq"
                inputMode="decimal"
                value={freqText}
                onChange={(e) => setFreqText(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="province">Province</Label>
              <Input
                id="province"
                value={form.province ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              />
            </div>
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

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {record ? "Save changes" : "Create record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
