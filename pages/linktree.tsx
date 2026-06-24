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
  AutoAwesome,
  OpenInNew,
  Pets,
  DarkMode,
  LightMode,
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

interface LinktreeConfig {
  is_active?: boolean;
  accent_color?: string;
  links?: LinkItem[];
  whatsapp?: {
    enabled?: boolean;
    number?: string;
    message?: string;
    label?: string;
  };
  spin_wheel?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    cta_text?: string;
  };
}

const normalizeUrl = (url?: string) => {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
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

  const accent = config?.accent_color || theme.palette.primary.main;

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
  const spin = config?.spin_wheel;
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
          minHeight: 'calc(100vh - 56px)',
          width: '100%',
          background: `radial-gradient(1200px circle at 50% -10%, ${alpha(
            accent,
            0.18
          )}, transparent 60%), ${theme.palette.background.default}`,
          display: 'flex',
          justifyContent: 'center',
          py: { xs: 4, sm: 6 },
          px: 2,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 520,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Links */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {links.map((link, idx) => {
              const linkColor = link.color || accent;
              return (
              <Card
                key={link.id || idx}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(linkColor, 0.4)}`,
                  borderLeft: `5px solid ${linkColor}`,
                  bgcolor: alpha(linkColor, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                  transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease, background-color .15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: linkColor,
                    bgcolor: alpha(linkColor, theme.palette.mode === 'dark' ? 0.26 : 0.16),
                    boxShadow: `0 8px 20px ${alpha(linkColor, 0.3)}`,
                  },
                }}
              >
                <CardActionArea
                  component="a"
                  href={normalizeUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.25,
                    minHeight: 64,
                  }}
                >
                  {link.image_url ? (
                    <Avatar
                      variant="rounded"
                      src={link.image_url}
                      alt={link.text || ''}
                      sx={{ width: 48, height: 48, bgcolor: '#fff' }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 48, height: 48, bgcolor: alpha(linkColor, 0.15), color: linkColor }}
                    >
                      <OpenInNew />
                    </Avatar>
                  )}
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ flex: 1, textAlign: 'center', pr: 5 }}
                  >
                    {link.text || link.url}
                  </Typography>
                </CardActionArea>
              </Card>
              );
            })}

            {links.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No links to show yet.
              </Typography>
            )}
          </Box>

          {/* Spin the wheel teaser */}
          {spin?.enabled && (
            <Card
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: 3,
                p: 3,
                textAlign: 'center',
                border: `1px dashed ${accent}`,
                background: `linear-gradient(135deg, ${alpha(accent, 0.12)}, ${alpha(
                  accent,
                  0.04
                )})`,
              }}
            >
              <AutoAwesome sx={{ color: accent, fontSize: 32 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                {spin.title || 'Spin & Win'}
              </Typography>
              {spin.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {spin.description}
                </Typography>
              )}
              <Box
                sx={{
                  mt: 2,
                  display: 'inline-block',
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: alpha(accent, 0.15),
                  color: accent,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Coming soon
              </Box>
            </Card>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Powered by Pupscribe
          </Typography>
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
