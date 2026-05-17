import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";

import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_USERS,
  SECOND_DEMO_USER_EMAIL,
  SECOND_DEMO_USER_PASSWORD,
  hashDemoPassword
} from "../src/lib/seed-data";

const demoEmail = DEMO_USER_EMAIL;
const demoPassword = DEMO_USER_PASSWORD;
const secondDemoEmail = SECOND_DEMO_USER_EMAIL;
const secondDemoPassword = SECOND_DEMO_USER_PASSWORD;
const e2eTrend = "Playwright cute birthday shelf";

let localEnvCache: Record<string, string> | null = null;

function readLocalEnv() {
  if (localEnvCache) {
    return localEnvCache;
  }

  const envPath = path.join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    localEnvCache = {};
    return localEnvCache;
  }

  localEnvCache = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.replace(/^export\s+/, ""))
      .map((line) => {
        const separator = line.indexOf("=");

        if (separator === -1) {
          return ["", ""] as const;
        }

        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return [key, value] as const;
      })
      .filter(([key]) => Boolean(key))
  );

  return localEnvCache;
}

function envValue(name: string) {
  return process.env[name] ?? readLocalEnv()[name];
}

function hasSeededDemoEnvironment() {
  return Boolean(envValue("MONGODB_URI") && envValue("MONGODB_DB") && envValue("AUTH_SECRET"));
}

async function ensureDemoUsers() {
  const uri = envValue("MONGODB_URI");
  const dbName = envValue("MONGODB_DB");

  if (!uri || !dbName) {
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const users = client.db(dbName).collection("users");

    await users.createIndex({ email: 1 }, { unique: true });
    await Promise.all(
      DEMO_USERS.map((user) =>
        users.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              passwordHash: hashDemoPassword(user.password, user.email)
            },
            $setOnInsert: {
              email: user.email,
              createdAt: new Date("2026-05-16T00:00:00.000Z")
            }
          },
          { upsert: true }
        )
      )
    );
  } finally {
    await client.close();
  }
}

async function cleanupStorefront(storefrontId: string | null) {
  if (!storefrontId || !ObjectId.isValid(storefrontId)) {
    return;
  }

  const uri = envValue("MONGODB_URI");
  const dbName = envValue("MONGODB_DB");

  if (!uri || !dbName) {
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client
      .db(dbName)
      .collection("storefronts")
      .deleteOne({ _id: new ObjectId(storefrontId), trend: e2eTrend });
  } finally {
    await client.close();
  }
}

test("redirects unauthenticated create visitors to login with recovery copy", async ({ page }) => {
  await page.goto("/create");

  const url = new URL(page.url());

  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("next")).toBe("/create");
  expect(url.searchParams.get("message")).toBe("auth_required");
  await expect(page.getByText("Sign in to create and manage storefronts.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(demoEmail);
  await expect(page.getByText(secondDemoEmail)).toBeVisible();
  await expect(page.getByText(secondDemoPassword)).toBeVisible();
});

test.describe("seeded demo storefront flow", () => {
  test.skip(
    !hasSeededDemoEnvironment(),
    "Requires MONGODB_URI, MONGODB_DB, AUTH_SECRET, and seeded products."
  );

  test.beforeAll(async () => {
    await ensureDemoUsers();
  });

  test("generates a draft, renders it in a sandboxed iframe, and publishes a public URL", async ({
    page
  }) => {
    let createdStorefrontId: string | null = null;

    try {
      await page.goto("/login?next=/create");
      await page.getByLabel("Email").fill(demoEmail);
      await page.getByLabel("Password").fill(demoPassword);
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page).toHaveURL(/\/create$/);
      await page.getByRole("textbox", { name: "Trend" }).fill(e2eTrend);
      await page.getByRole("button", { name: "Generate with Codex" }).click();

      await expect(page.getByText("Draft saved", { exact: true })).toBeVisible({
        timeout: 60_000
      });

      const draftLink = page.getByRole("link", { name: "Open details page" });
      const draftHref = await draftLink.getAttribute("href");
      const draftIdMatch = draftHref?.match(/\/storefronts\/([a-f0-9]{24})$/i);

      expect(draftIdMatch?.[1]).toBeTruthy();
      createdStorefrontId = draftIdMatch?.[1] ?? null;

      const previewFrame = page.locator('iframe[title$="generated storefront preview"]');

      await expect(page.getByText("iframe sandbox enabled")).toBeVisible();
      await expect(previewFrame).toHaveAttribute("sandbox", "");
      await expect(
        page
          .frameLocator('iframe[title$="generated storefront preview"]')
          .getByText("Generated by Codex for Trend Mall")
      ).toBeVisible();

      const [embedPage] = await Promise.all([
        page.context().waitForEvent("page"),
        page.getByRole("button", { name: "Publish to the Mall" }).click()
      ]);

      await expect(
        page.getByRole("heading", { name: "Published. Storefront opened in a new tab." })
      ).toBeVisible();
      await embedPage.waitForURL(/\/storefronts\/[^/]+\/embed$/);
      await expect(embedPage.getByText("Generated by Codex for Trend Mall")).toBeVisible();
      await embedPage.close();

      const publicHref = await page.locator(".publish-panel.published .share-url").textContent();

      expect(publicHref).toContain("/storefronts/");

      const publicPath = new URL(publicHref ?? "", page.url()).pathname;

      await page.context().clearCookies();
      await page.goto(publicPath);

      await expect(page.getByText("This published storefront is public.")).toBeVisible();
      await expect(page.locator('iframe[title$="generated storefront"]')).toHaveAttribute(
        "sandbox",
        ""
      );
      await expect(
        page
          .frameLocator('iframe[title$="generated storefront"]')
          .getByText("Generated by Codex for Trend Mall")
      ).toBeVisible();
    } finally {
      await cleanupStorefront(createdStorefrontId);
    }
  });
});
