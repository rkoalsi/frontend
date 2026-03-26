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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';

// Icon mapping for dynamic icon rendering
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
};

// Default customer menu items (fallback if backend doesn't provide)
const defaultCustomerMenuItems = [
  { text: 'Dashboard', icon: 'Dashboard', path: '/customer' },
  { text: 'My Orders (Estimates)', icon: 'History', path: '/customer/orders' },
  { text: 'My Account', icon: 'ManageAccounts', path: '/customer/account' },
  { text: 'Analytics', icon: 'Analytics', path: '/customer/analytics' },
  { text: 'Payments', icon: 'Payment', path: '/customer/payments' },
];

const CustomerLayout = ({ children }: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const router = useRouter();
  const { user, loading, logout, permissions, checkRouteAccess }: any = useContext(AuthContext);

  // Keep sidebar open on desktop, closed on mobile
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

        // For customer routes, allow access if user has customer role
        // This is a frontend fallback until backend permissions are configured
        const isCustomerRole = user?.data?.role === 'customer';
        const isCustomerRoute = router.pathname.startsWith('/customer');

        if (isCustomerRoute && isCustomerRole) {
          // Customer accessing customer routes - allow
          setIsCheckingAccess(false);
          return;
        }

        // For non-customer users or if backend check is needed
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

  // Show loading while checking permissions
  if (loading || isCheckingAccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 50%, #1a365d 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#38a169' }} />
      </Box>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Get menu items - use backend permissions if available, otherwise use defaults
  const getMenuItems = () => {
    if (permissions?.menu_items && permissions.menu_items.length > 0) {
      // Filter for customer routes only
      const customerItems = permissions.menu_items.filter(
        (item: any) => item.path.startsWith('/customer')
      );
      if (customerItems.length > 0) {
        return customerItems;
      }
    }
    return defaultCustomerMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 50%, #1a365d 100%)',
      }}
    >
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
                  variant='text'
                  onClick={() => router.push('/')}
                  startIcon={<HomeIcon fontSize='small' />}
                  sx={{
                    textTransform: 'none',
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '8px',
                    px: 1.5,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' },
                  }}
                >
                  Home
                </Button>
              )
            )}
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
            backgroundColor: '#2d4a6f',
            color: 'white',
            paddingTop: 2,
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            height: 'calc(100vh - 64px)',
            '&::-webkit-scrollbar': {
              width: 0,
              background: 'transparent',
            },
            scrollbarWidth: 'none',
          }}
        >
          <List>
            {menuItems.sort((a: any, b: any) => a.text.localeCompare(b.text)).map(({ text, icon, path }: any, index: number) => (
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
                  backgroundColor:
                    router.pathname === path ? '#38a169' : '#2d4a6f',
                  color: 'white',
                  transition: 'background-color 0.3s, color 0.3s',
                  '&:hover': {
                    backgroundColor: '#38a169',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                    marginRight: 1,
                  }}
                >
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
          background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 50%, #1a365d 100%)',
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
