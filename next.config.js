/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'order-form.s3.ap-south-1.amazonaws.com',
        port: '', // Leave this empty for default ports
        pathname: '/signatures/**', // Match the "signatures" path and all subpaths
      },
    ],
  },
  env: {
    api_url: 'https://test.orderform.pupscribe.in/api',
  },
};
