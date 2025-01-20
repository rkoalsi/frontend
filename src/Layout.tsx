import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Auth from '../src/Auth';
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
  const [originalPath, setOriginalPath] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      setIsRouterReady(true);
      if (shared === 'true' && !originalPath) {
        setOriginalPath(router.asPath); // Save the original path on the first render
      }
    }
  }, [router.isReady, shared, originalPath]);

  useEffect(() => {
    // Prevent navigation to other routes for shared link users
    if (shared === 'true' && originalPath) {
      const handleRouteChange = (url: string) => {
        if (url !== originalPath) {
          router.replace(originalPath); // Redirect back to the original path
        }
      };

      router.events.on('routeChangeStart', handleRouteChange);
      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }
  }, [shared, originalPath, router]);

  useEffect(() => {
    // Prevent unauthorized access to protected routes
    if (!isRouterReady) return;

    const publicPaths = ['/login'];
    const pathIsPublic = publicPaths.includes(router.pathname);

    if (!loading && !user && !shared && !pathIsPublic) {
      router.push('/login');
    }
  }, [user, loading, shared, isRouterReady, router]);

  if (!isRouterReady) {
    return null; // Wait for the router to be ready
  }

  if (!user && !shared && router.pathname !== '/login') {
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: isMobileOrTablet ? '16px' : '0px',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
