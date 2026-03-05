/**
 * Snapshot tests for extracted entry template generators.
 *
 * Each generator produces a virtual module as a JavaScript string.
 * These snapshots guard against accidental template drift during refactors.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import { generateRscEntry } from "../packages/vinext/src/entries/app-rsc-entry.js";
import { generateSsrEntry } from "../packages/vinext/src/entries/app-ssr-entry.js";
import { generateBrowserEntry } from "../packages/vinext/src/entries/app-browser-entry.js";
import { generateServerEntry } from "../packages/vinext/src/entries/pages-server-entry.js";
import { generateClientEntry } from "../packages/vinext/src/entries/pages-client-entry.js";
import { createValidFileMatcher } from "../packages/vinext/src/routing/file-matcher.js";
import type { AppRouterConfig } from "../packages/vinext/src/entries/app-rsc-entry.js";

// Workspace root (forward-slash normalized) used to replace absolute paths
// in generated code so snapshots are machine-independent.
const ROOT = path.resolve(import.meta.dirname, "..").replace(/\\/g, "/");

/** Replace all occurrences of the workspace root with `<ROOT>`. */
function stabilize(code: string): string {
  return code.replaceAll(ROOT, "<ROOT>");
}

// ── Minimal route fixtures ─────────────────────────────────────

const minimalAppRoutes = [
  {
    pattern: "/",
    pagePath: "/tmp/test/app/page.tsx",
    routePath: null,
    layouts: ["/tmp/test/app/layout.tsx"],
    templates: [],
    parallelSlots: [],
    loadingPath: null,
    errorPath: null,
    layoutErrorPaths: [null],
    notFoundPath: null,
    forbiddenPath: null,
    unauthorizedPath: null,
    layoutSegmentDepths: [0],
    isDynamic: false,
    params: [],
  },
  {
    pattern: "/about",
    pagePath: "/tmp/test/app/about/page.tsx",
    routePath: null,
    layouts: ["/tmp/test/app/layout.tsx"],
    templates: [],
    parallelSlots: [],
    loadingPath: null,
    errorPath: null,
    layoutErrorPaths: [null],
    notFoundPath: null,
    forbiddenPath: null,
    unauthorizedPath: null,
    layoutSegmentDepths: [0],
    isDynamic: false,
    params: [],
  },
] as any[];

const pagesFixtureDir = path.resolve(
  import.meta.dirname,
  "./fixtures/pages-basic/pages",
);

const defaultFileMatcher = createValidFileMatcher(["tsx", "ts", "jsx", "js"]);

// ── App Router entry templates ─────────────────────────────────

describe("App Router entry templates", () => {
  it("generateRscEntry matches snapshot (minimal routes)", () => {
    const code = generateRscEntry(
      "/tmp/test/app",
      minimalAppRoutes,
      null,
      [],
      null,
      "",
      false,
    );
    expect(code).toMatchSnapshot();
  });

  it("generateRscEntry matches snapshot (with middleware)", () => {
    const code = generateRscEntry(
      "/tmp/test/app",
      minimalAppRoutes,
      "/tmp/test/middleware.ts",
      [],
      null,
      "",
      false,
    );
    expect(code).toMatchSnapshot();
  });

  it("generateRscEntry matches snapshot (with config)", () => {
    const config: AppRouterConfig = {
      redirects: [
        { source: "/old", destination: "/new", permanent: true },
      ],
      rewrites: {
        beforeFiles: [{ source: "/api/:path*", destination: "/backend/:path*" }],
        afterFiles: [],
        fallback: [],
      },
      headers: [
        {
          source: "/api/:path*",
          headers: [{ key: "X-Custom", value: "test" }],
        },
      ],
    };
    const code = generateRscEntry(
      "/tmp/test/app",
      minimalAppRoutes,
      null,
      [],
      null,
      "/base",
      true,
      config,
    );
    expect(code).toMatchSnapshot();
  });

  it("generateSsrEntry matches snapshot", () => {
    const code = generateSsrEntry();
    expect(code).toMatchSnapshot();
  });

  it("generateBrowserEntry matches snapshot", () => {
    const code = generateBrowserEntry();
    expect(code).toMatchSnapshot();
  });
});

// ── Pages Router entry templates ───────────────────────────────

describe("Pages Router entry templates", () => {
  it("generateServerEntry matches snapshot", async () => {
    const code = await generateServerEntry(pagesFixtureDir, undefined, null, defaultFileMatcher);
    expect(stabilize(code)).toMatchSnapshot();
  });

  it("generateServerEntry matches snapshot (with middleware)", async () => {
    const middlewarePath = path.resolve(
      import.meta.dirname,
      "./fixtures/pages-basic/middleware.ts",
    );
    const code = await generateServerEntry(pagesFixtureDir, undefined, middlewarePath, defaultFileMatcher);
    expect(stabilize(code)).toMatchSnapshot();
  });

  it("generateClientEntry matches snapshot", async () => {
    const code = await generateClientEntry(pagesFixtureDir, undefined, defaultFileMatcher);
    expect(stabilize(code)).toMatchSnapshot();
  });
});

// ── Re-export barrel ──────────────────────────────────────────

describe("app-dev-server barrel re-exports", () => {
  it("re-exports all app entry generators", async () => {
    const barrel = await import(
      "../packages/vinext/src/server/app-dev-server.js"
    );
    expect(barrel.generateRscEntry).toBe(generateRscEntry);
    expect(barrel.generateSsrEntry).toBe(generateSsrEntry);
    expect(barrel.generateBrowserEntry).toBe(generateBrowserEntry);
  });
});
