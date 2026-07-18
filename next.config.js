/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
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
    support_email: 'enquiries@pupscribe.in',
    support_whatsapp: '919867878275', // e.g. '919876543210' — leave empty to hide the WhatsApp button
    // Public blog origin where digital business cards are served (/card/<slug>).
    blog_url: 'https://barkbutler.in',
  },
  // UAT-only: keep the test environment out of search engines. This branch is
  // deployed exclusively to test.orderform.pupscribe.in, so the noindex applies
  // to every response (HTML, assets, API) and can never reach prod.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};
