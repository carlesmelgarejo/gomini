/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build autònom (server.js + dependències mínimes) per desplegar amb PM2.
  output: "standalone",
};

export default nextConfig;
