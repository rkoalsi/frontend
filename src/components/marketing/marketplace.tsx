import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Paper, Typography, Divider } from '@mui/material';
import {
  Inventory2Outlined,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  WhatsApp,
  HistoryOutlined,
  AccountBalanceWalletOutlined,
  Add,
  Remove,
} from '@mui/icons-material';
import { event as trackEvent } from '../../util/gtag';

/**
 * Shared marketing sections for the two public landing surfaces:
 *
 *   /                        — what a logged-out visitor sees instead of the
 *                              dashboard (hero + features + CTA only)
 *   /wholesale-pet-supplies  — the full page (adds brands, steps, buyer types,
 *                              categories and the FAQ)
 *
 * Both are kept in one place so the copy can never drift between them. The
 * wording follows pupscribe.in/marketplace so a visitor arriving from the main
 * site reads one consistent story.
 */

// Three brand accents, each with a light- and a dark-mode value. The saturated
// brand colours are only legible on white — on a dark surface they turn into
// muddy low-contrast blobs, so dark mode uses the tinted variants instead.
export const ACCENTS = {
  indigo: { light: '#4633B8', dark: '#A996FF' },
  magenta: { light: '#D92681', dark: '#F58FC2' },
  green: { light: '#2E9E12', dark: '#86E06A' },
} as const;

export type AccentKey = keyof typeof ACCENTS;

/** Accent colour for text, icons and rules. */
export const accent = (key: AccentKey) => (t: any) =>
  t.palette.mode === 'dark' ? ACCENTS[key].dark : ACCENTS[key].light;

/** Tinted tile behind an icon — a flat neutral wash in dark mode. */
export const accentTile = (key: AccentKey) => (t: any) =>
  t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : `${ACCENTS[key].light}16`;

const INDIGO = ACCENTS.indigo.light;

/** The single biggest objection remover — repeated in the hero and the CTA. */
export const SIGNUP_LINE =
  'All you need is a WhatsApp number. Verify it with a one-time code and you are in.';

export const WORDMARK_SRC = 'https://assets.pupscribe.in/cards/pupscribe-wordmark.svg';

export const HIGHLIGHTS = [
  { value: 'Live', label: 'Real-time inventory' },
  { value: 'One', label: 'Unified dashboard' },
  { value: '24/7', label: 'Self-serve access' },
];

export const HERO_POINTS = [
  'Sign up with just your WhatsApp number',
  'Order against live stock — no overselling',
  'Invoices, statements and ledgers on demand',
];

// The six capabilities the main site advertises, plus the WhatsApp thread that
// carries order confirmations, dispatch and delivery updates.
export const FEATURES = [
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

export const cardSx = {
  p: { xs: 3, sm: 3.5 },
  borderRadius: '18px',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 1px 2px rgba(16,12,44,0.04)',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    borderColor: (t: any) =>
      t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(70,51,184,0.28)',
    boxShadow: (t: any) =>
      t.palette.mode === 'dark'
        ? '0 12px 32px rgba(0,0,0,0.45)'
        : '0 12px 32px rgba(16,12,44,0.10)',
  },
} as const;

