/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@venture-sandbox/ui",
    "@venture-sandbox/domain",
    "@venture-sandbox/schemas",
    "@venture-sandbox/integrations",
    "@venture-sandbox/observability",
  ],
  experimental: {
    // playwright-core and @sparticuz/chromium have native/optional deps
    // (kerberos, chromium-bidi, etc.) that webpack can't bundle and
    // shouldn't try to -- these are only ever used server-side, in the
    // cron route, at Node runtime.
    serverComponentsExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  },
  webpack: (config, { isServer }) => {
    // Belt-and-suspenders alongside serverComponentsExternalPackages above:
    // that flag alone did not stop webpack from statically resolving
    // playwright-core's own optional nested requires (chromium-bidi,
    // kerberos) and failing the build when they're absent. Forcing these
    // external leaves them as runtime require() calls instead.
    if (isServer) {
      config.externals = [...(config.externals ?? []), "playwright-core", "@sparticuz/chromium"];
    }
    return config;
  },
};

export default nextConfig;
