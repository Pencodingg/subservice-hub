import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Filter, MapPin, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const TITLE = "Data Izin Frekuensi — Dashboard Pengelolaan Izin Stasiun";
const DESCRIPTION =
  "Kelola data izin stasiun radio: cari, filter per subservice dan provinsi, lihat koordinat, kota, dan masa berlaku izin dalam satu dashboard.";

export const Route = createFileRoute("/")({
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
  component: Landing,
});

const FEATURES = [
  {
    icon: Filter,
    title: "Filter & urutkan cepat",
    body: "Saring ribuan data izin berdasarkan subservice, provinsi, dan status izin.",
  },
  {
    icon: MapPin,
    title: "Data lokasi lengkap",
    body: "Koordinat lintang/bujur, desa, kecamatan, kota, dan provinsi tiap stasiun.",
  },
  {
    icon: ShieldCheck,
    title: "Hak akses bertingkat",
    body: "Semua pengguna terdaftar bisa melihat data; hanya super user yang bisa mengubah.",
  },
];

function Landing() {
  const { session, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <span className="font-semibold tracking-tight">Data Izin Frekuensi</span>
          </div>
          {loading ? null : session ? (
            <Button asChild>
              <Link to="/records">Buka dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">Masuk</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <section className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Kelola data izin stasiun radio dalam satu dashboard
          </h1>
          <p className="mt-4 text-muted-foreground">
            Pencarian instan, filter per subservice dan provinsi, impor berkas Excel/CSV, serta
            pembaruan data tanpa duplikat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={session ? "/records" : "/auth"}>
                {session ? "Buka dashboard" : "Masuk untuk melihat data"}
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-medium">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
