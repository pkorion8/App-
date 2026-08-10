/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@venture-sandbox/ui",
    "@venture-sandbox/domain",
    "@venture-sandbox/schemas",
    "@venture-sandbox/integrations",
    "@venture-sandbox/observability",
  ],
};

export default nextConfig;
