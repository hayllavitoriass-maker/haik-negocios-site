import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra o servidor de produção (`next build` + `next start`) usando um banco
 * PGlite isolado em ./data/e2e. Rode `npm run test:e2e`.
 */
const PORT = 3101;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: "production",
      PGLITE_DATA_DIR: "./data/e2e",
      APP_SECRET: "e2e-secret-with-at-least-32-characters-ok",
      ADMIN_SETUP_TOKEN: "e2e-setup-token",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
