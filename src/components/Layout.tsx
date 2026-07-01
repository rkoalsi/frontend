import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Auth from './Auth';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Pets,
  Logout,
  AdminPanelSettings,
  LineAxisOutlined,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import CustomButton from '../components/common/Button';
import { useColorMode } from '../context/ColorModeContext';
import NotificationBell from '../components/common/NotificationBell';

const Layout = ({ children }: any) => {
  const { user = {}, loading, logout }: any = useContext(Auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';

  const [isRouterReady, setIsRouterReady] = useState(false);
  const { shared } = router.query;

  const [originalPath, setOriginalPath] = useState(null);

  const publicPaths = ['/login', '/forgot_password', '/reset_password', '/catalogues/all_products', '/catalogues'];

  useEffect(() => {
    if (router.isReady) {
      setIsRouterReady(true);

      if (shared === 'true' && !originalPath) {
        setOriginalPath(router.asPath as any);
      }
    }
  }, [router.isReady, shared, originalPath, router.asPath]);

  useEffect(() => {
    if (shared === 'true' && originalPath) {
      const handleRouteChange = (url: any) => {
        const path = url.split('?')[0];
        if (
          path !== originalPath &&
          !publicPaths.includes(path) &&
          !url.startsWith('/login')
        ) {
          router.replace(originalPath);
        }
      };

      router.events.on('routeChangeStart', handleRouteChange);
      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }
  }, [shared, originalPath, router, publicPaths]);

  useEffect(() => {
    if (!isRouterReady) return;

    const pathIsPublic = publicPaths.includes(router.pathname);

    if (!loading && !user && !shared && !pathIsPublic) {
      router.replace('/login');
    }
  }, [user, loading, shared, isRouterReady, router, publicPaths]);

  if (!isRouterReady || (loading && !user)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user && !shared && !publicPaths.includes(router.pathname)) {
    return null;
  }

  const mainBg = theme.palette.background.default;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        background: mainBg,
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar
        position='sticky'
        elevation={0}
        sx={{
          backgroundColor: '#1a2b3c',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          {/* Brand Logo */}
          <Box
            onClick={() => { if (!shared) router.push('/'); }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: shared ? 'default' : 'pointer',
              userSelect: 'none',
            }}
          >
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
                variant='subtitle1'
                fontWeight={700}
                sx={{ color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}
              >
                Pupscribe
              </Typography>
              <Typography
                variant='caption'
                sx={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1, fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Order Portal
              </Typography>
            </Box>
          </Box>

          {/* Right Side Actions */}
          <Box display='flex' alignItems='center' gap={1}>
            {user && (
              user.role?.includes('admin') ||
              user.role?.includes('catalogue_manager') ||
              user.role?.includes('marketing_manager') ||
              user.role?.includes('hr')
            ) && !router.pathname.includes('admin') && (
              isMobileOrTablet ? (
                <Tooltip title='Admin Panel' arrow>
                  <IconButton
                    onClick={() => router.push('/admin')}
                    size='small'
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
                    }}
                  >
                    <AdminPanelSettings fontSize='small' />
                  </IconButton>
                </Tooltip>
              ) : (
                <CustomButton color='primary' onClick={() => router.push('/admin')} text='Admin' />
              )
            )}
            {user && user.role === 'customer' && !router.pathname.includes('customer') && (
              isMobileOrTablet ? (
                <Tooltip title='Dashboard' arrow>
                  <IconButton
                    onClick={() => router.push('/customer')}
                    size='small'
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
                    }}
                  >
                    <LineAxisOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
              ) : (
                <CustomButton color='secondary' onClick={() => router.push('/customer')} text='Dashboard' />
              )
            )}

            {/* Dark/Light Mode Toggle */}
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
              <IconButton
                onClick={toggleColorMode}
                size='small'
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' },
                }}
              >
                {isDark ? <LightMode fontSize='small' /> : <DarkMode fontSize='small' />}
              </IconButton>
            </Tooltip>

            {user && <NotificationBell />}

            {user && (
              <>
                <Divider orientation='vertical' flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 0.5 }} />
                <Tooltip title='Logout' arrow>
                  <IconButton
                    onClick={logout}
                    size='small'
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      backgroundColor: 'rgba(217,83,79,0.12)',
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: 'rgba(217,83,79,0.25)', color: '#ff6b6b' },
                    }}
                  >
                    <Logout fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth='lg'
        sx={{
          flexGrow: 1,
          width: isMobileOrTablet ? '100%' : null,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
