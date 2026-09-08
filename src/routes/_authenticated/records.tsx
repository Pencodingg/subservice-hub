import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecordFormDialog } from "@/components/records/RecordFormDialog";
import { ImportDialog } from "@/components/records/ImportDialog";
import { useAuth, signOut } from "@/hooks/useAuth";
import {
  SORT_COLUMNS,
  STATUSES,
  createRecord,
  deleteRecord,
  fetchProvinces,
  fetchRecords,
  fetchSubservices,
  updateRecord,
  type RecordInput,
  type ServiceRecord,
  type SortColumn,
} from "@/lib/records";


const TITLE = "Dashboard Data Izin — Data Izin Frekuensi";
const DESCRIPTION =
  "Cari, filter, dan perbarui data izin stasiun radio lengkap dengan koordinat, kota, provinsi, dan masa berlaku izin.";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZES = [20, 30, 50];

const COLUMNS: { key: SortColumn; label: string; className?: string }[] = [
  { key: "item_name", label: "Klien / Stasiun" },
  { key: "subservice", label: "Subservice" },
  { key: "freq", label: "Frekuensi", className: "hidden lg:table-cell" },
  { key: "city", label: "Lokasi", className: "hidden md:table-cell" },
  { key: "validity_date", label: "Masa berlaku", className: "hidden lg:table-cell" },
  { key: "status", label: "Status" },
];

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtCoord = (v: number | null) => (v === null ? null : v.toFixed(5));

function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin, email } = useAuth();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subservice, setSubservice] = useState("all");
  const [status, setStatus] = useState("all");
  const [province, setProvince] = useState("all");
  const [sortBy, setSortBy] = useState<SortColumn>("last_updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, subservice, status, province, pageSize, sortBy, sortDir]);

  const params = {
    page,
    pageSize,
    search: debounced,
    subservice,
    status,
    province,
    sortBy,
    sortDir,
  };

  const recordsQuery = useQuery({
    queryKey: ["records", params],
    queryFn: () => fetchRecords(params),
    placeholderData: keepPreviousData,
  });

  const subservicesQuery = useQuery({
    queryKey: ["subservices"],
    queryFn: fetchSubservices,
    staleTime: 5 * 60_000,
  });

  const provincesQuery = useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    staleTime: 5 * 60_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["subservices"] });
    void queryClient.invalidateQueries({ queryKey: ["provinces"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (input: RecordInput) =>
      editing ? updateRecord(editing.id, input) : createRecord(input),
    onSuccess: () => {
      toast.success(editing ? "Data diperbarui" : "Data ditambahkan");
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecord(id),
    onSuccess: () => {
      toast.success("Data dihapus");
      setPendingDelete(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = recordsQuery.data?.total ?? 0;
  const rows = recordsQuery.data?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const subservices = useMemo(() => subservicesQuery.data ?? [], [subservicesQuery.data]);
  const provinces = useMemo(() => provincesQuery.data ?? [], [provincesQuery.data]);
  const colCount = COLUMNS.length + (isAdmin ? 1 : 0);

  const toggleSort = (key: SortColumn) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Data Izin Frekuensi</h1>
              <p className="text-sm text-muted-foreground">
                {email ?? "Pengguna"} · {isAdmin ? "Super user" : "Pengguna biasa"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Muat ulang data"
              onClick={() => invalidate()}
            >
              <RefreshCw className={recordsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
            {isAdmin ? (
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4" /> Impor Excel/CSV
                </Button>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Tambah data
                </Button>
              </>
            ) : null}
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <section className="panel p-4" aria-label="Filter">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari klien, stasiun, no. izin, site ID, callsign, kota"
                className="pl-9"
                aria-label="Cari data"
              />
            </div>

            <Select value={subservice} onValueChange={setSubservice}>
              <SelectTrigger className="md:w-52" aria-label="Filter subservice">
                <SelectValue placeholder="Subservice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua subservice</SelectItem>
                {subservices.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="md:w-48" aria-label="Filter provinsi">
                <SelectValue placeholder="Provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua provinsi</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-52" aria-label="Filter status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="md:w-36" aria-label="Baris per halaman">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / halaman
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Urutkan berdasarkan</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortColumn)}>
              <SelectTrigger className="w-64" aria-label="Urutkan berdasarkan kolom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {SORT_COLUMNS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as "asc" | "desc")}>
              <SelectTrigger className="w-44" aria-label="Arah pengurutan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A→Z / terkecil dulu</SelectItem>
                <SelectItem value="desc">Z→A / terbesar dulu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>


        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {COLUMNS.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {col.label}
                        {sortBy === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                      </button>
                    </TableHead>
                  ))}
                  {isAdmin ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsQuery.isPending ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: colCount }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : recordsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="py-12 text-center text-destructive">
                      Data gagal dimuat. Coba muat ulang.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">
                      Tidak ada data yang cocok dengan filter Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className={recordsQuery.isFetching ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        {r.item_name}
                        <span className="block text-xs text-muted-foreground">
                          {r.station_name ?? "—"}
                          {r.no_simf ? ` · ${r.no_simf}` : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.subservice}</Badge>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {r.main_service}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {r.freq === null ? "—" : `${r.freq} MHz`}
                        {r.bandwidth ? (
                          <span className="block text-xs text-muted-foreground">{r.bandwidth}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {r.city ?? "—"}
                        <span className="block text-xs text-muted-foreground">
                          {r.province ?? "—"}
                          {fmtCoord(r.latitude) && fmtCoord(r.longitude)
                            ? ` · ${fmtCoord(r.latitude)}, ${fmtCoord(r.longitude)}`
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {fmtDate(r.validity_date)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            r.status.startsWith("Granted")
                              ? "inline-flex items-center gap-1.5 text-sm font-medium text-success"
                              : "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                          }
                        >
                          <span
                            className={
                              r.status.startsWith("Granted")
                                ? "h-2 w-2 rounded-full bg-success"
                                : "h-2 w-2 rounded-full bg-muted-foreground/50"
                            }
                          />
                          {r.status}
                        </span>
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ubah ${r.item_name}`}
                            onClick={() => {
                              setEditing(r);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${r.item_name}`}
                            onClick={() => setPendingDelete(r)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {rangeStart.toLocaleString("id-ID")}–{rangeEnd.toLocaleString("id-ID")} dari{" "}
              {total.toLocaleString("id-ID")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {pageCount.toLocaleString("id-ID")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
              >
                Berikutnya <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {isAdmin ? (
        <>
          <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={invalidate} />

          <RecordFormDialog
            open={formOpen}
            onOpenChange={(o) => {
              setFormOpen(o);
              if (!o) setEditing(null);
            }}
            record={editing}
            subservices={subservices}
            saving={saveMutation.isPending}
            onSubmit={(input) => saveMutation.mutate(input)}
          />

          <AlertDialog
            open={pendingDelete !== null}
            onOpenChange={(o) => !o && setPendingDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingDelete?.item_name} akan dihapus permanen dan tidak bisa dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Menghapus…" : "Hapus"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
