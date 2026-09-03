import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  insertRecordsBatched,
  parseImportFile,
  type ParsedImport,
} from "@/lib/import-records";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export function ImportDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setParsed(null);
    setProgress(0);
    setParsing(false);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setParsed(null);
    try {
      setParsed(await parseImportFile(file));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const runImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const n = await insertRecordsBatched(parsed.rows, (done, total) =>
        setProgress(Math.round((done / total) * 100)),
      );
      toast.success(`${n.toLocaleString()} record berhasil diimpor`);
      onImported();
      onOpenChange(false);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (importing) return;
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor data dari Excel / CSV</DialogTitle>
          <DialogDescription>
            Unggah file .xlsx, .xls, atau .csv. Baris pertama harus berisi nama kolom
            (mis. item_name/klien, main_service, subservice, status, no izin, site id,
            nama stasiun, frekuensi, kota, provinsi).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={parsing || importing}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/60"
          >
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">
              {parsing ? "Membaca file…" : "Pilih file Excel atau CSV"}
            </span>
            <span className="text-xs text-muted-foreground">.xlsx, .xls, .csv</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />

          {parsed && (
            <div className="space-y-3 rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{parsed.fileName}</p>
              <p className="text-muted-foreground">
                {parsed.rows.length.toLocaleString()} baris siap diimpor
                {parsed.skipped > 0 &&
                  ` · ${parsed.skipped} baris tanpa nama klien dilewati`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.matched.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
              {parsed.missing.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Kolom tidak ditemukan (akan dikosongkan): {parsed.missing.join(", ")}
                </p>
              )}
              {importing && <Progress value={progress} />}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Batal
          </Button>
          <Button onClick={runImport} disabled={!parsed || parsed.rows.length === 0 || importing}>
            <Upload className="h-4 w-4" />
            {importing ? `Mengimpor… ${progress}%` : "Impor data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
