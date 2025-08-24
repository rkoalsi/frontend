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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Group as CustomersIcon,
  ShoppingCart as ProductsIcon,
  Receipt as OrdersIcon,
  PeopleAlt as SalesPeopleIcon,
  Payment,
  LibraryBooks,
  VideoLibrary,
  Campaign,
  Checklist,
  Phishing,
  Category,
  Insights,
  Radar,
  Repeat,
  DeliveryDining,
  KeyboardReturn,
  PaidOutlined,
  PendingActionsOutlined,
  BrandingWatermark,
  Link,
  Analytics,
  CalendarMonth,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';

// Icon mapping for dynamic icon rendering
const iconMap: { [key: string]: React.ReactElement } = {
  Dashboard: <Dashboard />,
  CustomersIcon: <CustomersIcon />,
  ProductsIcon: <ProductsIcon />,
  OrdersIcon: <OrdersIcon />,
  SalesPeopleIcon: <SalesPeopleIcon />,
  Payment: <Payment />,
  LibraryBooks: <LibraryBooks />,
  VideoLibrary: <VideoLibrary />,
  Campaign: <Campaign />,
  Checklist: <Checklist />,
  Category: <Category />,
  Phishing: <Phishing />,
  Insights: <Insights />,
  Radar: <Radar />,
  Repeat: <Repeat />,
  DeliveryDining: <DeliveryDining />,
  KeyboardReturn: <KeyboardReturn />,
  PaidOutlined: <PaidOutlined />,
  PendingActionsOutlined: <PendingActionsOutlined />,
  BrandingWatermark: <BrandingWatermark />,
  Link: <Link />,
  Analytics: <Analytics />,
  CalendarMonth: <CalendarMonth />,
};

const AdminLayout = ({ children }: any) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading, logout, permissions, checkRouteAccess }: any = useContext(AuthContext);

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          toast.error('You are not logged in. Please log in to continue.');
          router.replace('/login');
          return;
        }

        // Check if user can access current route
        const canAccess = await checkRouteAccess(router.pathname);
        if (!canAccess) {
          toast.error('You are not authorized to access this page.');
          router.replace('/');
        }
      }
      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [user, loading, router.pathname, checkRouteAccess]);

  // Show loading while checking permissions
  if (loading || isCheckingAccess || !permissions) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Don't render if user is not authenticated or doesn't have access
  if (!user) {
    return null;
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #5A7CA4, #2B4864, #172335)',
      }}
    >
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position='fixed'
        sx={{
          zIndex: 1300,
          backgroundColor: '#2C3E50',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color='inherit'
              edge='start'
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              sx={{ marginRight: 2, color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant='h6'
              fontWeight='bold'
              sx={{
                cursor: 'pointer',
                color: 'white',
                fontFamily: 'Roboto, sans-serif',
              }}
              onClick={() => router.push('/admin')}
            >
              Admin Dashboard
            </Typography>
          </Box>
          
          <Box display='flex' gap='16px' flexDirection='row'>
            {user && router.pathname.includes('/admin') && (
              <Button
                variant='contained'
                color='primary'
                onClick={() => router.push('/')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  paddingX: 3,
                }}
              >
                Home
              </Button>
            )}
            <Button
              variant='contained'
              color='error'
              onClick={logout}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                paddingX: 3,
              }}
            >
              Logout
            </Button>
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
            backgroundColor: '#344d69',
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
            {permissions.menu_items.sort((a:any, b:any) => a.text.localeCompare(b.text)).map(({ text, icon, path }:any, index:number) => (
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
                    router.pathname === path ? '#78354f' : '#344d69',
                  color: 'white',
                  transition: 'background-color 0.3s, color 0.3s',
                  '&:hover': {
                    backgroundColor: '#78354f',
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
          background: 'linear-gradient(135deg, #5A7CA4, #2B4864, #172335)',
          minHeight: '100vh',
          padding: 3,
          transition: 'margin-left 0.3s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;