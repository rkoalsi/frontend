import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CssBaseline,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Logout,
  Inventory2 as ProductsIcon,
  ReceiptLong as OrdersIcon,
  Warehouse as StockIcon,
  Storefront as PreviewIcon,
  Palette as BrandIcon,
  ManageAccounts as ProfileIcon,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';
import { useColorMode } from '../context/ColorModeContext';
import { appShellBg } from '../util/surfaces';
import {
  BrandLockup,
  topbarDangerIconSx,
  topbarDividerSx,
  topbarIconSx,
  topbarSx,
  topbarToolbarSx,
  useTopbarScrolled,
} from './common/Topbar';

// Fixed nav rather than permissions-driven: a distributor is external and the
// MVP surface is three read-only pages. Move this to the permissions
// collection if the portal ever grows role variants.
const distributorMenuItems = [
  { text: 'Dashboard', icon: 'Dashboard', path: '/distributor' },
  { text: 'My Products', icon: 'Products', path: '/distributor/products' },
  { text: 'Stock', icon: 'Stock', path: '/distributor/stock' },
  { text: 'Orders', icon: 'Orders', path: '/distributor/orders' },
  { text: 'Order Form Preview', icon: 'Preview', path: '/distributor/preview' },
  { text: 'Brand Profile', icon: 'Brand', path: '/distributor/brand' },
  { text: 'Profile', icon: 'Profile', path: '/distributor/profile' },
];

const iconMap: { [key: string]: React.ReactElement } = {
  Dashboard: <Dashboard />,
  Products: <ProductsIcon />,
  Stock: <StockIcon />,
  Orders: <OrdersIcon />,
  Preview: <PreviewIcon />,
  Brand: <BrandIcon />,
  Profile: <ProfileIcon />,
};

const DistributorLayout = ({ children }: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const router = useRouter();
  const { user, loading, logout }: any = useContext(AuthContext);
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';
  // Must sit above the early returns below — hooks can't be conditional.
  const scrolled = useTopbarScrolled();

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.error('You are not logged in. Please log in to continue.');
      router.replace('/login');
      return;
    }

    // Hard role gate. The backend enforces this too — this only spares the
    // user a screen of failed requests.
    if (user.role !== 'distributor') {
      toast.error('You are not authorized to access this page.');
      router.replace('/');
      return;
    }

    setIsCheckingAccess(false);
  }, [user, loading, router]);

  if (loading || isCheckingAccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100dvh',
          background: appShellBg(isDark),
        }}
      >
        <CircularProgress color='primary' />
      </Box>
    );
  }

  if (!user) return null;

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    if (isMobile) setSidebarOpen(false);
  };

  const mainBg = appShellBg(isDark);
  const sidebarBg = isDark ? '#221E48' : '#FFFFFF';
  const sidebarText = isDark ? 'rgba(241,238,255,0.92)' : '#1C1A33';
  const activeItemBg = isDark ? 'rgba(167,150,255,0.2)' : 'rgba(70,51,184,0.1)';
  const activeItemText = isDark ? '#BCAFFF' : '#4633B8';
  const hoverItemBg = isDark ? 'rgba(167,150,255,0.12)' : 'rgba(70,51,184,0.06)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', background: mainBg }}>
      <CssBaseline />

      <AppBar position='fixed' elevation={0} sx={topbarSx(scrolled)}>
        <Toolbar sx={topbarToolbarSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            <IconButton
              edge='start'
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
              sx={topbarIconSx}
            >
              <MenuIcon />
            </IconButton>
            <BrandLockup
              descriptor='Distributor Portal'
              onClick={() => router.push('/distributor')}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
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

            <Divider orientation='vertical' flexItem sx={topbarDividerSx} />
            <Tooltip title='Logout' arrow>
              <IconButton onClick={logout} size='small' aria-label='Logout' sx={topbarDangerIconSx}>
                <Logout fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: isSidebarOpen ? 240 : 0,
          transition: 'width 0.3s',
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isSidebarOpen ? 240 : 0,
            boxSizing: 'border-box',
            backgroundColor: sidebarBg,
            color: sidebarText,
            paddingTop: 2,
            borderRight: isDark ? 'none' : '1px solid rgba(0,0,0,0.08)',
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            height: 'calc(100dvh - 64px)',
            '&::-webkit-scrollbar': { width: 0, background: 'transparent' },
            scrollbarWidth: 'none',
          }}
        >
          <List>
            {distributorMenuItems.map(({ text, icon, path }) => (
              <ListItem
                component='a'
                key={path}
                onClick={() => handleMenuItemClick(path)}
                sx={{
                  marginY: 0.5,
                  paddingX: 2,
                  paddingY: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  backgroundColor: router.pathname === path ? activeItemBg : sidebarBg,
                  color: router.pathname === path ? activeItemText : sidebarText,
                  transition: 'background-color 0.3s, color 0.3s',
                  '&:hover': { backgroundColor: hoverItemBg, color: activeItemText },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40, marginRight: 1 }}>
                  {iconMap[icon] || <Dashboard />}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{
                    color: 'inherit',
                    fontSize: 16,
                    fontWeight: '500',
                    fontFamily: 'Roboto, sans-serif',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          background: mainBg,
          minHeight: '100dvh',
          padding: { xs: 1.5, sm: 2, md: 3 },
          transition: 'margin-left 0.3s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DistributorLayout;
