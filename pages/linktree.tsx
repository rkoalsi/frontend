import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Card,
  CardActionArea,
  Fab,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  WhatsApp,
  OpenInNew,
  Pets,
  DarkMode,
  LightMode,
  ChevronRight,
  Call,
  Email,
  Storefront,
  Instagram,
  LinkedIn,
  Favorite,
  Link as LinkIcon,
} from '@mui/icons-material';
import axiosInstance from '../src/util/axios';
import { useColorMode } from '../src/context/ColorModeContext';

interface LinkItem {
  id?: string;
  text?: string;
  image_url?: string;
  url?: string;
  color?: string;
  order?: number;
  is_active?: boolean;
}

interface FooterLink {
  id?: string;
  icon?: string;
  label?: string;
  url?: string;
}

interface LinktreeConfig {
  is_active?: boolean;
  accent_color?: string;
  logo_url?: string;
  header?: { title?: string; description?: string };
  footer?: {
    tagline?: string;
    stat?: string;
    copyright?: string;
    links?: FooterLink[];
  };
  links?: LinkItem[];
  whatsapp?: {
    enabled?: boolean;
    number?: string;
    message?: string;
    label?: string;
  };
}

const DEFAULT_ACCENT = '#29ABE2';

const DEFAULT_HEADER = {
  title: 'HOUSE OF BRANDS FOR PETS',
  description:
    "We filter pet products, so you don't have to. Bringing the world's best pet brands to retailers across India.",
};

const FOOTER_ICONS: Record<string, React.ElementType> = {
  phone: Call,
  email: Email,
  store: Storefront,
  instagram: Instagram,
  linkedin: LinkedIn,
  whatsapp: WhatsApp,
  link: LinkIcon,
};

const normalizeUrl = (url?: string) => {
  if (!url) return '#';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
};

