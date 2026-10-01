/** @type {import('next').NextConfig} */
const nextConfig = {
  // satori loads harfbuzz wasm from node_modules at runtime, so it must not be bundled
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'satori', 'harfbuzzjs'],
  // brand kits (fonts, signature, templates) are read from disk at runtime
  outputFileTracingIncludes: {
    '/api/**/*': ['./brands/**/*', './node_modules/harfbuzzjs/*.wasm'],
    '/status': ['./brands/**/*', './node_modules/harfbuzzjs/*.wasm'],
    '/': ['./brands/**/*'],
    '/preview/**/*': ['./brands/**/*'],
  },
};

export default nextConfig;
