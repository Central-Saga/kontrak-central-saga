import Link from "next/link";
import { redirect } from "next/navigation";

import {
  updateAccountPasswordAction,
  updateAccountProfileAction,
  updateProfilePhotoAction,
} from "@/app/(app)/app/settings/actions";
import { readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { buildSessionExpiredRedirectPath, LOGIN_PATH, readSessionState } from "@/lib/auth";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { ThemePreferenceCard } from "@/components/settings/theme-preference-card";
import { UserAvatar } from "@/components/user-avatar";

const statusMessages = {
  avatar_updated: "Foto profil berhasil dikirim untuk diperbarui.",
  password_updated: "Password akun berhasil diperbarui.",
  profile_updated: "Profil akun berhasil diperbarui.",
};

export default async function SettingsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const session = await readSessionState();

  if (session.status === "guest") {
    redirect(LOGIN_PATH);
  }

  if (session.status === "stale") {
    redirect(buildSessionExpiredRedirectPath());
  }

  const resolvedSearchParams = await searchParams;
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const profileAction = updateAccountProfileAction.bind(null, "/app/settings");
  const passwordAction = updateAccountPasswordAction.bind(null, "/app/settings");
  const avatarAction = updateProfilePhotoAction.bind(null, "/app/settings");

  return (
    <PageStack data-testid="settings-page">
      <PageHeaderCard
        actionHref="/app/profile"
        actionLabel="Kembali ke profil"
        description="Pengaturan akun kini merangkum profil, keamanan, dan tema tampilan dalam satu alur yang rapi agar perubahan identitas akun tetap konsisten dengan shell aplikasi."
        eyebrow="Akun saya"
        title="Pengaturan akun"
      />

      <StatusBanner error={error ?? undefined} messages={statusMessages} status={status} />

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-2xl">Profil akun</CardTitle>
          <CardDescription>
            Nama, username, email, dan avatar menggunakan data akun aktif dari backend. Semua pembaruan tetap dikirim lewat server action agar token sesi tidak pernah bocor ke sisi klien.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col gap-5">
            <div className="rounded-[2rem] border border-line bg-card-strong p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <UserAvatar
                  className="size-24 border border-border/70"
                  fallbackClassName="text-2xl"
                  imageUrl={session.user.avatarUrl}
                  name={session.user.name}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-semibold text-foreground">{session.user.name}</p>
                  <p className="text-sm text-muted">{session.user.email}</p>
                  <p className="text-sm text-muted">{session.user.username ? `@${session.user.username}` : "Username belum diatur"}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-line bg-background px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Nama</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{session.user.name}</p>
                </div>
                <div className="rounded-3xl border border-line bg-background px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Username</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{session.user.username ? `@${session.user.username}` : "Belum ada"}</p>
                </div>
                <div className="rounded-3xl border border-line bg-background px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Email</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{session.user.email}</p>
                </div>
              </div>
            </div>

            <Card className="rounded-[2rem] bg-card-strong shadow-none">
              <CardHeader className="gap-3 p-6">
                <CardTitle className="text-xl">Perbarui avatar</CardTitle>
                <CardDescription>
                  Gunakan gambar JPG, PNG, WEBP, atau GIF. Avatar baru akan langsung dipakai oleh menu pengguna dan halaman profil setelah backend menyimpan perubahan.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form action={avatarAction} className="flex flex-col gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="profile-photo-input">Berkas foto</FieldLabel>
                      <Input
                        accept="image/gif,image/jpeg,image/png,image/webp"
                        data-testid="profile-photo-input"
                        id="profile-photo-input"
                        name="avatar"
                        type="file"
                      />
                      <FieldDescription>
                        Pilih satu berkas gambar yang mewakili identitas akun Anda dengan jelas.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button data-testid="profile-photo-submit" size="lg" type="submit">
                      Unggah avatar
                    </Button>
                    <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/profile">
                      Lihat profil
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <form action={profileAction} className="flex flex-col gap-6 rounded-[2rem] border border-line bg-card-strong p-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="settings-name">Nama akun</FieldLabel>
                <Input data-testid="settings-name-input" defaultValue={session.user.name} id="settings-name" name="name" required />
                <FieldDescription>
                  Nama ini muncul di navbar, profil, dan area ringkasan akun lain di dalam aplikasi.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-username">Username</FieldLabel>
                <Input
                  data-testid="settings-username-input"
                  defaultValue={session.user.username ?? ""}
                  id="settings-username"
                  name="username"
                  placeholder="mis. central-admin"
                />
                <FieldDescription>
                  Username bersifat opsional, tetapi membantu membuat identitas akun lebih ringkas dan mudah dikenali.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-email">Email</FieldLabel>
                <Input
                  data-testid="settings-email-input"
                  defaultValue={session.user.email}
                  id="settings-email"
                  name="email"
                  required
                  type="email"
                />
                <FieldDescription>
                  Email dipakai sebagai identitas login utama, jadi pastikan tetap aktif dan dapat diakses.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center gap-3">
              <Button data-testid="settings-profile-submit" size="lg" type="submit">
                Simpan profil akun
              </Button>
              <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/profile">
                Batal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-2xl">Keamanan akun</CardTitle>
            <CardDescription>
              Ganti password langsung dari frontend menggunakan endpoint keamanan backend baru. Bagian ini sengaja dipisah dari profil agar perubahan sensitif lebih mudah ditinjau.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="settings-current-password">Password saat ini</FieldLabel>
                  <Input
                    data-testid="settings-current-password-input"
                    id="settings-current-password"
                    name="current_password"
                    required
                    type="password"
                  />
                  <FieldDescription>
                    Masukkan password aktif untuk memastikan perubahan dilakukan oleh pemilik akun yang sah.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="settings-password">Password baru</FieldLabel>
                  <Input
                    data-testid="settings-password-input"
                    id="settings-password"
                    minLength={8}
                    name="password"
                    required
                    type="password"
                  />
                  <FieldDescription>
                    Gunakan kombinasi minimal delapan karakter dengan huruf besar, huruf kecil, angka, atau simbol agar lebih kuat.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="settings-password-confirmation">Konfirmasi password baru</FieldLabel>
                  <Input
                    data-testid="settings-password-confirmation-input"
                    id="settings-password-confirmation"
                    minLength={8}
                    name="password_confirmation"
                    required
                    type="password"
                  />
                  <FieldDescription>
                    Ulangi password baru yang sama agar perubahan tidak tersimpan dengan salah ketik.
                  </FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex flex-wrap items-center gap-3">
                <Button data-testid="settings-password-submit" size="lg" type="submit">
                  Ganti password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-2xl">Panduan reset & alur keamanan</CardTitle>
            <CardDescription>
              Frontend ini belum membuat alur reset password mandiri. Bila lupa password, gunakan prosedur operasional yang sudah berlaku agar akun tetap aman dan mudah diaudit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-3xl border border-line bg-card-strong p-5 text-sm leading-7 text-muted">
              Bila Anda lupa password, keluar dari perangkat bersama, lalu hubungi administrator internal untuk membantu proses reset dari sisi backend atau panel operasional yang berwenang.
            </div>
            <div className="rounded-3xl border border-line bg-card-strong p-5 text-sm leading-7 text-muted">
              Setelah password berhasil diganti, gunakan kombinasi baru tersebut untuk login berikutnya. Hindari memakai password yang sama dengan sistem lain dan simpan di pengelola kata sandi bila diperlukan.
            </div>
            <div className="rounded-3xl border border-line bg-card-strong p-5 text-sm leading-7 text-muted">
              Jika perubahan keamanan dilakukan di perangkat publik atau bersama, pastikan Anda keluar dari sesi setelah selesai bekerja.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-2xl">Tema tampilan</CardTitle>
          <CardDescription>
            Pilih tampilan terang, gelap, atau ikuti sistem. Preferensi ini tersimpan di browser agar pengalaman shell aplikasi tetap konsisten pada kunjungan berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePreferenceCard />
        </CardContent>
      </Card>
    </PageStack>
  );
}
