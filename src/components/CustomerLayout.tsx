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
  Home as HomeIcon,
  ShoppingCart as OrdersIcon,
  Analytics,
  ManageAccounts,
  History,
  Receipt,
  CreditCard,
  LocalShipping,
  Payments,
  DarkMode,
  LightMode,
  LocationOn,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';
import { useColorMode } from '../context/ColorModeContext';
import { appShellBg } from '../util/surfaces';
import NotificationBell from './common/NotificationBell';
import {
  BrandLockup,
  TopbarAction,
  topbarDangerIconSx,
  topbarDividerSx,
  topbarIconSx,
  topbarSx,
  topbarToolbarSx,
  useTopbarScrolled,
} from './common/Topbar';

const iconMap: { [key: string]: React.ReactElement } = {
  Dashboard: <Dashboard />,
  OrdersIcon: <OrdersIcon />,
  Analytics: <Analytics />,
  ManageAccounts: <ManageAccounts />,
  History: <History />,
  Receipt: <Receipt />,
  CreditCard: <CreditCard />,
  LocalShipping: <LocalShipping />,
  Payments: <Payments />,
  LocationOn: <LocationOn />,
};

const defaultCustomerMenuItems = [
  { text: 'Dashboard', icon: 'Dashboard', path: '/customer' },
  { text: 'My Orders (Estimates)', icon: 'History', path: '/customer/orders' },
  { text: 'My Account', icon: 'ManageAccounts', path: '/customer/account' },
  { text: 'Analytics', icon: 'Analytics', path: '/customer/analytics' },
  { text: 'Payments', icon: 'Payment', path: '/customer/payments' },
  // { text: 'My Addresses', icon: 'LocationOn', path: '/customer/addresses' },
];

const CustomerLayout = ({ children }: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const router = useRouter();
  const { user, loading, logout, permissions, checkRouteAccess }: any = useContext(AuthContext);
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';
  // Must sit above the early returns below — hooks can't be conditional.
  const scrolled = useTopbarScrolled();

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          toast.error('You are not logged in. Please log in to continue.');
          router.replace('/login');
          return;
        }

        const isCustomerRole = user?.role === 'customer';
        const isCustomerRoute = router.pathname.startsWith('/customer');

        if (isCustomerRoute && isCustomerRole) {
          setIsCheckingAccess(false);
          return;
        }

        const canAccess = await checkRouteAccess(router.pathname);
        if (!canAccess && !isCustomerRole) {
          toast.error('You are not authorized to access this page.');
          router.replace('/');
        }
      }
      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [user, loading, router.pathname, checkRouteAccess]);

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

  if (!user) {
    return null;
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    if (isMobile) setSidebarOpen(false);
  };

  const getMenuItems = () => {
    if (permissions?.menu_items && permissions.menu_items.length > 0) {
      const customerItems = permissions.menu_items.filter(
        (item: any) => item.path.startsWith('/customer')
      );
      if (customerItems.length > 0) return customerItems;
    }
    return defaultCustomerMenuItems;
  };

  const menuItems = getMenuItems();

  const mainBg = appShellBg(isDark);

  const sidebarBg = isDark ? '#221E48' : '#FFFFFF';
  const sidebarText = isDark ? 'rgba(241,238,255,0.92)' : '#1C1A33';
  const activeItemBg = isDark ? 'rgba(167,150,255,0.2)' : 'rgba(70,51,184,0.1)';
  const activeItemText = isDark ? '#BCAFFF' : '#4633B8';
  const hoverItemBg = isDark ? 'rgba(167,150,255,0.12)' : 'rgba(70,51,184,0.06)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', background: mainBg }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position='fixed' elevation={0} sx={topbarSx(scrolled)}>
        <Toolbar sx={topbarToolbarSx}>
          {/* Left: Hamburger + Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            <IconButton
              edge='start'
              data-tour='sidebar-toggle'
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
              sx={topbarIconSx}
            >
              <MenuIcon />
            </IconButton>
            <BrandLockup descriptor='Customer Portal' onClick={() => router.push('/customer')} />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {user && router.pathname.includes('/customer') && (
              <TopbarAction
                icon={<HomeIcon fontSize='small' />}
                label='Home'
                onClick={() => router.push('/')}
                compact={isMobile}
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

            <Divider orientation='vertical' flexItem sx={topbarDividerSx} />
            <Tooltip title='Logout' arrow>
              <IconButton onClick={logout} size='small' aria-label='Logout' sx={topbarDangerIconSx}>
                <Logout fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
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
            {menuItems
              .sort((a: any, b: any) => a.text.localeCompare(b.text))
              .map(({ text, icon, path }: any, index: number) => (
                <ListItem
                  component='a'
                  key={index}
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
                    '&:hover': {
                      backgroundColor: hoverItemBg,
                      color: activeItemText,
                    },
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

      {/* Main Content */}
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

export default CustomerLayout;
