/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'order-form.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/signatures/**',
      },
    ],
  },
  env: {
    api_url: 'https://orderform.pupscribe.in/api',
  },
};
