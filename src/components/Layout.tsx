// components/Layout.jsx

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
import { Pets, Logout, AdminPanelSettings, LineAxisOutlined } from '@mui/icons-material';
import CustomButton from '../components/common/Button';
const Layout = ({ children }: any) => {
  const { user = {}, loading, logout }: any = useContext(Auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [isRouterReady, setIsRouterReady] = useState(false);
  const { shared } = router.query;

  // Store the initial route for shared links
  const [originalPath, setOriginalPath] = useState(null);

  // Define public paths
  const publicPaths = ['/login', '/forgot_password', '/reset_password', '/catalogues/all_products'];

  useEffect(() => {
    if (router.isReady) {
      setIsRouterReady(true);

      if (shared === 'true' && !originalPath) {
        setOriginalPath(router.asPath as any); // Save the original path on the first render
      }
    }
  }, [router.isReady, shared, originalPath, router.asPath]);

  useEffect(() => {
    // Prevent navigation for shared link users except public paths
    if (shared === 'true' && originalPath) {
      const handleRouteChange = (url: any) => {
        const path = url.split('?')[0]; // Remove query parameters
        if (
          path !== originalPath &&
          !publicPaths.includes(path) && // Allow navigation to public paths
          !url.startsWith('/login') // Extra safety
        ) {
          router.replace(originalPath); // Redirect back to the original path
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
      router.replace('/login'); // Use replace to prevent adding to history stack
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
          backgroundColor: '#f4f4f4',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    ); // Show a loading screen while waiting for the router or authentication
  }

  if (!user && !shared && !publicPaths.includes(router.pathname)) {
    return null; // Redirect is handled in useEffect
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
            {user && user.data && (
              user.data.role.includes('admin') ||
              user.data.role.includes('catalogue_manager') ||
              user.data.role.includes('hr')
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
            {user && user.data && user.data.role === 'customer' && !router.pathname.includes('customer') && (
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
            {user && user.data && (
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
          // minHeight: isMobileOrTablet ? '100vh' : null,
          flexGrow: 1,
          width: isMobileOrTablet ? '100%' : null,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // padding: isMobileOrTablet ? '16px' : '0px',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
