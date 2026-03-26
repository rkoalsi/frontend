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
  Group as CustomersIcon,
  ShoppingCart as ProductsIcon,
  Receipt as OrdersIcon,
  PeopleAlt as SalesPeopleIcon,
  GroupAddOutlined,
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
  AssignmentInd,
  LocalShipping,
  AccessTime,
  ManageAccounts,
  Article,
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
  AssignmentInd: <AssignmentInd />,
  LocalShipping: <LocalShipping />,
  Article: <Article />,
  AccessTime: <AccessTime />,
  GroupAddOutlined: <GroupAddOutlined />,
  ManageAccounts: <ManageAccounts />,
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
              onClick={() => router.push('/admin')}
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
                  Admin
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box display='flex' alignItems='center' gap={1}>
            {user && router.pathname.includes('/admin') && (
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
            {user && (
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
          padding: { xs: 1, sm: 2, md: 3 },
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