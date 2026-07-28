import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@chatcartpro/db", "@chatcartpro/shared-types"],
};

export default nextConfig;
