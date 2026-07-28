import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Paper, Typography, Divider } from '@mui/material';
import {
  Inventory2Outlined,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  WhatsApp,
  HistoryOutlined,
  AccountBalanceWalletOutlined,
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
  Add,
  Remove,
} from '@mui/icons-material';
import axios from 'axios';
import { BrandTriangle } from '../src/components/common/Topbar';
import { event as trackEvent } from '../src/util/gtag';

// Public marketing page for the marketplace — the retailer-facing entry point
// for organic search. The copy is kept in continuity with the
// pupscribe.in/marketplace page (pupscribe/components/orderForm/OrderForm.tsx)
// — same positioning, same feature and step wording — so a visitor arriving
// from the main site reads one consistent story. The styling follows this app's
// own theme rather than the website's, so it sits naturally inside the portal
// and works in both light and dark mode.

// Three brand accents, each with a light- and a dark-mode value. The saturated
// brand colours are only legible on white — on the dark surface they turn into
// muddy low-contrast blobs, so dark mode uses the tinted variants instead.
// Everything else resolves from the theme (text, divider, background.paper).
const ACCENTS = {
  indigo: { light: '#4633B8', dark: '#A996FF' },
  magenta: { light: '#D92681', dark: '#F58FC2' },
  green: { light: '#2E9E12', dark: '#86E06A' },
} as const;

type AccentKey = keyof typeof ACCENTS;

/** Accent colour for text, icons and rules. */
const accent = (key: AccentKey) => (t: any) =>
  t.palette.mode === 'dark' ? ACCENTS[key].dark : ACCENTS[key].light;

/** Tinted tile behind an icon — a flat neutral wash in dark mode. */
const accentTile = (key: AccentKey) => (t: any) =>
  t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : `${ACCENTS[key].light}16`;

const INDIGO = ACCENTS.indigo.light;

// The card artwork is drawn in solid white, so it only reads on a dark panel —
// it is used on the closing CTA band and nowhere else. Light surfaces use the
// BrandTriangle mark from the topbar instead.
const WORDMARK_SRC = 'https://assets.pupscribe.in/cards/pupscribe-wordmark.svg';

const API_URL = process.env.api_url || 'http://localhost:8000/api';

type Brand = { brand: string; image?: string | null };

// Same six capabilities the main site advertises, plus the WhatsApp thread that
// carries order confirmations, dispatch and delivery updates.
const FEATURES = [
  {
    accent: 'indigo' as AccentKey,
    icon: <Inventory2Outlined />,
    title: 'Order against live inventory',
    text: 'Place orders against real-time stock levels so you only order what is actually available — fewer out-of-stocks, fewer cancellations and a noticeably better fulfilment rate.',
  },
  {
    accent: 'magenta' as AccentKey,
    icon: <LocalShippingOutlined />,
    title: 'Track every shipment',
    text: 'Follow all of your shipments from dispatch to doorstep in one place. Always know what is on its way, what has arrived and when to expect it.',
  },
  {
    accent: 'green' as AccentKey,
    icon: <ReceiptLongOutlined />,
    title: 'Invoices on demand',
    text: 'Every invoice, neatly organised and instantly downloadable. No more chasing paperwork — your billing history is always a click away.',
  },
  {
    accent: 'indigo' as AccentKey,
    icon: <WhatsApp />,
    title: 'Updates on WhatsApp',
    text: 'Order confirmations, dispatch and delivery updates come straight to your WhatsApp, so you are never left wondering where an order stands.',
  },
  {
    accent: 'magenta' as AccentKey,
    icon: <HistoryOutlined />,
    title: 'Your complete order history',
    text: 'Review past and current orders, re-order your favourites in seconds and keep a clear record of everything you have purchased from us.',
  },
  {
    accent: 'green' as AccentKey,
    icon: <AccountBalanceWalletOutlined />,
    title: 'Ledger & statements',
    text: 'Access your financial ledger and yearly statements in one place — built for reconciliation, accounting and a clear view of your year with us.',
  },
];

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

const HIGHLIGHTS = [
  { value: 'Live', label: 'Real-time inventory' },
  { value: 'One', label: 'Unified dashboard' },
  { value: '24/7', label: 'Self-serve access' },
];

