import { expect, test, type Page } from "@playwright/test";

const validEmail = "e2e.user@example.com";
const validPassword = "Password123!";
const invalidPassword = "WrongPassword!";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(validEmail);
  await page.getByTestId("login-password-input").fill(validPassword);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/app");
}

test("guest is redirected from root to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("login-submit")).toBeVisible();
});

test("guest cannot access protected app route", async ({ page }) => {
  await page.goto("/app");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("login-submit")).toBeVisible();
});

test("invalid credentials stay on login and show auth error", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(validEmail);
  await page.getByTestId("login-password-input").fill(invalidPassword);
  await page.getByTestId("login-submit").click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("auth-error")).toBeVisible();
  await expect(page.getByTestId("auth-error")).toContainText("Email atau password");
});

test("valid login reaches protected app shell", async ({ page }) => {
  await login(page);

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("app-shell-heading")).toContainText("Beranda");
  await expect(page.getByTestId("user-menu-trigger")).toContainText("E2E User");
});

test("authenticated user is redirected away from login", async ({ page }) => {
  await login(page);
  await page.goto("/login");

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("app-shell")).toBeVisible();
});

test("logout clears session and returns user to login", async ({ page }) => {
  await login(page);
  await page.getByTestId("user-menu-trigger").click();
  await page.getByTestId("logout-button").click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("login-submit")).toBeVisible();
});

test("stale token is redirected through session clear flow", async ({ page, context, baseURL }) => {
  const url = new URL(baseURL ?? "http://app.127.0.0.1.nip.io:8080");

  await context.addCookies([
    {
      name: "kcs_session_token",
      value: "stale-token",
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/app");

  await expect(page).toHaveURL(/\/login\?reason=session-expired$/);
  await expect(page.getByTestId("login-submit")).toBeVisible();
});
