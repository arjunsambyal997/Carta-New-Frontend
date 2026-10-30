import type { NextConfig } from "next";

export declare const securityHeaders: { key: string; value: string }[];
export declare function analyticsOrigin(raw?: string): string | null;
declare const nextConfig: NextConfig;
export default nextConfig;
