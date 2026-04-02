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
  await expect(page).toHaveURL(/\/app\/roles$/);
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
  await expect(page.getByTestId("settings-username-input")).toBeVisible();
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

  await page.getByTestId("role-form-name").fill(updatedName);
  await page.getByTestId("role-form-submit").click();

  await expect(page).toHaveURL(new RegExp(`/app/roles/\\d+/edit$`));
  await expect(page.getByText(updatedName)).toBeVisible();

  await page.getByRole("button", { name: "Hapus peran" }).click();

  await expect(page).toHaveURL(/\/app\/roles$/);
  await expect(page.getByText("Peran berhasil dihapus.")).toBeVisible();
});
