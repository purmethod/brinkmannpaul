/** @type {import('next').NextConfig} */
const kit = ['./brands/**/*', './node_modules/harfbuzzjs/*.wasm'];
const nextConfig = {
  // satori loads harfbuzz wasm from node_modules at runtime, so it must not be bundled
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'satori', 'harfbuzzjs'],
  // brand kits (fonts, templates, signature) are read from disk at runtime
  outputFileTracingIncludes: { '/api/**/*': kit, '/**/*': ['./brands/**/*'] },
  async rewrites() {
    // oauth discovery for the claude connector
    return [{ source: '/.well-known/:path*', destination: '/api/well-known/:path*' }];
  },
};
export default nextConfig;
