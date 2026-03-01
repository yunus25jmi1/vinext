/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_VAR: "hello-from-config",
  },
  async redirects() {
    return [
      {
        source: "/old-about",
        destination: "/about",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/before-rewrite",
          destination: "/about",
        },
      ],
      afterFiles: [
        {
          source: "/after-rewrite",
          destination: "/about",
        },
        // Used by Vitest: pages-router.test.ts (rewrite to static HTML in public/)
        {
          source: "/static-html-page",
          destination: "/static-html-page.html",
        },
        // Used by Vitest: pages-router.test.ts (nested rewrite to static HTML in public/)
        {
          source: "/auth/no-access",
          destination: "/auth/no-access.html",
        },
      ],
      fallback: [
        {
          source: "/fallback-rewrite",
          destination: "/about",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Custom-Header",
            value: "vinext",
          },
        ],
      },
      // Used by Vitest: pages-router.test.ts — has/missing conditions on headers
      // Ported from PR #47 by @ibruno
      {
        source: "/about",
        has: [{ type: "cookie", key: "logged-in" }],
        headers: [{ key: "X-Auth-Only-Header", value: "1" }],
      },
      {
        source: "/about",
        missing: [{ type: "cookie", key: "logged-in" }],
        headers: [{ key: "X-Guest-Only-Header", value: "1" }],
      },
    ];
  },
};

export default nextConfig;
