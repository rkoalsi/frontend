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
  Logout,
  AdminPanelSettings,
  LineAxisOutlined,
  DarkMode,
  LightMode,
  PersonAddAlt,
} from '@mui/icons-material';
import { useColorMode } from '../context/ColorModeContext';
import NotificationBell from '../components/common/NotificationBell';
import {
  BrandLockup,
  TopbarAction,
  topbarDangerIconSx,
  topbarDividerSx,
  topbarIconSx,
  topbarSx,
  topbarToolbarSx,
  useTopbarScrolled,
} from '../components/common/Topbar';

const Layout = ({ children }: any) => {
  const { user = {}, loading, logout }: any = useContext(Auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';
  // Must sit above the early returns below — hooks can't be conditional.
  const scrolled = useTopbarScrolled();

  const [isRouterReady, setIsRouterReady] = useState(false);
  const { shared } = router.query;

  const [originalPath, setOriginalPath] = useState(null);

  const publicPaths = ['/login', '/register', '/wholesale-pet-supplies', '/forgot_password', '/reset_password', '/catalogues/all_products', '/catalogues', '/cards/[id]'];

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

  const pathIsPublic = publicPaths.includes(router.pathname);

  useEffect(() => {
    if (!isRouterReady) return;

    if (!loading && !user && !shared && !pathIsPublic) {
      router.replace('/login');
    }
  }, [user, loading, shared, isRouterReady, router, pathIsPublic]);

  // Public pages render immediately instead of waiting for the router and the
  // auth check. They do not depend on `user`, and gating them behind the
  // loading state meant the server-rendered HTML for /register, /catalogues and
  // the marketing page was just "Loading..." — nothing for a crawler to index.
  if (!pathIsPublic && (!isRouterReady || (loading && !user))) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100dvh',
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
        minHeight: '100dvh',
        flexDirection: 'column',
        background: mainBg,
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar position='sticky' elevation={0} sx={topbarSx(scrolled)}>
        <Toolbar sx={topbarToolbarSx}>
          <BrandLockup
            descriptor='Marketplace'
            onClick={shared ? undefined : () => router.push('/')}
          />

          {/* Right Side Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Register — shown to logged-out visitors on public pages */}
            {!loading &&
              !user &&
              !['/register', '/login'].includes(router.pathname) && (
                <TopbarAction
                  icon={<PersonAddAlt fontSize='small' />}
                  label='Register'
                  onClick={() => router.push('/register')}
                  compact={isMobileOrTablet}
                />
              )}
            {user && (
              user.role?.includes('admin') ||
              user.role?.includes('catalogue_manager') ||
              user.role?.includes('marketing_manager') ||
              user.role?.includes('hr')
            ) && !router.pathname.includes('admin') && (
              <TopbarAction
                icon={<AdminPanelSettings fontSize='small' />}
                label='Admin'
                onClick={() => router.push('/admin')}
                compact={isMobileOrTablet}
              />
            )}
            {user && user.role === 'customer' && !router.pathname.includes('customer') && (
              <TopbarAction
                icon={<LineAxisOutlined fontSize='small' />}
                label='Dashboard'
                onClick={() => router.push('/customer')}
                compact={isMobileOrTablet}
              />
            )}

            {/* Dark/Light Mode Toggle */}
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
              <IconButton
                onClick={toggleColorMode}
                size='small'
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                sx={topbarIconSx}
              >
                {isDark ? <LightMode fontSize='small' /> : <DarkMode fontSize='small' />}
              </IconButton>
            </Tooltip>

            {user && <NotificationBell />}

            {user && (
              <>
                <Divider orientation='vertical' flexItem sx={topbarDividerSx} />
                <Tooltip title='Logout' arrow>
                  <IconButton onClick={logout} size='small' aria-label='Logout' sx={topbarDangerIconSx}>
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
