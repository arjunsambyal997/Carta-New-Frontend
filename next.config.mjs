const backend = process.env.BACKEND_URL ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
