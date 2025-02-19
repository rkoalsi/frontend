/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.pupscribe.in',
        port: '', // Leave this empty for default ports
        pathname: '/**', // Match the "signatures" path and all subpaths
      },
    ],
  },
  env: {
    api_url: 'https://test.orderform.pupscribe.in/api',
  },
};