const buildWhatsAppLink = (number?: string, message?: string) => {
  const digits = (number || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

const LinkTreePage = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const [config, setConfig] = useState<LinktreeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/linktree');
        if (mounted) setConfig(res.data);
      } catch (e) {
        if (mounted) setConfig({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const accent = config?.accent_color || DEFAULT_ACCENT;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const links = (config?.links || []).filter((l) => l.is_active !== false);
  const whatsapp = config?.whatsapp;
  const logoUrl = config?.logo_url || '';
  const header = { ...DEFAULT_HEADER, ...(config?.header || {}) };
  const footer = {
    tagline: 'BarkButler – House of Brands for Pets',
    stat: '700+ Retail Stores Across India',
    copyright: '© 2026 BarkButler',
    links: [] as FooterLink[],
    ...(config?.footer || {}),
  };
  const waLink = whatsapp?.enabled
    ? buildWhatsAppLink(whatsapp?.number, whatsapp?.message)
    : '';

  return (
    <>
      <Head>
        <title>Pupscribe</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      {/* Sticky header — mirrors the main app top bar */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          height: { xs: 56, sm: 64 },
          backgroundColor: '#1a2b3c',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, userSelect: 'none' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4E8098, #2B4864)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Pets sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}
            >
              Pupscribe
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1,
                fontSize: '0.65rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Order Portal
            </Typography>
          </Box>
        </Box>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleColorMode} sx={{ color: '#fff' }}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 56px)',
          width: '100%',
          background: `radial-gradient(900px circle at 50% -5%, ${alpha(
            accent,
            0.12
          )}, transparent 55%), #f7fbff`,
          display: 'flex',
          justifyContent: 'center',
          py: { xs: 4, sm: 6 },
          px: 2,
        }}
      >
        {/* Decorative paw / heart outlines */}
        <Favorite sx={{ position: 'absolute', left: { xs: 16, sm: 48 }, top: 96, fontSize: 40, color: alpha(accent, 0.2) }} />
        <Pets sx={{ position: 'absolute', right: { xs: 20, sm: 56 }, top: 96, fontSize: 44, color: alpha(accent, 0.2) }} />
        <Pets sx={{ position: 'absolute', left: { xs: 12, sm: 40 }, top: '33%', fontSize: 54, color: alpha(accent, 0.1) }} />
        <Pets sx={{ position: 'absolute', right: { xs: 12, sm: 40 }, top: '33%', fontSize: 54, color: alpha(accent, 0.1) }} />

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
            {logoUrl && (
              <Box
                component="img"
                src={logoUrl}
                alt="BarkButler"
                sx={{ width: { xs: 220, sm: 300 }, maxWidth: '80%', height: 'auto' }}
              />
            )}
            <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: accent }} />
            {header.title && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 24, height: '1px', bgcolor: accent }} />
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1f2937', fontSize: { xs: 16, sm: 20 } }}
                >
                  {header.title}
                </Typography>
                <Box sx={{ width: 24, height: '1px', bgcolor: accent }} />
              </Box>
            )}
            {header.description && (
              <Typography variant="body1" sx={{ maxWidth: 440, color: '#475569' }}>
                {header.description}
              </Typography>
            )}
            <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: accent }} />
          </Box>

          {/* Links */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {links.map((link, idx) => (
              <Card
                key={link.id || idx}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#fff',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
                  border: '1px solid rgba(15,23,42,0.05)',
                  transition: 'transform .15s ease, box-shadow .15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.12)',
                  },
                }}
              >
                <CardActionArea
                  component="a"
                  href={normalizeUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.25, minHeight: 68 }}
                >
                  {link.image_url ? (
                    <Avatar
                      variant="rounded"
                      src={link.image_url}
                      alt={link.text || ''}
                      sx={{ width: 52, height: 52, bgcolor: '#fff', '& img': { objectFit: 'contain', p: 0.5 } }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 52, height: 52, bgcolor: alpha(accent, 0.12), color: accent }}
                    >
                      <OpenInNew />
                    </Avatar>
                  )}
                  <Box sx={{ width: '1px', height: 36, bgcolor: alpha(accent, 0.5) }} />
                  <Typography
                    fontWeight={700}
                    sx={{ flex: 1, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#1f2937', fontSize: { xs: 15, sm: 17 } }}
                  >
                    {link.text || link.url}
                  </Typography>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: accent,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight />
                  </Box>
                </CardActionArea>
              </Card>
            ))}

            {links.length === 0 && (
              <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                No links to show yet.
              </Typography>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
            {footer.links && footer.links.length > 0 && (
              <Card
                elevation={0}
                sx={{
                  width: '100%',
                  borderRadius: 3,
                  bgcolor: '#fff',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
                  border: '1px solid rgba(15,23,42,0.05)',
                  px: 1.5,
                  py: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'stretch',
                }}
              >
                {footer.links.map((fl, idx) => {
                  const Icon = FOOTER_ICONS[fl.icon || 'link'] || LinkIcon;
                  return (
                    <Box key={fl.id || idx} sx={{ display: 'flex', alignItems: 'stretch' }}>
                      {idx > 0 && <Box sx={{ width: '1px', bgcolor: 'rgba(15,23,42,0.1)', mx: 0.5 }} />}
                      <Box
                        component="a"
                        href={normalizeUrl(fl.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          width: 88,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 0.5,
                          textAlign: 'center',
                          textDecoration: 'none',
                          transition: 'transform .15s ease',
                          '&:hover': { transform: 'translateY(-2px)' },
                        }}
                      >
                        <Icon sx={{ color: accent, fontSize: 26 }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, color: '#475569' }}>
                          {fl.label}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Card>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, textAlign: 'center' }}>
              {footer.tagline && (
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 700, color: '#1f2937' }}>
                  {footer.tagline}
                  <Pets sx={{ fontSize: 16, color: accent }} />
                </Typography>
              )}
              {footer.stat && (
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 700, color: '#1f2937' }}>
                  {footer.stat}
                  <Favorite sx={{ fontSize: 16, color: accent }} />
                </Typography>
              )}
              {footer.copyright && (
                <Typography variant="caption" sx={{ mt: 0.5, color: '#94a3b8' }}>
                  {footer.copyright}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Floating WhatsApp button */}
        {waLink && (
          <Fab
            component="a"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={whatsapp?.label || 'Chat on WhatsApp'}
            sx={{
              position: 'fixed',
              bottom: { xs: 20, sm: 32 },
              right: { xs: 20, sm: 32 },
              bgcolor: '#25D366',
              color: '#fff',
              '&:hover': { bgcolor: '#1ebe5d' },
            }}
          >
            <WhatsApp />
          </Fab>
        )}
      </Box>
    </>
  );
};

export default LinkTreePage;
