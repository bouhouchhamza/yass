import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["lucide-react", "recharts"] },
};

export default nextConfig;
