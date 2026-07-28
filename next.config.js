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
  async redirects() {
    return [
      // The marketing page used to live at its own URL; it is now the homepage
      // for logged-out visitors. Permanent, so the indexed URL and any links
      // to it fold into `/` rather than 404ing.
      {
        source: '/wholesale-pet-supplies',
        destination: '/',
        permanent: true,
      },
    ];
  },
  env: {
    api_url: 'http://127.0.0.1:8000/api',
    // Customer support channels (override per environment as needed)
    support_email: 'enquiries@pupscribe.in',
    support_whatsapp: '919867878275', // e.g. '919876543210' — leave empty to hide the WhatsApp button
    // Public blog origin where digital business cards are served (/card/<slug>).
    blog_url: 'https://barkbutler.in',
  },
};