const buttonSx = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: '10px',
  px: 3.25,
  py: 1.4,
  minHeight: 50,
  fontSize: 15,
  letterSpacing: '-0.01em',
} as const;

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) => (
  <Box sx={{ mb: 4 }}>
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.9,
        px: 1.4,
        py: 0.5,
        borderRadius: '999px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent('indigo') }} />
      <Typography
        component='span'
        sx={{
          fontWeight: 600,
          fontSize: 11.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {eyebrow}
      </Typography>
    </Box>
    <Typography
      variant='h2'
      component='h2'
      sx={{
        fontWeight: 700,
        fontSize: 'clamp(26px, 3.4vw, 40px)',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        color: 'text.primary',
        maxWidth: 680,
        mt: 1.5,
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

/* Single example product shown inside the hero preview — the same product the
   main site's hero uses, mirroring the real ProductCard in the order form. */
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
export const PreviewCard = () => {
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
            <Typography sx={{ fontSize: 13, textDecoration: 'line-through' }} color='text.disabled'>
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

/**
 * Hero: copy on the left, the live product card on the right. `secondary` swaps
 * the second button — the root sends visitors to the full page, the full page
 * sends them to sign-in.
 */
export const MarketingHero = ({
  headline,
  secondary,
  ctaLocation,
}: {
  headline?: string;
  secondary: { label: string; href: string };
  ctaLocation: string;
}) => {
  const router = useRouter();

  const goToRegister = () => {
    trackEvent('generate_lead', { form_name: 'order_form_register', location: ctaLocation });
    router.push('/register');
  };

  return (
    <Box
      component='section'
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        mt: { xs: 2, md: 4 },
        px: { xs: 2.5, sm: 5 },
        py: { xs: 5, sm: 8 },
        borderRadius: { xs: '20px', md: '24px' },
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : `${INDIGO}08`),
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? '0 1px 2px rgba(0,0,0,0.4)'
            : '0 1px 2px rgba(16,12,44,0.04)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.05fr) minmax(0,0.95fr)' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        {/* On mobile the product card leads — it shows what the marketplace is
            in one glance, and it is interactive. The copy follows underneath.
            On desktop the usual copy-left / visual-right split returns. */}
        {/* One column, one left edge: every child stretches to the same width
            so the headline, body, bullets, buttons and stats all align. The
            brand badge that used to sit here was dropped — the topbar already
            carries "Pupscribe Marketplace" directly above it. */}
        <Box sx={{ order: { xs: 2, md: 1 }, maxWidth: { md: 620 } }}>
          <Typography
            variant='h1'
            component='h1'
            sx={{
              fontWeight: 700,
              fontSize: 'clamp(32px, 4.6vw, 54px)',
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: 'text.primary',
            }}
          >
            {headline ?? 'The wholesale marketplace built for pet retailers'}
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: 15, md: 17 },
              lineHeight: 1.65,
              color: 'text.secondary',
              mt: 2.5,
            }}
          >
            Order pet food, treats, toys, grooming products and accessories directly
            from Pupscribe — the distributor — against live inventory, and run your
            entire account from one place: shipments, invoices, orders and yearly
            statements, with updates on WhatsApp as your order moves.
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.5, mt: 3.5 }}>
            {HERO_POINTS.map((point) => (
              <Box key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckIcon />
                <Typography sx={{ fontSize: 15 }} color='text.primary'>
                  {point}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 4, flexWrap: 'wrap' }}>
            <Button
              variant='contained'
              size='large'
              onClick={goToRegister}
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
              onClick={() => router.push(secondary.href)}
              sx={{
                ...buttonSx,
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': { borderColor: accent('indigo'), bgcolor: 'background.paper' },
              }}
            >
              {secondary.label}
            </Button>
          </Box>

          {/* The objection remover, right under the CTA where it does the work */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              mt: 2.5,
              color: 'text.secondary',
            }}
          >
            <WhatsApp sx={{ fontSize: 20, color: accent('green'), mt: '2px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>{SIGNUP_LINE}</Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: { xs: 3, sm: 5 },
              mt: 4,
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
                    fontSize: 24,
                    letterSpacing: '-0.02em',
                    color: accent('indigo'),
                    lineHeight: 1.2,
                  }}
                >
                  {h.value}
                </Typography>
                <Typography sx={{ fontSize: 13 }} color='text.secondary'>
                  {h.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <PreviewCard />
        </Box>
      </Box>
    </Box>
  );
};

export const FeatureGrid = ({ title }: { title?: string }) => (
  <Box component='section' sx={{ mt: { xs: 6, md: 9 } }}>
    <SectionHeader
      eyebrow='Everything in one marketplace'
      title={title ?? 'Built around how retailers actually buy'}
      subtitle='From the moment you place an order to the day you reconcile your books, the marketplace keeps everything organised and up to date.'
    />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 2.5,
      }}
    >
      {FEATURES.map((f) => (
        <Paper key={f.title} elevation={0} sx={cardSx}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              bgcolor: accentTile(f.accent),
              color: accent(f.accent),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
              boxShadow: (t) =>
                `inset 0 0 0 1px ${
                  t.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(16,12,44,0.06)'
                }`,
              '& svg': { fontSize: 24 },
            }}
          >
            {f.icon}
          </Box>
          <Typography
            variant='h3'
            component='h3'
            sx={{ fontWeight: 650, fontSize: 18, lineHeight: 1.3, mb: 1, letterSpacing: '-0.01em' }}
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
);

export const ClosingCta = ({ ctaLocation }: { ctaLocation: string }) => {
  const router = useRouter();
  return (
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
      <Box component='img' src={WORDMARK_SRC} alt='Pupscribe' sx={{ height: { xs: 20, md: 24 }, mb: 2.5 }} />
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
          mb: 1.5,
        }}
      >
        Register today and start ordering against live inventory — with all your
        shipments, invoices and statements in one place.
      </Typography>
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          maxWidth: 520,
          mx: 'auto',
          mb: 3.5,
        }}
      >
        All you need is a WhatsApp number.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          size='large'
          onClick={() => {
            trackEvent('generate_lead', { form_name: 'order_form_register', location: ctaLocation });
            router.push('/register');
          }}
          sx={{ ...buttonSx, bgcolor: '#fff', color: '#37279C', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
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
  );
};
