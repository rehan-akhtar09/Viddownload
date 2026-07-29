import type { NextConfig } from "next";

const downloaderFiles = [
  "./node_modules/yt-dlp-exec/bin/**/*",
  "./node_modules/ffmpeg-static/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["yt-dlp-exec", "ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/analyze": downloaderFiles,
    "/api/download": downloaderFiles,
  },
};

export default nextConfig;
