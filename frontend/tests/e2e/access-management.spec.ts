import { expect, test, type Page } from "@playwright/test";

const adminEmail = "admin@centralsaga.test";
const adminPassword = "password";

async function login(page: Page, email = adminEmail, password = adminPassword) {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/app");
}

async function expectExportDownload(
  page: Page,
  requests: string[],
  resource: "users" | "roles" | "permissions",
  format: "csv" | "pdf",
) {
  const requestCount = requests.length;

  await page.getByTestId(`${resource}-export-trigger`).click();
  await expect(page.getByTestId(`${resource}-export-csv`)).toBeVisible();
  await expect(page.getByTestId(`${resource}-export-pdf`)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId(`${resource}-export-${format}`).click();

  const download = await downloadPromise;

  await expect.poll(() => requests.length).toBe(requestCount + 1);
  expect(download.suggestedFilename()).toBe(`${resource}.${format}`);

  return new URL(requests.at(-1) ?? "http://localhost");
}

test("app shell keeps sidebar full-height while only content pane scrolls and nav routes work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 420 });
  await login(page);

  const sidebar = page.getByTestId("app-sidebar");
  const scrollRegion = page.getByTestId("app-shell-scroll-region");

  await expect(page).toHaveURL(/\/app$/);
  await expect(scrollRegion).toBeVisible();
  await expect(page.getByTestId("sidebar-nav-permissions")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Beranda");
  await expect(page.getByTestId("app-sidebar-footer")).not.toContainText(adminEmail);

  await expect
    .poll(async () =>
      scrollRegion.evaluate((node) => ({
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      })),
    )
    .toMatchObject({
      clientHeight: expect.any(Number),
      scrollHeight: expect.any(Number),
    });

  const beforeSidebarBox = await sidebar.boundingBox();
  const beforeFooterGap = await Promise.all([sidebar.boundingBox(), page.getByTestId("app-sidebar-footer").boundingBox()]).then(
    ([sidebarBox, footerBox]) => {
      if (!sidebarBox || !footerBox) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.abs(sidebarBox.y + sidebarBox.height - (footerBox.y + footerBox.height));
    },
  );

  const scrollMetrics = await scrollRegion.evaluate((node) => {
    node.scrollTop = node.scrollHeight;

    return {
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      scrollTop: node.scrollTop,
    };
  });

  if (scrollMetrics.scrollHeight > scrollMetrics.clientHeight) {
    expect(scrollMetrics.scrollTop).toBeGreaterThan(0);
  } else {
    expect(scrollMetrics.scrollTop).toBe(0);
  }

  await expect.poll(async () => page.evaluate(() => Math.abs(window.scrollY))).toBeLessThan(24);

  const afterSidebarBox = await sidebar.boundingBox();
  const afterFooterGap = await Promise.all([sidebar.boundingBox(), page.getByTestId("app-sidebar-footer").boundingBox()]).then(
    ([sidebarBox, footerBox]) => {
      if (!sidebarBox || !footerBox) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.abs(sidebarBox.y + sidebarBox.height - (footerBox.y + footerBox.height));
    },
  );

  expect(beforeSidebarBox).not.toBeNull();
  expect(afterSidebarBox).not.toBeNull();
  expect(Math.abs((afterSidebarBox?.y ?? 0) - (beforeSidebarBox?.y ?? 0))).toBeLessThan(1);
  expect(beforeFooterGap).toBeLessThan(24);
  expect(afterFooterGap).toBeLessThan(24);

  await page.getByTestId("sidebar-nav-users").click();
  await expect(page).toHaveURL(/\/app\/users$/);
  await expect(page.getByTestId("users-list-page")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Pengguna");

  await page.getByTestId("sidebar-nav-roles").click();
  await expect(page).toHaveURL(/\/app\/roles(\?|$)/);
  await expect(page.getByTestId("roles-list-page")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Peran");

  await page.getByTestId("sidebar-nav-permissions").click();
  await expect(page).toHaveURL(/\/app\/permissions$/);
  await expect(page.getByTestId("permissions-list-page")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Izin akses");
  await expect(page.getByText("read users")).toHaveCount(0);
  await expect(page.getByTestId("permissions-module-trigger-users")).toBeVisible();
  await page.getByTestId("permissions-module-trigger-users").click();
  await expect(page.getByText("Baca pengguna")).toBeVisible();
  await expect(
    page.getByTestId("permissions-list-page").getByRole("button", { name: /Tambah|Simpan|Hapus/i }),
  ).toHaveCount(0);
});

test("menu profil membuka pengaturan akun yang mendukung profil, keamanan, tema, dan validasi avatar", async ({ page }) => {
  await login(page);

  await page.getByTestId("user-menu-trigger").click();
  await page.getByRole("menuitem", { name: "Profil" }).click();

  await expect(page).toHaveURL(/\/app\/profile$/);
  await expect(page.getByTestId("profile-page")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Profil");

  await page.getByRole("link", { name: "Buka pengaturan" }).click();

  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByTestId("settings-page")).toBeVisible();
  await expect(page.getByTestId("settings-name-input")).toHaveValue(/.+/);
  await expect(page.getByTestId("settings-email-input")).toHaveValue(adminEmail);
  await expect(page.getByTestId("profile-photo-input")).toBeVisible();

  await page.getByTestId("settings-profile-submit").click();

  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByText("Profil akun berhasil diperbarui.")).toBeVisible();

  await page.getByTestId("theme-option-dark").click();

  await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("kcs-theme-preference"))).toBe("dark");

  await page.reload();

  await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  await expect(page.getByTestId("theme-option-dark")).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("settings-current-password-input").fill("password-salah");
  await page.getByTestId("settings-password-input").fill("PasswordBaru123!");
  await page.getByTestId("settings-password-confirmation-input").fill("PasswordBaru123!");
  await page.getByTestId("settings-password-submit").click();

  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByText("Password saat ini tidak sesuai.")).toBeVisible();

  await page.getByTestId("profile-photo-submit").click();

  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByText("Pilih file foto profil terlebih dahulu.")).toBeVisible();
});

