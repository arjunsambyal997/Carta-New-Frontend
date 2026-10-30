const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
const dev = process.env.NODE_ENV !== "production";

// Next.js hydrates with inline scripts, so scripts need 'unsafe-inline'; everything else is limited to this origin,
// which keeps an injected script from sending the stored session anywhere and stops other sites from framing the app.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Reset links carry their token in the URL; never send it on to another site.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server in .next/standalone: a small production image with no dev dependencies.
  output: "standalone",
  poweredByHeader: false,
  // Next 16 builds with Turbopack; the same alias for it (the webpack hook below still applies to `--webpack` builds).
  turbopack: { resolveAlias: { "motion/react": "framer-motion" } },
  webpack(config) {
    // motion/react re-exports framer-motion through a namespace import, which webpack cannot tree-shake (it added
    // ~40 KB gzipped to every page). Pointing it straight at framer-motion, the package it wraps, keeps only the
    // pieces the app imports. Code still imports from "motion/react".
    config.resolve.alias = { ...config.resolve.alias, "motion/react$": "framer-motion" };
    return config;
  },
  // Proxy API calls so the browser stays same-origin (no CORS setup on the backend).
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
