/**
 * App Router dev server handler.
 *
 * This module re-exports the entry generators from their dedicated
 * modules under entries/. The actual code generation has been extracted
 * to keep this file minimal while preserving the import paths that
 * consumers (index.ts, tests) already use.
 */
export { generateRscEntry } from "../entries/app-rsc-entry.js";
export { generateSsrEntry } from "../entries/app-ssr-entry.js";
export { generateBrowserEntry } from "../entries/app-browser-entry.js";
export type { AppRouterConfig } from "../entries/app-rsc-entry.js";