test("roles module supports search create edit and delete happy path", async ({ page }) => {
  const seed = Date.now();
  const createdName = `playwright-role-${seed}`;
  const updatedName = `playwright-role-updated-${seed}`;

  await login(page);
  await page.goto("/app/roles");
  await expect(page.getByTestId("roles-list-page")).toBeVisible();

  await page.getByRole("link", { name: "Tambah peran" }).click();
  await expect(page).toHaveURL(/\/app\/roles\/new$/);

  await page.getByTestId("role-form-name").fill(createdName);
  await page.getByTestId("role-permissions-module-trigger-users").click();
  await page.getByTestId("role-permissions-module-select-all-users").click();
  await expect(page.getByLabel("Baca pengguna")).toBeChecked();
  await page.getByTestId("role-permissions-module-clear-all-users").click();
  await expect(page.getByLabel("Baca pengguna")).not.toBeChecked();
  await page.getByTestId("role-permissions-select-all").click();
  await expect(page.getByLabel("Baca pengguna")).toBeChecked();
  await page.getByTestId("role-permissions-clear-all").click();
  await expect(page.getByLabel("Baca pengguna")).not.toBeChecked();
  await page.getByLabel("Baca pengguna").check();
  await page.getByTestId("role-form-submit").click();

  await expect(page).toHaveURL(new RegExp(`/app/roles/\\d+/edit$`));
  await expect(page.getByText(createdName)).toBeVisible();
  await expect(page.getByText("read users")).toHaveCount(0);

  const roleId = page.url().match(/\/app\/roles\/(\d+)\/edit$/)?.[1];
  expect(roleId).toBeTruthy();

  await page.getByTestId("role-form-name").fill(updatedName);
  await page.getByTestId("role-form-submit").click();

  await expect(page).toHaveURL(new RegExp(`/app/roles/\\d+/edit$`));
  await expect(page.getByText(updatedName)).toBeVisible();

  await page.goto(`/app/roles?search=${encodeURIComponent(updatedName)}`);
  await expect(page.getByTestId("roles-list-page")).toBeVisible();
  await expect(page.getByText(updatedName)).toBeVisible();

  const editRoleLink = page.getByRole("link", { name: `Ubah ${updatedName}` });
  await editRoleLink.hover();
  await expect(page.getByRole("tooltip")).toContainText("Ubah");

  await page.getByTestId(`roles-row-permissions-${roleId}`).click();
  await expect(page.getByRole("heading", { name: "Detail izin akses" })).toBeVisible();
  await expect(page.getByText("Baca pengguna")).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();
  await expect(page.getByRole("heading", { name: "Detail izin akses" })).toHaveCount(0);

  await editRoleLink.click();
  await expect(page).toHaveURL(new RegExp(`/app/roles/${roleId}/edit$`));

  await page.getByRole("button", { name: "Hapus peran" }).click();
  await expect(page.getByRole("heading", { name: "Hapus peran ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();

  await expect(page).toHaveURL(/\/app\/roles(\?|$)/);
  await expect(page.getByText("Peran berhasil dihapus.")).toBeVisible();
});

test("users module supports single-role assignment and icon-only row actions", async ({ page }) => {
  const seed = Date.now();
  const roleName = `playwright-user-role-${seed}`;
  const userName = `Playwright User ${seed}`;
  const userEmail = `playwright-user-${seed}@centralsaga.test`;

  await login(page);

  await page.goto("/app/roles/new");
  await expect(page).toHaveURL(/\/app\/roles\/new$/);
  await page.getByTestId("role-form-name").fill(roleName);
  await page.getByTestId("role-form-submit").click();
  await expect(page).toHaveURL(new RegExp(`/app/roles/\\d+/edit$`));

  await page.goto("/app/users/new");
  await expect(page).toHaveURL(/\/app\/users\/new$/);

  await page.getByTestId("user-form-name").fill(userName);
  await page.getByTestId("user-form-email").fill(userEmail);
  await page.getByTestId("user-form-password").fill("PasswordBaru123!");
  await expect(page.getByTestId("role_ids-option-empty")).toBeChecked();
  await page.getByLabel(roleName).check();
  await expect(page.getByLabel(roleName)).toBeChecked();
  await expect(page.getByTestId("role_ids-option-empty")).not.toBeChecked();
  await page.getByTestId("user-form-submit").click();

  await expect(page).toHaveURL(/\/app\/users(\?|$)/);
  await expect(page.getByText("Pengguna baru berhasil ditambahkan.")).toBeVisible();

  await page.getByTestId("users-search-input").fill(userEmail);
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(page.getByText(userEmail)).toBeVisible();

  const editUserLink = page.getByRole("link", { name: `Ubah ${userName}` });
  await editUserLink.hover();
  await expect(page.getByRole("tooltip")).toContainText("Ubah");
  await editUserLink.click();

  await expect(page).toHaveURL(new RegExp(`/app/users/\\d+/edit$`));
  await expect(page.getByLabel(roleName)).toBeChecked();
  await page.getByTestId("role_ids-option-empty").check();
  await expect(page.getByTestId("role_ids-option-empty")).toBeChecked();
  await expect(page.getByLabel(roleName)).not.toBeChecked();
  await page.getByTestId("user-form-submit").click();

  await expect(page).toHaveURL(/\/app\/users(\?|$)/);
  await expect(page.getByText("Data pengguna berhasil diperbarui.")).toBeVisible();

  await page.getByTestId("users-search-input").fill(userEmail);
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(page.getByText(userEmail)).toBeVisible();
  await page.getByRole("button", { name: `Hapus ${userName}` }).click();
  await expect(page.getByRole("heading", { name: "Hapus data ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(page).toHaveURL(/\/app\/users(\?|$)/);
  await expect(page.getByText("Pengguna berhasil dihapus.")).toBeVisible();

  await page.goto(`/app/roles?search=${encodeURIComponent(roleName)}`);
  await expect(page.getByText(roleName)).toBeVisible();
  await page.getByRole("button", { name: `Hapus ${roleName}` }).click();
  await expect(page.getByRole("heading", { name: "Hapus data ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(page).toHaveURL(/\/app\/roles(\?|$)/);
  await expect(page.getByText("Peran berhasil dihapus.")).toBeVisible();
});

test("access-management export actions show both formats and keep the active query string", async ({ page }) => {
  const requests: string[] = [];

  await page.route("**/api/access-management/exports/**", async (route) => {
    const requestUrl = route.request().url();
    const parsedUrl = new URL(requestUrl);
    const resource = parsedUrl.pathname.split("/").at(-1) ?? "export";
    const format = parsedUrl.searchParams.get("format") === "pdf" ? "pdf" : "csv";

    requests.push(requestUrl);

    await route.fulfill({
      body: format === "pdf" ? "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF" : "id,nama\n1,Contoh\n",
      headers: {
        "content-disposition": `attachment; filename="${resource}.${format}"`,
        "content-type": format === "pdf" ? "application/pdf" : "text/csv; charset=utf-8",
      },
      status: 200,
    });
  });

  await login(page);

  await page.goto("/app/users?search=admin%40centralsaga.test&page=2&status=created");
  await expect(page.getByTestId("users-list-page")).toBeVisible();

  const usersCsvUrl = await expectExportDownload(page, requests, "users", "csv");
  expect(usersCsvUrl.searchParams.get("search")).toBe("admin@centralsaga.test");
  expect(usersCsvUrl.searchParams.get("page")).toBe("2");
  expect(usersCsvUrl.searchParams.get("format")).toBe("csv");
  expect(usersCsvUrl.searchParams.has("status")).toBe(false);

  await page.goto("/app/users?search=admin%40centralsaga.test&page=2&status=created");
  await expect(page.getByTestId("users-list-page")).toBeVisible();

  const usersPdfUrl = await expectExportDownload(page, requests, "users", "pdf");
  expect(usersPdfUrl.searchParams.get("search")).toBe("admin@centralsaga.test");
  expect(usersPdfUrl.searchParams.get("page")).toBe("2");
  expect(usersPdfUrl.searchParams.get("format")).toBe("pdf");
  expect(usersPdfUrl.searchParams.has("status")).toBe(false);

  await page.goto("/app/roles?search=admin&page=3&error=backend_unavailable");
  await expect(page.getByTestId("roles-list-page")).toBeVisible();

  const rolesCsvUrl = await expectExportDownload(page, requests, "roles", "csv");
  expect(rolesCsvUrl.searchParams.get("search")).toBe("admin");
  expect(rolesCsvUrl.searchParams.get("page")).toBe("3");
  expect(rolesCsvUrl.searchParams.get("format")).toBe("csv");
  expect(rolesCsvUrl.searchParams.has("error")).toBe(false);

  await page.goto("/app/roles?search=admin&page=3&error=backend_unavailable");
  await expect(page.getByTestId("roles-list-page")).toBeVisible();

  const rolesPdfUrl = await expectExportDownload(page, requests, "roles", "pdf");
  expect(rolesPdfUrl.searchParams.get("search")).toBe("admin");
  expect(rolesPdfUrl.searchParams.get("page")).toBe("3");
  expect(rolesPdfUrl.searchParams.get("format")).toBe("pdf");
  expect(rolesPdfUrl.searchParams.has("error")).toBe(false);

  await page.goto("/app/permissions");
  await expect(page.getByTestId("permissions-list-page")).toBeVisible();

  const permissionsCsvUrl = await expectExportDownload(page, requests, "permissions", "csv");
  expect(permissionsCsvUrl.searchParams.get("format")).toBe("csv");

  await page.goto("/app/permissions");
  await expect(page.getByTestId("permissions-list-page")).toBeVisible();

  const permissionsPdfUrl = await expectExportDownload(page, requests, "permissions", "pdf");
  expect(permissionsPdfUrl.searchParams.get("format")).toBe("pdf");
});

test("clients module supports search create edit and delete happy path", async ({ page }) => {
  const seed = Date.now();
  const clientCode = `CLI-${seed}`;
  const updatedClientCode = `CLI-${seed}-UPD`;
  const companyName = `PT Playwright Client ${seed}`;
  const updatedCompanyName = `PT Playwright Client Updated ${seed}`;
  const email = `client-${seed}@centralsaga.test`;

  await login(page);
  await page.goto("/app/clients");
  await expect(page.getByTestId("clients-list-page")).toBeVisible();

  await page.getByRole("link", { name: "Tambah klien" }).click();
  await expect(page).toHaveURL(/\/app\/clients\/new$/);

  await page.getByTestId("client-form-code").fill(clientCode);
  await page.getByTestId("client-form-company").fill(companyName);
  await page.getByTestId("client-form-contact").fill("Budi Hartono");
  await page.getByTestId("client-form-email").fill(email);
  await page.getByTestId("client-form-phone").fill("081234567890");
  await page.getByTestId("client-form-address").fill("Jl. Klien No. 1");
  await page.getByTestId("client-form-portal-access").check();
  await page.getByTestId("client-form-submit").click();

  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);
  await expect(page.getByText("Klien baru berhasil ditambahkan.")).toBeVisible();

  await page.getByTestId("clients-search-input").fill(clientCode);
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(page.getByText(companyName)).toBeVisible();

  await page.getByRole("link", { name: `Ubah ${companyName}` }).click();
  await expect(page).toHaveURL(new RegExp(`/app/clients/\\d+/edit$`));
  await page.getByTestId("client-form-code").fill(updatedClientCode);
  await page.getByTestId("client-form-company").fill(updatedCompanyName);
  await page.getByTestId("client-form-submit").click();

  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);
  await expect(page.getByText("Data klien berhasil diperbarui.")).toBeVisible();

  await page.getByTestId("clients-search-input").fill(updatedClientCode);
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(page.getByText(updatedCompanyName)).toBeVisible();
  await page.getByRole("link", { name: `Lihat detail ${updatedCompanyName}` }).click();
  await expect(page).toHaveURL(new RegExp(`/app/clients/\\d+$`));
  await expect(page.getByTestId("client-detail-page")).toBeVisible();
  await expect(page.getByText(updatedCompanyName)).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke daftar" }).click();
  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);

  await page.getByRole("button", { name: `Hapus ${updatedCompanyName}` }).click();
  await expect(page.getByRole("heading", { name: "Hapus data ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();

  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);
  await expect(page.getByText("Klien berhasil dihapus.")).toBeVisible();
});

test("contracts module supports search create edit and delete happy path", async ({ page }) => {
  const seed = Date.now();
  const clientCode = `CTR-CLI-${seed}`;
  const clientName = `PT Kontrak Client ${seed}`;
  const contractNumber = `KTR-${seed}`;
  const updatedContractNumber = `KTR-${seed}-UPD`;
  const contractTitle = `Kontrak Playwright ${seed}`;
  const updatedContractTitle = `Kontrak Playwright Updated ${seed}`;

  await login(page);

  await page.goto("/app/clients/new");
  await expect(page).toHaveURL(/\/app\/clients\/new$/);
  await page.getByTestId("client-form-code").fill(clientCode);
  await page.getByTestId("client-form-company").fill(clientName);
  await page.getByTestId("client-form-status").selectOption("active");
  await page.getByTestId("client-form-submit").click();
  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);
  await expect(page.getByText("Klien baru berhasil ditambahkan.")).toBeVisible();

  await page.goto("/app/contracts");
  await expect(page.getByTestId("contracts-list-page")).toBeVisible();

  await page.getByRole("link", { name: "Tambah kontrak" }).click();
  await expect(page).toHaveURL(/\/app\/contracts\/new$/);

  await page.getByTestId("contract-form-client").selectOption({ label: `${clientCode} — ${clientName}` });
  await page.getByTestId("contract-form-number").fill(contractNumber);
  await page.getByTestId("contract-form-title").fill(contractTitle);
  await page.getByTestId("contract-form-project").fill("Proyek Playwright");
  await page.getByTestId("contract-form-date").fill("2026-04-03");
  await page.getByTestId("contract-form-start-date").fill("2026-04-03");
  await page.getByTestId("contract-form-end-date").fill("2026-12-31");
  await page.getByTestId("contract-form-value").fill("150000000");
  await page.getByTestId("contract-form-scope").fill("Implementasi sistem kontrak perusahaan");
  await page.getByTestId("contract-form-payment-scheme").fill("Termin 30/70");
  await page.getByTestId("contract-form-notes").fill("Catatan pengujian Playwright");
  await page.getByTestId("contract-form-submit").click();

  await expect(page).toHaveURL(/\/app\/contracts\/\d+\/edit(\?|$)/);
  await expect(page.getByText(contractNumber)).toBeVisible();

  await page.getByTestId("contract-form-number").fill(updatedContractNumber);
  await page.getByTestId("contract-form-title").fill(updatedContractTitle);
  await page.getByTestId("contract-form-submit").click();

  await expect(page).toHaveURL(/\/app\/contracts(\?|$)/);
  await expect(page.getByText("Data kontrak berhasil diperbarui.")).toBeVisible();

  await page.getByTestId("contracts-search-input").fill(updatedContractNumber);
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(page.getByText(updatedContractTitle)).toBeVisible();
  await page.getByRole("link", { name: `Lihat detail ${updatedContractNumber}` }).click();
  await expect(page).toHaveURL(new RegExp(`/app/contracts/\\d+$`));
  await expect(page.getByTestId("contract-detail-page")).toBeVisible();
  await expect(page.getByText(updatedContractTitle)).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke daftar" }).click();
  await expect(page).toHaveURL(/\/app\/contracts(\?|$)/);

  await page.getByRole("button", { name: `Hapus ${updatedContractNumber}` }).click();
  await expect(page.getByRole("heading", { name: "Hapus data ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();

  await expect(page).toHaveURL(/\/app\/contracts(\?|$)/);
  await expect(page.getByText("Kontrak berhasil dihapus.")).toBeVisible();

  await page.goto(`/app/clients?search=${encodeURIComponent(clientCode)}`);
  await expect(page.getByText(clientName)).toBeVisible();
  await page.getByRole("button", { name: `Hapus ${clientName}` }).click();
  await expect(page.getByRole("heading", { name: "Hapus data ini?" })).toBeVisible();
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(page).toHaveURL(/\/app\/clients(\?|$)/);
  await expect(page.getByText("Klien berhasil dihapus.")).toBeVisible();
});
