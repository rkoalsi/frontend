import { useState } from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import {
  StorefrontOutlined,
  PetsOutlined,
  HomeWorkOutlined,
  VolunteerActivismOutlined,
  MedicalServicesOutlined,
  ContentCutOutlined,
  SetMealOutlined,
  ToysOutlined,
  ShowerOutlined,
  HealthAndSafetyOutlined,
  ShoppingBasketOutlined,
  CleanHandsOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import {
  AccentKey,
  ClosingCta,
  FeatureGrid,
  MarketingHero,
  SectionHeader,
  accent,
  accentTile,
  cardSx,
} from './marketplace';

/**
 * The marketing page a logged-out visitor sees at `/`.
 *
 * `/` is the URL Google surfaces for brand searches and the first thing a cold
 * retailer lands on, so the whole story lives here rather than behind a click:
 * hero, features, the brands we distribute, how it works, who orders here, the
 * range and the FAQ. It used to be split across `/` and a separate
 * `/wholesale-pet-supplies` page; that route now 301s here (see next.config.js).
 *
 * Logged-in users never see this — pages/index.tsx renders the dashboard.
 */

export type Brand = { brand: string; image?: string | null };

const STEPS = [
  {
    title: 'Register your account',
    text: 'Sign up with your mobile number and a WhatsApp OTP, and get verified access to the marketplace.',
  },
  {
    title: 'Browse live catalogues',
    text: 'Explore the latest products, pricing and real-time stock availability across every brand we distribute.',
  },
  {
    title: 'Place your order',
    text: 'Order what your shelf actually needs, direct from us — no reseller in between, and no shortlist of "eligible" buyers.',
  },
  {
    title: 'Track & manage',
    text: 'Follow shipments, pull invoices and review statements, with updates arriving on WhatsApp as your order moves.',
  },
];

// Retailers lead; the rest are the non-trade buyers who also order here.
const BUYERS = [
  {
    icon: <StorefrontOutlined />,
    accent: 'indigo' as AccentKey,
    title: 'Pet shops & retailers',
    text: 'Stock your shelves against live inventory, with trade pricing, GST invoicing and a ledger you can reconcile.',
  },
  {
    icon: <PetsOutlined />,
    accent: 'magenta' as AccentKey,
    title: 'Breeders & catteries',
    text: 'The same formula and pack size, order after order, bought straight from the distributor.',
  },
  {
    icon: <HomeWorkOutlined />,
    accent: 'green' as AccentKey,
    title: 'Boarding & daycare',
    text: 'Keep food, litter and cleaning supplies stocked for a full house without repeat trips to a shop.',
  },
  {
    icon: <VolunteerActivismOutlined />,
    accent: 'indigo' as AccentKey,
    title: 'Shelters & rescues',
    text: 'Pet food and supplies for rescues and NGOs feeding large numbers of dogs and cats.',
  },
  {
    icon: <MedicalServicesOutlined />,
    accent: 'magenta' as AccentKey,
    title: 'Veterinary clinics',
    text: 'Therapeutic diets, supplements and healthcare lines ordered direct, with invoices on demand.',
  },
  {
    icon: <ContentCutOutlined />,
    accent: 'green' as AccentKey,
    title: 'Groomers & multi-pet homes',
    text: 'Shampoos, tools and consumables — or simply feeding more pets than one retail bag covers.',
  },
];

// Category tiles under "What you can order" — the same words a retailer would
// search for, made scannable instead of one long paragraph.
const CATEGORIES = [
  { icon: <SetMealOutlined />, label: 'Dog & cat food', text: 'Dry, wet and kitten food' },
  { icon: <LocalOfferOutlined />, label: 'Treats & chews', text: 'Biscuits, sticks and dental chews' },
  { icon: <ToysOutlined />, label: 'Toys', text: 'Dog toys, cat toys and enrichment' },
  { icon: <CleanHandsOutlined />, label: 'Cat litter', text: 'Clumping, silica and natural litter' },
  { icon: <ShowerOutlined />, label: 'Grooming', text: 'Shampoos, brushes and tools' },
  { icon: <HealthAndSafetyOutlined />, label: 'Health', text: 'Supplements and healthcare' },
  { icon: <PetsOutlined />, label: 'Walk & wear', text: 'Collars, leashes and harnesses' },
  { icon: <ShoppingBasketOutlined />, label: 'Accessories', text: 'Bowls, beds and everyday goods' },
];

const FAQS = [
  {
    q: 'Who can order on Pupscribe Marketplace?',
    a: 'Pet retailers and pet shops are our core customers, and the marketplace is built around how they buy. Breeders, boarding kennels, shelters, veterinary clinics and groomers order here too.',
  },
  {
    q: 'Can I buy directly from Pupscribe?',
    a: 'Yes. Pupscribe is the distributor, so you purchase directly from us on this marketplace rather than going through a shop or reseller.',
  },
  {
    q: 'Do I need a GST number to register?',
    a: 'GST details are needed if you are registering as a business and want your invoices raised against your firm. Individual buyers can register with just a mobile number.',
  },
  {
    q: 'How do I know what is in stock?',
    a: 'Every product shows live stock from our warehouse, so you order against what is actually available instead of finding out after the fact.',
  },
  {
    q: 'How will I get my invoices and order updates?',
    a: 'Invoices, statements and your full order history live in your account and can be downloaded any time. Order confirmation, dispatch and delivery updates are also sent to you on WhatsApp.',
  },
];

const STRUCTURED_DATA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/**
 * Brand logos sit on a square canvas with a lot of built-in padding, so a
 * wordmark fills only a sliver of its own artwork. /cards/brands holds
 * tightly-cropped copies — the same trick the business card uses — and anything
 * without one falls back to the original.
 */
const croppedLogo = (url?: string | null) =>
  (url || '').replace('/brands/', '/cards/brands/');

const BrandTile = ({ brand }: { brand: Brand }) => {
  const [src, setSrc] = useState(croppedLogo(brand.image));
  return (
    <Box
      sx={{
        // Logos are drawn for light backgrounds — the tile stays white in dark
        // mode so wordmarks never disappear into the page.
        bgcolor: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(26,26,46,0.04)',
        height: { xs: 76, sm: 88 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        transition: 'transform .2s ease, box-shadow .2s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(26,26,46,0.10)' },
      }}
    >
      <Box
        component='img'
        src={src}
        alt={`${brand.brand} — available wholesale from Pupscribe`}
        title={brand.brand}
        loading='lazy'
        onError={() => setSrc(brand.image || '')}
        sx={{ maxHeight: '70%', maxWidth: '100%', objectFit: 'contain' }}
      />
    </Box>
  );
};



const GuestLanding = ({ brands = [] }: { brands?: Brand[] }) => (
  <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', pb: { xs: 6, md: 10 } }}>
    {/* JSON-LD lives in the body rather than next/head — valid for Google and
        it survives server rendering without depending on head hoisting. */}
    <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />

    <MarketingHero secondary={{ label: 'Sign in', href: '/login' }} ctaLocation='hero' />

    <FeatureGrid />

    {/* Brands — server-rendered so brand names ship in the HTML */}
    {brands.length > 0 && (
      <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
        <SectionHeader
          eyebrow='Brands we distribute'
          title='Order these brands direct from the distributor'
          subtitle='We distribute the brands below across India, so you buy from the source — no reseller and no markup in between. Sign in to see live stock and your pricing on every product.'
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
          {brands.map((b) => (
            <BrandTile key={b.brand} brand={b} />
          ))}
        </Box>
      </Box>
    )}

    {/* How it works */}
    <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
      <SectionHeader eyebrow='How it works' title='Up and running in four steps' />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {STEPS.map((s, i) => (
          <Paper key={s.title} elevation={0} sx={cardSx}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: accentTile('indigo'),
                color: accent('indigo'),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                mb: 2,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </Box>
            <Typography
              variant='h3'
              component='h3'
              sx={{ fontWeight: 600, fontSize: 17, mb: 1 }}
              color='text.primary'
            >
              {s.title}
            </Typography>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.65 }} color='text.secondary'>
              {s.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>

    {/* Who orders here */}
    <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
      <SectionHeader
        eyebrow='Who orders here'
        title='Pet retailers first — and anyone else buying for more than one pet'
        subtitle='Pet shops and retailers are who the marketplace is built for. Breeders, boarding kennels, shelters, veterinary clinics, groomers and multi-pet households order here as well, with the same live stock, invoices and WhatsApp updates.'
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {BUYERS.map((b) => (
          <Paper key={b.title} elevation={0} sx={cardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  flexShrink: 0,
                  bgcolor: accentTile(b.accent),
                  color: accent(b.accent),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': { fontSize: 22 },
                }}
              >
                {b.icon}
              </Box>
              <Typography
                variant='h3'
                component='h3'
                sx={{ fontWeight: 600, fontSize: 17 }}
                color='text.primary'
              >
                {b.title}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.65 }} color='text.secondary'>
              {b.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>

    {/* What you can order */}
    <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
      <SectionHeader
        eyebrow='Range'
        title='What you can order'
        subtitle='Every category below, across every brand Pupscribe distributes in India — with live stock and your pricing visible once you sign in.'
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {CATEGORIES.map((c) => (
          <Paper
            key={c.label}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              height: '100%',
              transition: 'transform .2s ease, box-shadow .2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 24px rgba(26,26,46,0.10)',
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                mx: 'auto',
                mb: 1.5,
                borderRadius: '50%',
                bgcolor: accentTile('indigo'),
                color: accent('indigo'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& svg': { fontSize: 22 },
              }}
            >
              {c.icon}
            </Box>
            <Typography
              sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}
              color='text.primary'
            >
              {c.label}
            </Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.5 }} color='text.secondary'>
              {c.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>

    {/* FAQ */}
    <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
      <SectionHeader eyebrow='Questions' title='Frequently asked questions' />
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 16px rgba(26,26,46,0.04)',
          overflow: 'hidden',
        }}
      >
        {FAQS.map((f, i) => (
          <Box key={f.q}>
            {i > 0 && <Divider />}
            <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography
                variant='h3'
                component='h3'
                sx={{ fontWeight: 600, fontSize: 17, mb: 1 }}
                color='text.primary'
              >
                {f.q}
              </Typography>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.65 }} color='text.secondary'>
                {f.a}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>


    <ClosingCta ctaLocation='cta' />
  </Box>
);

export default GuestLanding;
