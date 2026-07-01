import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
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
  Pets,
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
import NotificationBell from './common/NotificationBell';

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
          height: '100vh',
          background: isDark
            ? 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 50%, #1a365d 100%)'
            : '#f0f4f8',
        }}
      >
        <CircularProgress sx={{ color: '#38a169' }} />
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

  const mainBg = isDark
    ? 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 50%, #1a365d 100%)'
    : '#f0f4f8';

  const sidebarBg = isDark ? '#2d4a6f' : '#e8f4ee';
  const sidebarText = isDark ? 'white' : '#1a2b3c';
  const activeItemBg = isDark ? '#38a169' : 'rgba(56, 161, 105, 0.15)';
  const activeItemText = isDark ? 'white' : '#2d6a4f';
  const hoverItemBg = isDark ? '#38a169' : 'rgba(56, 161, 105, 0.1)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: mainBg }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position='fixed'
        elevation={0}
        sx={{
          zIndex: 1300,
          backgroundColor: '#1a2b3c',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          {/* Left: Hamburger + Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              edge='start'
              data-tour='sidebar-toggle'
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: '8px',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              onClick={() => router.push('/customer')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}
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
                  Customer Portal
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box display='flex' alignItems='center' gap={1}>
            {user && router.pathname.includes('/customer') && (
              isMobile ? (
                <Tooltip title='Back to Home' arrow>
                  <IconButton
                    onClick={() => router.push('/')}
                    size='small'
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
                    }}
                  >
                    <HomeIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button
                  size='small'
                  onClick={() => router.push('/')}
                  startIcon={<HomeIcon fontSize='small' />}
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1.5,
                    boxShadow: 'none',
                    '& .MuiButton-startIcon': { mr: 0.5 },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.24)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Home
                </Button>
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
            height: 'calc(100vh - 64px)',
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
          background: mainBg,
          minHeight: '100vh',
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
