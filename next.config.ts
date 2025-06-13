import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: "standalone", // This includes server files in the output
  images: {
    unoptimized: true, // Skip image optimization for dynamically generated images
  },
};

export default nextConfig;
