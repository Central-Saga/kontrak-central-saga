import Link from "next/link";
import { redirect } from "next/navigation";

import { buildSessionExpiredRedirectPath, LOGIN_PATH, readSessionState } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeaderCard, PageStack, PillList } from "@/components/access-management/shared";
import { UserAvatar } from "@/components/user-avatar";

export default async function ProfilePage() {
  const session = await readSessionState();

  if (session.status === "guest") {
    redirect(LOGIN_PATH);
  }

  if (session.status === "stale") {
    redirect(buildSessionExpiredRedirectPath());
  }

  return (
    <PageStack data-testid="profile-page">
      <PageHeaderCard
        actionHref="/app/settings"
        actionLabel="Buka pengaturan"
        description="Profil hanya ditampilkan di navbar atas agar identitas pengguna tidak ganda. Halaman ini merangkum akun aktif dan mengarahkan Anda ke pengaturan bila ingin memperbarui foto profil."
        eyebrow="Akun saya"
        title="Profil akun"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-2xl">Identitas aktif</CardTitle>
            <CardDescription>
              Informasi ini mengikuti sesi autentikasi yang sedang dipakai oleh aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                className="size-24 border border-border/70"
                fallbackClassName="text-2xl"
                imageUrl={session.user.avatarUrl}
                name={session.user.name}
              />
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-semibold text-foreground">{session.user.name}</p>
                <p className="text-sm text-muted break-all">{session.user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-line bg-card-strong p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Peran</p>
                <div className="mt-3">
                  <PillList emptyLabel="Belum ada peran." items={session.user.roles} />
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-card-strong p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Izin yang terbaca</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{session.user.permissions.length}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Daftar lengkapnya tersedia di halaman izin akses baca-saja.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-2xl">Foto profil</CardTitle>
            <CardDescription>
              Foto avatar yang tampil di navbar atas dikelola lewat pengaturan akun agar titik editnya tetap satu alur.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-3xl border border-line bg-card-strong p-5 text-sm leading-7 text-muted">
              Setelah foto diperbarui dari halaman pengaturan, avatar baru akan tampil di menu pengguna pada navbar atas.
            </div>
            <Link className={buttonVariants({ size: "lg" })} href="/app/settings">
              Ubah foto profil
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageStack>
  );
}
