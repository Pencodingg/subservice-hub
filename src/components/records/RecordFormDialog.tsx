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
import type { RecordInput, ServiceRecord } from "@/lib/records";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: ServiceRecord | null;
  subservices: string[];
  saving: boolean;
  onSubmit: (input: RecordInput) => void;
};

const MAIN_SERVICES = ["Connectivity", "Cloud Platform", "Managed Security", "Data Center"];

const EMPTY: RecordInput = {
  item_name: "",
  main_service: "Connectivity",
  subservice: "",
  status: "Active",
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      record
        ? {
            item_name: record.item_name,
            main_service: record.main_service,
            subservice: record.subservice,
            status: record.status,
          }
        : { ...EMPTY, subservice: subservices[0] ?? "" },
    );
  }, [open, record, subservices]);

  const submit = () => {
    if (!form.item_name.trim()) return setError("Item name is required.");
    if (!form.subservice.trim()) return setError("Subservice is required.");
    setError(null);
    onSubmit({ ...form, item_name: form.item_name.trim(), subservice: form.subservice.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{record ? "Edit record" : "Add record"}</DialogTitle>
          <DialogDescription>
            {record
              ? "Update the details of this record. Changes save instantly."
              : "Create a new record in the dataset."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="item_name">Item name</Label>
            <Input
              id="item_name"
              value={form.item_name}
              onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
              placeholder="e.g. Fiber Link 01234"
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

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
