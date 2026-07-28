/**
 * Public digital business card — /cards/[id], where [id] is the card slug.
 *
 * Renders without auth and without the app chrome (see the bare-route check in
 * pages/_app.tsx). The same design also ships on the blog at
 * barkbutler.in/card/[slug]; both read the same public /cards endpoints, so a
 * card only has to be maintained once in /admin/cards.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import IosShareIcon from '@mui/icons-material/IosShare';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PhoneIcon from '@mui/icons-material/Phone';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import YouTubeIcon from '@mui/icons-material/YouTube';

// Palette lifted from the printed Pupscribe business card.
const NAVY = '#313274';
const NAVY_DEEP = '#252654';
const YELLOW = '#f1d61e';
const MAGENTA = '#d62182';
const MUTED = '#b9b9dd';

// Vector artwork extracted from the printed card's PDF, served from the CDN so
// the blog and the order portal share one copy.
const DOG_SRC = 'https://assets.pupscribe.in/cards/pupscribe-dog.svg';
const WORDMARK_SRC = 'https://assets.pupscribe.in/cards/pupscribe-wordmark.svg';
const BONE_SRC = 'https://assets.pupscribe.in/cards/pupscribe-bone.svg';

const REGISTERED_ADDRESS =
  'F-3/4, Ashokraj CHS Ltd, Ratna Hotel Bldg, S.V. Road, Goregaon West, Mumbai 400 104, India';

const API_URL = process.env.api_url || 'http://localhost:8000/api';

type Card = {
  slug: string;
  name?: string;
  title?: string;
  company?: string;
  city?: string;
  country?: string;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  booking_url?: string;
  photo_url?: string;
  socials?: Record<string, string>;
};

type Brand = { brand: string; image?: string | null };

const normalizeUrl = (url?: string) => {
  if (!url) return '#';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
};

const buildWhatsAppLink = (number?: string) => {
  const digits = (number || '').replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

// "Rushil Kalsi" renders as two stacked lines, matching the print layout.
const splitName = (name?: string): [string, string] => {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length < 2) return [parts[0] || '', ''];
  return [parts[0], parts.slice(1).join(' ')];
};

const SOCIAL_ICONS: Record<string, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
};

const ContactLine = ({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof PhoneIcon;
  label: string;
  href: string;
}) => (
  <Box
    component='a'
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel='noopener noreferrer'
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      mx: -1.25,
      px: 1.25,
      py: 1.25,
      borderRadius: 1.5,
      textDecoration: 'none',
      transition: 'background-color .2s',
      '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
    }}
  >
    <Icon sx={{ fontSize: 19, color: YELLOW, flexShrink: 0 }} />
    <Typography
      noWrap
      sx={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.01em', color: '#fff' }}
    >
      {label}
    </Typography>
  </Box>
);

/**
 * Brand logos live on a square canvas with a lot of built-in padding, which
 * leaves a wordmark like barkbutler filling only a sliver of its own artwork.
 * /cards/brands holds tightly-cropped copies so every logo reads at the same
 * optical size in the bone; anything without one falls back to the original.
 */
const croppedLogo = (url?: string | null) =>
  (url || '').replace('/brands/', '/cards/brands/');

const BrandLogo = ({ brand, hidden }: { brand: Brand; hidden: boolean }) => {
  const [src, setSrc] = useState(croppedLogo(brand.image));
  return (
    <Box
      component='img'
      src={src}
      alt={hidden ? '' : brand.brand}
      aria-hidden={hidden}
      loading='lazy'
      onError={() => setSrc(brand.image || '')}
      sx={{
        height: 'clamp(22px, 3.6vw, 30px)',
        maxWidth: 'clamp(80px, 14vw, 118px)',
        width: 'auto',
        flex: 'none',
        objectFit: 'contain',
      }}
    />
  );
};

/**
 * The yellow bone from the printed card, with the house brands scrolling
 * through its shaft. Renders nothing if the brands API gave us no logos.
 */
