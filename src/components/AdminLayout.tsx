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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/admin',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
  {
    text: 'Customers',
    icon: <CustomersIcon />,
    path: '/admin/customers',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Products',
    icon: <ProductsIcon />,
    path: '/admin/products',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
  {
    text: 'Brands',
    icon: <BrandingWatermark />,
    path: '/admin/brands',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
  {
    text: 'Orders',
    icon: <OrdersIcon />,
    path: '/admin/orders',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Sales People',
    icon: <SalesPeopleIcon />,
    path: '/admin/sales_people',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Payments Due',
    icon: <Payment />,
    path: '/admin/payments_due',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Catalogues',
    icon: <LibraryBooks />,
    path: '/admin/catalogues',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
  {
    text: 'Training Videos',
    icon: <VideoLibrary />,
    path: '/admin/training',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Announcements',
    icon: <Campaign />,
    path: '/admin/announcements',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
  {
    text: 'Daily Visits',
    icon: <Checklist />,
    path: '/admin/daily_visits',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Hooks Categories',
    icon: <Category />,
    path: '/admin/hooks_categories',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Shop Hooks',
    icon: <Phishing />,
    path: '/admin/hooks',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Potential Customers',
    icon: <Insights />,
    path: '/admin/potential_customers',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Existing Customers Reorder',
    icon: <Repeat />,
    path: '/admin/expected_reorders',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Targeted Customers',
    icon: <Radar />,
    path: '/admin/targeted_customers',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Delivery Partners',
    icon: <DeliveryDining />,
    path: '/admin/delivery_partners',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Return Orders',
    icon: <KeyboardReturn />,
    path: '/admin/return_orders',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Billed Customers',
    icon: <PaidOutlined />,
    path: '/admin/billed_customers',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'Unbilled Customers',
    icon: <PendingActionsOutlined />,
    path: '/admin/unbilled_customers',
    allowedRoles: ['admin', 'sales_admin'],
  },
  {
    text: 'External Links',
    icon: <Link />,
    path: '/admin/external_links',
    allowedRoles: ['admin', 'sales_admin', 'catalogue_manager'],
  },
];

const getAllowedRoles = (path: string): string[] => {
  // For products and catalogues pages (and Dashboard) allow additional roles
  if (
    path === '/admin' ||
    path === '/admin/products' ||
    path === '/admin/catalogues' ||
    path === '/admin/announcements' ||
    path === '/admin/external_links'
  ) {
    return ['admin', 'sales_admin', 'catalogue_manager'];
  }
  // For other admin routes, allow admin and sales_admin
  return ['admin', 'sales_admin'];
};

const AdminLayout = ({ children }: any) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading, logout }: any = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('You are not logged in. Please log in to continue.');
        router.replace('/login');
        return;
      }

      const allowedRolesForRoute = getAllowedRoles(router.pathname);
      if (!allowedRolesForRoute.some((role) => user.data.role.includes(role))) {
        toast.error('You are not authorized to access this page.');
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  const allowedRolesForRoute = getAllowedRoles(router.pathname);
  if (
    loading ||
    !user ||
    !allowedRolesForRoute.some((role) => user.data.role.includes(role))
  ) {
    return null;
  }

  const handleMenuItemClick = (path: any) => {
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
            {user &&
              allowedRolesForRoute.some((role) =>
                user.data.role.includes(role)
              ) &&
              router.pathname.includes('/admin') && (
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
            {menuItems
              .filter((item) =>
                item.allowedRoles.some((role) => user.data.role.includes(role))
              )
              .map(({ text, icon, path }, index) => (
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
                    {icon}
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
