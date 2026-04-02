import { listPermissionOptions } from "@/lib/access-management/backend";
import { buildPermissionModuleGroups } from "@/lib/access-management/permissions";
import { buildForwardedSearchParams, handleModulePageError, type PageSearchParams } from "@/lib/access-management/page";
import { ExportActionMenu } from "@/components/access-management/export-action-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateCard, PageHeaderCard, PageStack, PillList } from "@/components/access-management/shared";

export default async function PermissionsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const exportQueryString = buildForwardedSearchParams(resolvedSearchParams).toString();
  let message: string | null = null;
  let modules = [] as ReturnType<typeof buildPermissionModuleGroups>;

  try {
    const permissions = await listPermissionOptions();
    modules = buildPermissionModuleGroups(permissions);
  } catch (error) {
    message = handleModulePageError(error);
  }

  return (
    <PageStack data-testid="permissions-list-page">
      <PageHeaderCard
        description="Halaman ini hanya menampilkan katalog izin akses dari backend dalam format baca-saja. Nilai database tetap dipertahankan sebagai identifier sistem, tetapi label yang tampil ke pengguna sudah dirapikan ke Bahasa Indonesia agar lebih mudah dipindai."
        eyebrow="Manajemen akses"
        title="Izin akses"
      />

      {message ? (
        <EmptyStateCard description={message} title="Izin akses belum dapat dimuat" />
      ) : modules.length ? (
        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-2xl">Referensi izin akses</CardTitle>
              <CardDescription>
                Setiap modul diringkas di accordion tersendiri agar daftar panjang tetap nyaman dibaca tanpa membuka halaman CRUD apa pun.
              </CardDescription>
            </div>

            <ExportActionMenu moduleLabel="referensi izin akses" queryString={exportQueryString} resource="permissions" />
          </CardHeader>
          <CardContent>
            <Accordion defaultValue={modules.length ? [modules[0].moduleKey] : []} type="multiple">
              <div className="flex flex-col gap-4">
                {modules.map((moduleGroup) => (
                  <AccordionItem key={moduleGroup.moduleKey} value={moduleGroup.moduleKey}>
                    <AccordionTrigger data-testid={`permissions-module-trigger-${moduleGroup.moduleKey}`}>
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-left">{moduleGroup.moduleLabel}</span>
                          <span className="text-sm font-normal text-muted">
                            {moduleGroup.actionGroups.length} kelompok aksi • {moduleGroup.permissions.length} izin tersedia
                          </span>
                        </div>
                        <span className="rounded-full border border-line bg-background px-3 py-1 text-xs font-medium text-foreground">
                          {moduleGroup.permissions.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 border-t border-line/80 pt-4">
                      {moduleGroup.actionGroups.map((family) => (
                        <div key={`${moduleGroup.moduleKey}-${family.actionKey}`} className="rounded-3xl border border-line bg-background/80 p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground">{family.actionLabel}</p>
                              <span className="text-xs text-muted">{family.permissions.length} izin</span>
                            </div>
                            <PillList
                              emptyLabel="Belum ada izin di kelompok ini."
                              items={family.permissions.map((permission) => permission.label)}
                            />
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <EmptyStateCard
          description="Backend belum mengirim data izin akses apa pun untuk ditampilkan sebagai referensi baca-saja."
          title="Belum ada izin akses"
        />
      )}
    </PageStack>
  );
}