const HERO_POINTS = [
  'Order against live stock — no overselling',
  'Invoices, statements and ledgers on demand',
  'Shipment and delivery updates on WhatsApp',
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

/* Single example product shown inside the hero preview — same product the main
   site's hero uses, mirroring the real ProductCard in the order form. */
const PREVIEW_PRODUCT = {
  name: 'FOFOS Plush Dog Toy Owl',
  image: 'https://assets.pupscribe.in/prod_product_images/3220178000738589133_1.jpg',
  category: 'Dog Toys',
  mrp: 499,
  stock: 128,
  sellingPrice: 299,
  margin: '40% margin',
  gst: 12,
};

const inr = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Interactive product card — the quantity stepper and Add to Cart actually
 * work, so a visitor can try the ordering experience before registering.
 * Nothing here talks to the API; it is a self-contained preview.
 */
const PreviewCard = () => {
  const [qty, setQty] = useState(1);
  const [inCart, setInCart] = useState(false);

  const subtotal = qty * PREVIEW_PRODUCT.sellingPrice;
  const gstAmount = subtotal * (PREVIEW_PRODUCT.gst / 100);
  const grandTotal = subtotal + gstAmount;

  const qtyBtnSx = {
    minWidth: 36,
    minHeight: 36,
    borderRadius: '8px',
    color: 'text.primary',
    '&:hover': { color: accent('indigo'), bgcolor: 'action.hover' },
    '&:disabled': { color: 'action.disabled' },
  } as const;

  return (
    <Box sx={{ width: '100%', maxWidth: 380, mx: { xs: 'auto', md: 0 }, justifySelf: { md: 'end' } }}>
      <Typography
        sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary', mb: 1.25, textAlign: 'center' }}
      >
        ✨ Live preview — try it. This is the real ordering experience.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: inCart ? accent('indigo') : 'divider',
          boxShadow: '0 18px 44px rgba(26,26,46,0.16)',
          transition: 'border-color .2s ease',
        }}
      >
        {/* Product images are photographed on white — the panel stays white in
            both colour modes so the cut-out never sits on a dark square. */}
        <Box sx={{ position: 'relative', bgcolor: '#fff', height: 190 }}>
          <Box
            component='img'
            src={PREVIEW_PRODUCT.image}
            alt={PREVIEW_PRODUCT.name}
            loading='lazy'
            sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 2 }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              bgcolor: accent('magenta'),
              color: (t) => (t.palette.mode === 'dark' ? '#1C1A33' : '#fff'),
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            New
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              bgcolor: accentTile('green'),
              color: accent('green'),
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Stock {PREVIEW_PRODUCT.stock.toLocaleString('en-IN')}
          </Box>
        </Box>

        <Box sx={{ p: 2.25 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.35 }} color='text.primary'>
            {PREVIEW_PRODUCT.name}
          </Typography>
          <Box
            sx={{
              display: 'inline-block',
              mt: 1,
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              bgcolor: accentTile('indigo'),
              color: accent('indigo'),
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            {PREVIEW_PRODUCT.category}
          </Box>

          <Divider sx={{ my: 1.75 }} />

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 20 }} color='text.primary'>
              ₹{PREVIEW_PRODUCT.sellingPrice.toLocaleString('en-IN')}
            </Typography>
            <Typography
              sx={{ fontSize: 13, textDecoration: 'line-through' }}
              color='text.disabled'
            >
              ₹{PREVIEW_PRODUCT.mrp.toLocaleString('en-IN')}
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: '6px',
                bgcolor: accentTile('green'),
                color: accent('green'),
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {PREVIEW_PRODUCT.margin}
            </Box>
            <Typography sx={{ fontSize: 11.5 }} color='text.secondary'>
              GST {PREVIEW_PRODUCT.gst}%
            </Typography>
          </Box>

          {inCart && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1.75,
                px: 1.25,
                py: 1,
                borderRadius: '10px',
                bgcolor: 'action.hover',
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} color='text.secondary'>
                Total
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }} color='text.primary'>
                ₹{inr(subtotal)}
              </Typography>
            </Box>
          )}

          {/* Centred stepper pill, mirroring the real QuantitySelector:
              one bordered container, icon buttons either side of the value. */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
              }}
            >
              <IconButton
                aria-label='Decrease quantity'
                size='small'
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                sx={qtyBtnSx}
              >
                <Remove fontSize='small' />
              </IconButton>
              <Typography
                sx={{ width: 56, textAlign: 'center', fontWeight: 600, fontSize: 16 }}
                color='text.primary'
              >
                {qty}
              </Typography>
              <IconButton
                aria-label='Increase quantity'
                size='small'
                disabled={qty >= PREVIEW_PRODUCT.stock}
                onClick={() => setQty((q) => Math.min(PREVIEW_PRODUCT.stock, q + 1))}
                sx={qtyBtnSx}
              >
                <Add fontSize='small' />
              </IconButton>
            </Box>
          </Box>

          <Button
            fullWidth
            variant={inCart ? 'outlined' : 'contained'}
            onClick={() => setInCart((v) => !v)}
            sx={{
              mt: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: '10px',
              py: 1.15,
              ...(inCart
                ? { color: accent('indigo'), borderColor: accent('indigo') }
                : {
                    bgcolor: accent('indigo'),
                    color: (t: any) => (t.palette.mode === 'dark' ? '#1C1A33' : '#fff'),
                    '&:hover': { bgcolor: accent('indigo'), filter: 'brightness(0.94)' },
                  }),
            }}
          >
            {inCart ? 'Remove from cart' : 'Add to cart'}
          </Button>
        </Box>

        {/* Mirrors the Review step's grand-total bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2.25,
            py: 1.5,
            bgcolor: 'action.hover',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 11.5 }} color='text.secondary'>
              {inCart ? `1 item · GST ₹${inr(gstAmount)}` : 'Your cart is empty'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} color='text.primary'>
              Grand Total
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700 }} color='text.primary'>
            ₹{inr(inCart ? grandTotal : 0)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) => (
  <Box sx={{ mb: 4 }}>
    <Typography
      component='span'
      sx={{
        display: 'block',
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: accent('indigo'),
      }}
    >
      {eyebrow}
    </Typography>
    <Typography
      variant='h2'
      component='h2'
      sx={{
        fontWeight: 600,
        fontSize: 'clamp(26px, 3.4vw, 40px)',
        lineHeight: 1.25,
        color: 'text.primary',
        maxWidth: 640,
        mt: 1,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        sx={{ fontSize: 16, lineHeight: 1.6, color: 'text.secondary', maxWidth: 620, mt: 1.5 }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

const CheckIcon = () => (
  <Box
    aria-hidden
    sx={{
      width: 22,
      height: 22,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: accentTile('green'),
      color: accent('green'),
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    ✓
  </Box>
);

const MarketplacePage = ({ brands }: { brands: Brand[] }) => {
  const router = useRouter();

  const goToRegister = (location: string) => {
    trackEvent('generate_lead', { form_name: 'order_form_register', location });
    router.push('/register');
  };

  const buttonSx = {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '12px',
    px: 3.5,
    py: 1.4,
    minHeight: 48,
    fontSize: 15,
  } as const;

  const cardSx = {
    p: { xs: 3, sm: 3.5 },
    borderRadius: '20px',
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 4px 16px rgba(26,26,46,0.04)',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  } as const;

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', pb: { xs: 6, md: 10 } }}>
      {/* JSON-LD lives in the body rather than next/head — valid for Google and
          it survives server rendering without depending on head hoisting. */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }}
      />

      {/* Hero. A single flat brand-tinted surface — the earlier three-colour
          gradient and radial glows muddied the dark theme, so both modes now
          use one wash with a plain border. */}
      <Box
        component='section'
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mt: { xs: 2, md: 4 },
          px: { xs: 2.5, sm: 5 },
          py: { xs: 5, sm: 8 },
          borderRadius: { xs: '18px', md: '28px' },
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${INDIGO}0d`,
        }}
      >
        {/* Copy on the left, the live product-card preview on the right — the
            same split the main site's hero uses. */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.05fr) minmax(0,0.95fr)' },
            gap: { xs: 5, md: 6 },
            alignItems: 'center',
          }}
        >
        <Box>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 0.75,
            borderRadius: '999px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <BrandTriangle size={22} />
          <Typography
            component='span'
            sx={{ fontWeight: 700, fontSize: 13.5, color: 'text.primary' }}
          >
            Pupscribe{' '}
            <Box component='span' sx={{ color: accent('magenta') }}>
              Marketplace
            </Box>
          </Typography>
        </Box>

        <Typography
          variant='h1'
          component='h1'
          sx={{
            fontWeight: 700,
            fontSize: 'clamp(30px, 4.6vw, 52px)',
            lineHeight: 1.15,
            color: 'text.primary',
            maxWidth: 760,
          }}
        >
          The wholesale marketplace built for pet retailers
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 15, md: 17 },
            lineHeight: 1.65,
            color: 'text.secondary',
            maxWidth: 640,
            mt: 2.5,
          }}
        >
          Order pet food, treats, toys, grooming products and accessories directly
          from Pupscribe — the distributor — against live inventory, and run your
          entire account from one place: shipments, invoices, orders and yearly
          statements, with updates on WhatsApp as your order moves.
        </Typography>

        <Box sx={{ display: 'grid', gap: 1.5, mt: 3.5, maxWidth: 520 }}>
          {HERO_POINTS.map((point) => (
            <Box key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckIcon />
              <Typography sx={{ fontSize: 15, color: 'text.primary' }}>{point}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 4, flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            size='large'
            onClick={() => goToRegister('hero')}
            sx={{
              ...buttonSx,
              bgcolor: accent('indigo'),
              color: (t) => (t.palette.mode === 'dark' ? '#1C1A33' : '#fff'),
              boxShadow: 'none',
              '&:hover': { bgcolor: accent('indigo'), filter: 'brightness(0.94)' },
            }}
          >
            Create an account
          </Button>
          <Button
            variant='outlined'
            size='large'
            onClick={() => router.push('/login')}
            sx={{
              ...buttonSx,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': { borderColor: accent('indigo'), bgcolor: 'background.paper' },
            }}
          >
            Sign in
          </Button>
        </Box>

        {/* Highlight strip */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 2.5, sm: 4 },
            mt: 5,
            pt: 3.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {HIGHLIGHTS.map((h) => (
            <Box key={h.label}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: accent('indigo'),
                  lineHeight: 1.2,
                }}
              >
                {h.value}
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                {h.label}
              </Typography>
            </Box>
          ))}
        </Box>
        </Box>

        {/* Live preview of a real product card — same product, pricing and
            add-to-cart behaviour as the main site's hero. */}
        <PreviewCard />
        </Box>
      </Box>

      {/* Features */}
      <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
        <SectionHeader
          eyebrow='Everything in one marketplace'
          title='Built around how retailers actually buy'
          subtitle='From the moment you place an order to the day you reconcile your books, the marketplace keeps everything organised and up to date.'
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
          {FEATURES.map((f) => (
            <Paper key={f.title} elevation={0} sx={cardSx}>
              {/* Accent bar across the top, as on the main site's feature cards */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  bgcolor: accent(f.accent),
                }}
              />
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '14px',
                  bgcolor: accentTile(f.accent),
                  color: accent(f.accent),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  mt: 1,
                  '& svg': { fontSize: 24 },
                }}
              >
                {f.icon}
              </Box>
              <Typography
                variant='h3'
                component='h3'
                sx={{ fontWeight: 600, fontSize: 19, lineHeight: 1.3, mb: 1 }}
                color='text.primary'
              >
                {f.title}
              </Typography>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.65 }} color='text.secondary'>
                {f.text}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

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

      {/* Closing CTA — the main site's gradient band */}
      <Box
        component='section'
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mt: { xs: 6, md: 9 },
          px: { xs: 3, sm: 4 },
          py: { xs: 5, sm: 7 },
          borderRadius: '24px',
          textAlign: 'center',
          bgcolor: '#37279C',
          color: '#fff',
        }}
      >
        <Box
          component='img'
          src={WORDMARK_SRC}
          alt='Pupscribe'
          sx={{ height: { xs: 20, md: 24 }, mb: 2.5 }}
        />
        <Typography
          variant='h2'
          component='h2'
          sx={{ fontWeight: 700, fontSize: 'clamp(22px, 3vw, 34px)', mb: 1.5 }}
        >
          Ready to place your next order?
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.86)',
            fontSize: { xs: 15, md: 16 },
            maxWidth: 560,
            mx: 'auto',
            mb: 3.5,
          }}
        >
          Register today and start ordering against live inventory — with all your
          shipments, invoices and statements in one place.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            size='large'
            onClick={() => goToRegister('cta')}
            sx={{
              ...buttonSx,
              bgcolor: '#fff',
              color: '#37279C',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            }}
          >
            Create an account
          </Button>
          <Button
            variant='outlined'
            size='large'
            onClick={() => router.push('/login')}
            sx={{
              ...buttonSx,
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.6)',
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Sign in
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MarketplacePage;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // The brand wall is rendered server-side so brand names ship in the HTML for
  // crawlers. Brands change rarely — let the CDN serve it and revalidate in the
  // background rather than hitting the API on every visit.
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

  let brands: Brand[] = [];
  try {
    const { data } = await axios.get(`${API_URL}/products/brands`, { timeout: 8000 });
    brands = (data?.brands || []).filter((b: Brand) => b?.image);
  } catch {
    // The brand wall is supporting content — never let it break the page.
  }
  return { props: { brands } };
};
