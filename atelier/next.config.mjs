/** @type {import('next').NextConfig} */
// photo reels are cut right in the function: the static ffmpeg binary must ship with it
const kit = ['./brands/**/*', './node_modules/harfbuzzjs/*.wasm', './node_modules/ffmpeg-static/ffmpeg'];
const nextConfig = {
  // satori loads harfbuzz wasm from node_modules at runtime, so it must not be bundled
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'satori', 'harfbuzzjs', 'ffmpeg-static'],
  // brand kits (fonts, templates, signature) are read from disk at runtime
  outputFileTracingIncludes: { '/api/**/*': kit, '/**/*': ['./brands/**/*'] },
  async redirects() {
    return [
      { source: '/media', destination: '/', permanent: false },
      { source: '/chat', destination: '/', permanent: false },
    ];
  },
  async rewrites() {
    // oauth discovery for the claude connector
    return [{ source: '/.well-known/:path*', destination: '/api/well-known/:path*' }];
  },
};
export default nextConfig;
