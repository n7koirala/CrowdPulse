import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Set the root to this project directory to avoid conflicts with parent lockfiles
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