const BrandBone = ({ brands }: { brands: Brand[] }) => {
  if (!brands.length) return null;
  // Duplicated so the marquee can loop seamlessly at -50%.
  const row = [...brands, ...brands];
  return (
    <Box sx={{ position: 'relative' }}>
      <Box component='img' src={BONE_SRC} alt='' aria-hidden sx={{ display: 'block', width: '100%' }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', px: '15%' }}>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              width: 'max-content',
              alignItems: 'center',
              gap: { xs: 3, sm: 3.5 },
              animation: 'card-marquee 26s linear infinite',
              '@keyframes card-marquee': {
                from: { transform: 'translateX(0)' },
                to: { transform: 'translateX(-50%)' },
              },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {row.map((brand, i) => (
              <BrandLogo key={`${brand.brand}-${i}`} brand={brand} hidden={i >= brands.length} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const circleButtonSx = {
  width: 36,
  height: 36,
  color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.14)',
  transition: 'all .2s',
  '&:hover': { backgroundColor: YELLOW, color: NAVY, transform: 'translateY(-2px)' },
};

const CardPage = ({ card, brands }: { card: Card | null; brands: Brand[] }) => {
  const [cardUrl, setCardUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Canonical URL (no query) — what we share and what the QR points at.
    setCardUrl(window.location.origin + window.location.pathname);

    // Arrived via a QR code? Log the scan, then strip the marker from the
    // address bar so a refresh doesn't double-count.
    const params = new URLSearchParams(window.location.search);
    if (params.get('src') === 'qr' && card?.slug) {
      fetch(`${API_URL}/cards/${encodeURIComponent(card.slug)}/scan`, {
        method: 'POST',
      }).catch(() => {});
      params.delete('src');
      const rest = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (rest ? `?${rest}` : '')
      );
    }
  }, [card?.slug]);

  const handleShare = useCallback(async () => {
    if (!cardUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ url: cardUrl });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // user dismissed the sheet
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }, [cardUrl]);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }, [cardUrl]);

  const downloadQr = useCallback(() => {
    const canvas = document.getElementById('card-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${card?.slug || 'card'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [card?.slug]);

  const [firstName, lastName] = useMemo(() => splitName(card?.name), [card?.name]);

  if (!card) {
    return (
      <>
        <Head>
          <title>Card not found — Pupscribe</title>
          <meta name='robots' content='noindex, nofollow' />
        </Head>
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: NAVY,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Box>
            <Box
              component='img'
              src={WORDMARK_SRC}
              alt='Pupscribe'
              sx={{ width: 150, display: 'block', mx: 'auto', mb: 3 }}
            />
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>
              This card isn&apos;t available
            </Typography>
            <Typography sx={{ color: MUTED, mt: 1, fontSize: 14 }}>
              The link may be out of date, or the card has been taken down.
            </Typography>
            <Button
              href='https://pupscribe.in'
              sx={{
                mt: 3,
                backgroundColor: YELLOW,
                color: NAVY,
                fontWeight: 800,
                px: 3,
                borderRadius: 2,
                '&:hover': { backgroundColor: YELLOW },
              }}
            >
              Go to pupscribe.in
            </Button>
          </Box>
        </Box>
      </>
    );
  }

  const vcardUrl = `${API_URL}/cards/${encodeURIComponent(card.slug)}/vcard`;
  const waLink = buildWhatsAppLink(card.whatsapp);
  const socials = card.socials || {};
  const socialEntries = Object.entries(socials).filter(
    ([platform, url]) => url && SOCIAL_ICONS[platform]
  );
  const description =
    card.bio || [card.title, card.company].filter(Boolean).join(' · ');

  return (
    <>
      <Head>
        <title>{`${card.name}${card.company ? ' — ' + card.company : ''}`}</title>
        <meta name='description' content={description} />
        {/* A personal card is shareable but shouldn't compete with
            barkbutler.in/card/[slug] in search results. */}
        <meta name='robots' content='noindex, follow' />
        <meta property='og:type' content='profile' />
        <meta property='og:title' content={card.name || 'Digital card'} />
        <meta property='og:description' content={description} />
        {card.photo_url && <meta property='og:image' content={card.photo_url} />}
        <meta name='theme-color' content={NAVY} />
      </Head>

      {/* The default light scrollbar reads as a grey stripe against the navy —
          jarring on the page itself and worse when it's framed inside the app.
          Tint it to the card's own ground instead. */}
      <GlobalStyles
        styles={{
          html: { scrollbarWidth: 'thin', scrollbarColor: `rgba(255,255,255,0.22) ${NAVY_DEEP}` },
          body: { backgroundColor: NAVY_DEEP },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { backgroundColor: NAVY_DEEP },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.22)',
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255,255,255,0.34)' },
        }}
      />

      {/* On phones the card fills the screen. From md up it becomes an object:
          a navy panel on a darker ground, with the two printed faces side by
          side the way they sit on the physical card. */}
      <Box
        sx={{
          backgroundColor: NAVY_DEEP,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 0, md: 3 },
          py: { xs: 0, md: 6 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            backgroundColor: NAVY,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            overflow: 'hidden',
            maxWidth: { md: 896 },
            borderRadius: { xs: 0, md: '28px' },
            boxShadow: { md: '0 40px 90px -40px rgba(0,0,0,0.7)' },
          }}
        >
          {/* ---------- Back of the card: the person ---------- */}
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              px: { xs: 3, md: 4.5 },
              pt: { xs: 3, md: 5 },
              pb: { xs: 1, md: 5 },
            }}
          >
            {/* Dog silhouette bleeding off the right edge, faded out at the
                bottom so it never runs behind the contact lines. */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                right: { xs: '-15%', md: '-10%' },
                top: { xs: 20, md: 32 },
                width: { xs: '64%', md: '70%' },
                height: { xs: 172, md: 200 },
                overflow: 'hidden',
                pointerEvents: 'none',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 58%, transparent 97%)',
                maskImage: 'linear-gradient(to bottom, #000 58%, transparent 97%)',
              }}
            >
              <Box component='img' src={DOG_SRC} alt='' sx={{ display: 'block', width: '100%' }} />
            </Box>

            {/* Corner actions — QR and Share */}
            <Stack direction='row' spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
              <IconButton aria-label='Show QR code' onClick={() => setQrOpen(true)} sx={circleButtonSx}>
                <QrCode2Icon sx={{ fontSize: 19 }} />
              </IconButton>
              <IconButton aria-label='Share card' onClick={handleShare} sx={circleButtonSx}>
                <IosShareIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            <Typography
              component='h1'
              sx={{
                position: 'relative',
                zIndex: 1,
                mt: { xs: 3, md: 4 },
                color: YELLOW,
                fontSize: 'clamp(34px, 6vw, 46px)',
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
              }}
            >
              {firstName}
              {lastName && (
                <>
                  <br />
                  {lastName}
                </>
              )}
            </Typography>

            {/* The white rule under the name, straight from the print card */}
            <Box
              aria-hidden
              sx={{
                position: 'relative',
                zIndex: 1,
                height: 2,
                width: '74%',
                backgroundColor: '#fff',
                my: 1.5,
              }}
            />

            {card.title && (
              <Typography
                sx={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 800, color: '#fff' }}
              >
                {card.title}
              </Typography>
            )}
            {card.company && (
              <Typography
                sx={{ position: 'relative', zIndex: 1, mt: 0.5, fontSize: 12, fontWeight: 700, color: MUTED }}
              >
                {card.company}
              </Typography>
            )}
            {(card.city || card.country) && (
              <Typography
                sx={{ position: 'relative', zIndex: 1, mt: 0.5, fontSize: 12, fontWeight: 700, color: MUTED }}
              >
                {[card.city, card.country].filter(Boolean).join(', ')}
              </Typography>
            )}
            {card.bio && (
              <Typography
                sx={{ position: 'relative', zIndex: 1, mt: 1.5, fontSize: 13, lineHeight: 1.6, color: '#c9c9e6' }}
              >
                {card.bio}
              </Typography>
            )}

            {/* Contact lines */}
            <Box sx={{ position: 'relative', zIndex: 1, mt: 2.5, display: 'flex', flexDirection: 'column' }}>
              {card.phone && (
                <ContactLine icon={PhoneIcon} label={card.phone} href={`tel:${card.phone}`} />
              )}
              {card.email && (
                <ContactLine icon={EmailIcon} label={card.email} href={`mailto:${card.email}`} />
              )}
              {waLink && <ContactLine icon={WhatsAppIcon} label='WhatsApp' href={waLink} />}
              {card.phone && (
                <ContactLine icon={ChatBubbleOutlineIcon} label='Send an SMS' href={`sms:${card.phone}`} />
              )}
              {card.booking_url && (
                <ContactLine
                  icon={CalendarMonthIcon}
                  label='See my calendar'
                  href={normalizeUrl(card.booking_url)}
                />
              )}
              {card.website && (
                <ContactLine
                  icon={LanguageIcon}
                  label={card.website.replace(/^https?:\/\//, '')}
                  href={normalizeUrl(card.website)}
                />
              )}
            </Box>

            {socialEntries.length > 0 && (
              <Stack direction='row' spacing={1.25} sx={{ position: 'relative', zIndex: 1, mt: 2 }}>
                {socialEntries.map(([platform, url]) => {
                  const Icon = SOCIAL_ICONS[platform];
                  return (
                    <IconButton
                      key={platform}
                      aria-label={platform}
                      component='a'
                      href={normalizeUrl(url)}
                      target='_blank'
                      rel='noopener noreferrer'
                      sx={{ ...circleButtonSx, width: 40, height: 40 }}
                    >
                      <Icon sx={{ fontSize: 21 }} />
                    </IconButton>
                  );
                })}
              </Stack>
            )}

            {/* Add to contacts — the one yellow button on the page */}
            <Button
              component='a'
              href={vcardUrl}
              startIcon={<PersonAddAlt1Icon />}
              fullWidth
              sx={{
                position: 'relative',
                zIndex: 1,
                mt: 3,
                py: 1.6,
                borderRadius: 2.5,
                backgroundColor: YELLOW,
                color: NAVY,
                fontSize: 15,
                fontWeight: 800,
                textTransform: 'none',
                transition: 'all .3s',
                '&:hover': {
                  backgroundColor: YELLOW,
                  transform: 'translateY(-3px)',
                  boxShadow: '0 14px 30px -12px rgba(241,214,30,0.8)',
                },
              }}
            >
              Add to Contacts
            </Button>

            <Button
              onClick={handleShare}
              startIcon={<IosShareIcon />}
              fullWidth
              sx={{
                position: 'relative',
                zIndex: 1,
                mt: 1.25,
                py: 1.3,
                borderRadius: 2.5,
                border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#fff',
                fontSize: 14.5,
                fontWeight: 700,
                textTransform: 'none',
                transition: 'all .3s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {copied ? 'Link copied!' : 'Share card'}
            </Button>
          </Box>

          {/* ---------- Front of the card: the company ---------- */}
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              mt: { xs: 3, md: 0 },
              pt: { xs: 3.5, md: 5 },
              pb: { xs: 4, md: 5 },
              px: { xs: 0, md: 4.5 },
              borderLeft: { md: '1px solid rgba(255,255,255,0.1)' },
            }}
          >
            <Box
              component='img'
              src={WORDMARK_SRC}
              alt='Pupscribe'
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'block',
                mx: 'auto',
                width: { xs: 150, md: 190 },
              }}
            />

            {/* Flat magenta band carrying the bone, replacing the printed arcs */}
            <Box sx={{ position: 'relative', mt: { xs: 3, md: 4.5 } }}>
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: { xs: 0, md: -36 },
                  right: { xs: 0, md: -36 },
                  top: '50%',
                  height: '58%',
                  transform: 'translateY(-50%)',
                  backgroundColor: MAGENTA,
                }}
              />
              <Box sx={{ position: 'relative', px: { xs: 1.5, md: 0 } }}>
                <BrandBone brands={brands} />
              </Box>
            </Box>

            <Typography
              component='a'
              href='https://pupscribe.in'
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                display: 'block',
                width: 'fit-content',
                mx: 'auto',
                mt: { xs: 3, md: 4.5 },
                textAlign: 'center',
                fontSize: { xs: 11, md: 13 },
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#fff',
                textDecoration: 'none',
                transition: 'color .2s',
                '&:hover': { color: YELLOW, textDecoration: 'underline' },
                textUnderlineOffset: 4,
              }}
            >
              www.pupscribe.in
            </Typography>
            <Typography
              sx={{
                mx: 'auto',
                mt: 1,
                maxWidth: 300,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.6,
                color: MUTED,
              }}
            >
              {REGISTERED_ADDRESS}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* QR modal */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{
          sx: { backgroundColor: NAVY, borderRadius: 3, backgroundImage: 'none', overflow: 'hidden' },
        }}
      >
        <Box sx={{ position: 'relative', p: 3.5, textAlign: 'center' }}>
          <Box
            aria-hidden
            sx={{ position: 'absolute', left: 48, right: 48, top: 0, height: 3, backgroundColor: YELLOW }}
          />
          <IconButton
            aria-label='Close'
            onClick={() => setQrOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.6)' }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>

          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{card.name}</Typography>
          <Typography sx={{ fontSize: 14, color: MUTED, mb: 2.5 }}>Scan to open this card</Typography>

          <Box sx={{ display: 'inline-flex', p: 2, borderRadius: 2.5, backgroundColor: '#fff' }}>
            {cardUrl && (
              <QRCodeCanvas
                id='card-qr-canvas'
                value={`${cardUrl}?src=qr`}
                size={196}
                level='M'
                fgColor={NAVY}
              />
            )}
          </Box>

          <Typography sx={{ mt: 1.5, fontSize: 12, color: MUTED, wordBreak: 'break-all' }}>
            {cardUrl}
          </Typography>

          <Stack spacing={1.25} sx={{ mt: 2.5 }}>
            <Button
              onClick={downloadQr}
              startIcon={<DownloadIcon />}
              sx={{
                py: 1.3,
                borderRadius: 2,
                backgroundColor: YELLOW,
                color: NAVY,
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { backgroundColor: YELLOW },
              }}
            >
              Download PNG
            </Button>
            <Button
              onClick={copyUrl}
              startIcon={<ContentCopyIcon />}
              sx={{
                py: 1.3,
                borderRadius: 2,
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {qrCopied ? 'Link copied!' : 'Copy URL'}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
};

export default CardPage;

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const slug = String(params?.id || '');
  // Card content changes rarely — let the CDN serve it and revalidate in the
  // background, so most visitors get a cached response instead of a DB hit.
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');

  const get = async (path: string) => {
    const { data } = await axios.get(`${API_URL}${path}`, { timeout: 8000 });
    return data;
  };

  let card: Card | null = null;
  let brands: Brand[] = [];
  try {
    card = await get(`/cards/${encodeURIComponent(slug)}`);
  } catch {
    // 404 or API error — render the not-found state below
  }
  if (card) {
    try {
      const data = await get('/products/brands');
      brands = (data?.brands || []).filter((b: Brand) => b?.image);
    } catch {
      // The bone strip is decorative — never let it break the page.
    }
  }
  return { props: { card, brands } };
};
