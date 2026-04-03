import Link from "next/link";

import { listClients, listContracts, listPermissionOptions, listRoles, listUsers } from "@/lib/access-management/backend";
import { handleModulePageError } from "@/lib/access-management/page";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeaderCard, PageStack, PillList } from "@/components/access-management/shared";

const overviewModules = [
  {
    title: "Pengguna",
    href: "/app/users",
    actionLabel: "Buka modul pengguna",
    description: "Akun internal, email kerja, dan peran yang menempel pada setiap pengguna sistem.",
    fetcher: async () => {
      const response = await listUsers({ perPage: 3 });

      return {
        items: response.data.map((item) => item.name),
        total: response.meta.total,
      };
    },
  },
  {
    title: "Klien",
    href: "/app/clients",
    actionLabel: "Buka modul klien",
    description: "Data perusahaan, kontak utama, dan status portal yang menjadi akar relasi untuk kontrak proyek.",
    fetcher: async () => {
      const response = await listClients({ perPage: 3 });

      return {
        items: response.data.map((item) => item.company_name),
        total: response.meta.total,
      };
    },
  },
  {
    title: "Kontrak",
    href: "/app/contracts",
    actionLabel: "Buka modul kontrak",
    description: "Ringkasan kontrak aktif, nilai proyek, dan hubungan operasional yang menjadi pusat modul pembayaran dan progres.",
    fetcher: async () => {
      const response = await listContracts({ perPage: 3 })

      return {
        items: response.data.map((item) => item.contract_number),
        total: response.meta.total,
      }
    },
  },
  {
    title: "Peran",
    href: "/app/roles",
    actionLabel: "Buka modul peran",
    description: "Peran untuk mengelompokkan akses operasional lintas modul dan penugasan izin.",
    fetcher: async () => {
      const response = await listRoles({ perPage: 3 });

      return {
        items: response.data.map((item) => item.name),
        total: response.meta.total,
      };
    },
  },
  {
    title: "Izin akses",
    href: "/app/permissions",
    actionLabel: "Lihat izin akses",
    description: "Daftar izin akses tersedia kembali sebagai referensi baca-saja yang dikelompokkan per modul dan keluarga aksi.",
    fetcher: async () => {
      const permissions = await listPermissionOptions();

      return {
        items: permissions.slice(0, 3).map((item) => item.name),
        total: permissions.length,
      };
    },
  },
];

export default async function AppHomePage() {
  const moduleResults = await Promise.allSettled(overviewModules.map((module) => module.fetcher()));

  return (
    <PageStack>
      <PageHeaderCard
        description="Workspace `/app` menjadi pintu masuk ringkas untuk modul pengguna, klien, kontrak, peran, dan izin akses. Modul izin sekarang tampil kembali sebagai halaman baca-saja, sementara identitas akun aktif dipusatkan di navbar atas."
        eyebrow="Manajemen akses"
        title="Ringkasan akses aplikasi"
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {overviewModules.map((module, index) => {
          const result = moduleResults[index];

          if (result.status === "rejected") {
            return (
              <Card key={module.title}>
                <CardHeader className="gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-muted">
                      Akses dibatasi
                    </span>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                   <p className="text-sm leading-7 text-muted">{handleModulePageError(result.reason)}</p>
                    <Link className={buttonVariants({ variant: "outline" })} href={module.href}>
                      {module.actionLabel}
                    </Link>
                </CardContent>
              </Card>
            );
          }

           const latestNames = result.value.items;

           return (
             <Card key={module.title}>
              <CardHeader className="gap-4">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-2xl">{module.title}</CardTitle>
                   <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-foreground">
                     {result.value.total} total
                   </span>
                 </div>
                 <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                 <div className="flex flex-col gap-2">
                   <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Tiga item awal</p>
                   <PillList emptyLabel="Belum ada data." items={latestNames} />
                 </div>

                 <Link className={buttonVariants({})} href={module.href}>
                   {module.actionLabel}
                 </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageStack>
  );
}
