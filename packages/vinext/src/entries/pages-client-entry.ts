/**
 * Pages Router client hydration entry generator.
 *
 * Extracted from index.ts — generates the virtual client entry module
 * used as the entry point for `vite build` (client bundle).
 */
import fs from "node:fs";
import path from "node:path";
import { pagesRouter, patternToNextFormat as pagesPatternToNextFormat, type Route } from "../routing/pages-router.js";
import type { ResolvedNextConfig } from "../config/next-config.js";
import type { ValidFileMatcher } from "../routing/file-matcher.js";

/**
 * Find a file by name (without extension) in a directory.
 * Checks the configured page extensions via the file matcher.
 */
function findFileWithExts(
  dir: string,
  name: string,
  matcher: ValidFileMatcher,
): string | null {
  for (const ext of matcher.dottedExtensions) {
    const filePath = path.join(dir, name + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

/**
 * Generate the virtual client hydration entry module.
 * This is the entry point for `vite build` (client bundle).
 *
 * It maps route patterns to dynamic imports of page modules so Vite
 * code-splits each page into its own chunk. At runtime it reads
 * __NEXT_DATA__ to determine which page to hydrate.
 */
export async function generateClientEntry(pagesDir: string, nextConfig: ResolvedNextConfig | undefined, fileMatcher: ValidFileMatcher): Promise<string> {
  const pageRoutes = await pagesRouter(pagesDir, nextConfig?.pageExtensions, fileMatcher);

  const appFilePath = findFileWithExts(pagesDir, "_app", fileMatcher);
  const hasApp = appFilePath !== null;

  // Build a map of route pattern -> dynamic import.
  // Keys must use Next.js bracket format (e.g. "/user/[id]") to match
  // __NEXT_DATA__.page which is set via patternToNextFormat() during SSR.
  const loaderEntries = pageRoutes.map((r: Route) => {
    const absPath = r.filePath.replace(/\\/g, "/");
    const nextFormatPattern = pagesPatternToNextFormat(r.pattern);
    // JSON.stringify safely escapes quotes, backslashes, and special chars in
    // both the route pattern and the absolute file path.
    // lgtm[js/bad-code-sanitization]
    return `  ${JSON.stringify(nextFormatPattern)}: () => import(${JSON.stringify(absPath)})`;
  });

  const appFileBase = appFilePath?.replace(/\\/g, "/");

  return `
import React from "react";
import { hydrateRoot } from "react-dom/client";
// Eagerly import the router shim so its module-level popstate listener is
// registered.  Without this, browser back/forward buttons do nothing because
// navigateClient() is never invoked on history changes.
import "next/router";

const pageLoaders = {
${loaderEntries.join(",\n")}
};

async function hydrate() {
  const nextData = window.__NEXT_DATA__;
  if (!nextData) {
    console.error("[vinext] No __NEXT_DATA__ found");
    return;
  }

  const { pageProps } = nextData.props;
  const loader = pageLoaders[nextData.page];
  if (!loader) {
    console.error("[vinext] No page loader for route:", nextData.page);
    return;
  }

  const pageModule = await loader();
  const PageComponent = pageModule.default;
  if (!PageComponent) {
    console.error("[vinext] Page module has no default export");
    return;
  }

  let element;
  ${hasApp ? `
  try {
    const appModule = await import(${JSON.stringify(appFileBase!)});
    const AppComponent = appModule.default;
    window.__VINEXT_APP__ = AppComponent;
    element = React.createElement(AppComponent, { Component: PageComponent, pageProps });
  } catch {
    element = React.createElement(PageComponent, pageProps);
  }
  ` : `
  element = React.createElement(PageComponent, pageProps);
  `}

  // Wrap with RouterContext.Provider so next/compat/router works during hydration
  const { wrapWithRouterContext } = await import("next/router");
  element = wrapWithRouterContext(element);

  const container = document.getElementById("__next");
  if (!container) {
    console.error("[vinext] No #__next element found");
    return;
  }

  const root = hydrateRoot(container, element);
  window.__VINEXT_ROOT__ = root;
}

hydrate();
`;
}
