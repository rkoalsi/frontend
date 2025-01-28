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
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';

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
  const publicPaths = ['/login', '/forgot_password', '/reset_password'];

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
        background: 'linear-gradient(135deg, #5A7CA4, #2B4864, #172335)',
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar position='sticky' sx={{ backgroundColor: '#2C3E50' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant='h6'
            fontWeight='bold'
            sx={{ cursor: 'pointer', color: 'white' }}
            onClick={() => {
              if (!shared) router.push('/');
            }}
          >
            Order Management
          </Typography>
          <Box display={'flex'} flexDirection={'row'} gap={'16px'}>
            {user &&
              user.data &&
              user.data.role.includes('admin') &&
              !router.pathname.includes('admin') && (
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => router.push('/admin')}
                  sx={{ textTransform: 'none' }}
                >
                  Admin Dashboard
                </Button>
              )}
            {user && (
              <Button
                variant='contained'
                color='error'
                onClick={logout}
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth='lg'
        sx={{
          minHeight: isMobileOrTablet ? '100vh' : null,
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
