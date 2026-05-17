import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return walkFiles(fullPath);
    }

    return [fullPath];
  });
}

const sourceRoot = path.join(process.cwd(), "src");
const sourceFiles = walkFiles(sourceRoot).filter((file) => /\.(ts|tsx)$/.test(file));
const productionSourceFiles = sourceFiles.filter((file) => !file.endsWith(".test.ts"));

function rel(file: string) {
  return path.relative(process.cwd(), file).replaceAll(path.sep, "/");
}

function read(file: string) {
  return readFileSync(file, "utf8");
}

describe("client/server security boundaries", () => {
  it("keeps the Codex SDK isolated behind the server-side wrapper module", () => {
    const sdkUsers = productionSourceFiles
      .filter((file) => read(file).includes("@openai/codex-sdk"))
      .map(rel);

    expect(sdkUsers).toEqual(["src/lib/codex/generateStorefrontHtml.ts"]);
  });

  it("uses the Codex SDK package as the direct app dependency", () => {
    const packageJson = JSON.parse(read(path.join(process.cwd(), "package.json"))) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies).toHaveProperty("@openai/codex-sdk");
    expect(packageJson.dependencies).not.toHaveProperty("@openai/codex");
  });

  it("keeps the generation route on the Codex wrapper instead of inline SDK calls", () => {
    const route = read(path.join(process.cwd(), "src/app/api/generate/route.ts"));

    expect(route).toContain("generateStorefrontHtmlWithCodex");
    expect(route).not.toContain("@openai/codex-sdk");
    expect(route).not.toContain("new Codex");
    expect(route).not.toContain("startThread");
  });

  it("does not read server secrets from client components", () => {
    const clientFiles = productionSourceFiles.filter((file) =>
      read(file).trimStart().startsWith('"use client";')
    );

    expect(clientFiles.map(rel)).toEqual(
      expect.arrayContaining([
        "src/components/CreateStorefrontClient.tsx",
        "src/components/PublishStorefrontPanel.tsx"
      ])
    );

    for (const file of clientFiles) {
      const source = read(file);

      expect(source).not.toMatch(/process\.env\.(OPENAI_API_KEY|MONGODB_URI|MONGODB_DB)/);
      expect(source).not.toContain("@openai/codex-sdk");
      expect(source).not.toMatch(/from ["']mongodb["']/);
    }
  });

  it("does not render generated HTML directly in React", () => {
    for (const file of productionSourceFiles) {
      expect(read(file), rel(file)).not.toContain("dangerouslySetInnerHTML");
    }
  });

  it("uses strict iframe sandbox attributes without unsafe allowances", () => {
    const iframeFiles = productionSourceFiles
      .filter((file) => /<iframe\s/.test(read(file)))
      .map((file) => ({
        path: rel(file),
        source: read(file)
      }));

    expect(iframeFiles.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "src/app/storefronts/[id]/page.tsx",
        "src/components/CreateStorefrontClient.tsx"
      ])
    );

    for (const file of iframeFiles) {
      expect(file.source, file.path).toContain('sandbox=""');
      expect(file.source, file.path).not.toContain("allow-scripts");
      expect(file.source, file.path).not.toContain("allow-forms");
      expect(file.source, file.path).not.toContain("allow-same-origin");
    }
  });
});
