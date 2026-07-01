import { useContext, useState, useEffect, useMemo } from 'react';
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
  InputBase,
  Avatar,
  Collapse,
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
  Chat,
  Security,
  DarkMode,
  LightMode,
  ReceiptLong,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';
import { useColorMode } from '../context/ColorModeContext';
import NotificationBell from './common/NotificationBell';

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
  Chat: <Chat />,
  Security: <Security />,
  ReceiptLong: <ReceiptLong />,
  Receipt: <OrdersIcon />,
};

// Display order of sidebar groups. The `category` itself lives on each menu
// item in the DB (editable in /admin/permissions); this only controls the
// order sections appear in. Any category not listed here is appended last.
const CATEGORY_ORDER = [
  'Overview',
  'Sales & Orders',
  'Existing Customers',
  'Customer Accounts',
  'Leads',
  'Daily Visits',
  'Catalog & Inventory',
  'Marketing',
  'HR',
  'Team & Admin',
  'Other',
];

const AdminLayout = ({ children }: any) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading, logout, permissions, checkRouteAccess }: any = useContext(AuthContext);
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';

  // Group the user's menu items into ordered, collapsible sections.
  const groupedMenu = useMemo(() => {
    const items = [...(permissions?.menu_items ?? [])].sort((a: any, b: any) =>
      a.text.localeCompare(b.text)
    );
    const q = search.trim().toLowerCase();
    const visible = q
      ? items.filter((item: any) => item.text.toLowerCase().includes(q))
      : items;

    const buckets: { [category: string]: any[] } = {};
    visible.forEach((item: any) => {
      const category = item.category || 'Other';
      (buckets[category] ||= []).push(item);
    });

    const ordered = [...CATEGORY_ORDER];
    Object.keys(buckets).forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });

    return ordered
      .filter((category) => buckets[category]?.length)
      .map((category) => ({ category, items: buckets[category] }));
  }, [permissions, search]);

  const [collapsed, setCollapsed] = useState<{ [category: string]: boolean }>({});
  const toggleCategory = (category: string) =>
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          toast.error('You are not logged in. Please log in to continue.');
          router.replace('/login');
          return;
        }

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

  if (loading || isCheckingAccess || !permissions) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path);
  };

  const mainBg = isDark
    ? 'linear-gradient(135deg, #5A7CA4, #2B4864, #172335)'
    : '#f0f4f8';

  const sidebarBg = isDark ? '#344d69' : '#e8eef5';
  const sidebarText = isDark ? 'white' : '#1a2b3c';
  const activeItemBg = isDark ? '#78354f' : 'rgba(120, 53, 79, 0.15)';
  const activeItemText = isDark ? 'white' : '#78354f';
  const hoverItemBg = isDark ? '#78354f' : 'rgba(120, 53, 79, 0.1)';

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
            backgroundColor: sidebarBg,
            color: sidebarText,
            paddingTop: 2,
            borderRight: isDark ? 'none' : '1px solid rgba(0,0,0,0.08)',
          },
        }}
      >
        <Toolbar />

        {/* Search */}
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 0.75,
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:focus-within': {
                borderColor: activeItemText,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
              },
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search menu…'
              sx={{
                flex: 1,
                fontSize: 14,
                color: sidebarText,
                '& input::placeholder': { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', opacity: 1 },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            height: 'calc(100vh - 140px)',
            '&::-webkit-scrollbar': { width: 0, background: 'transparent' },
            scrollbarWidth: 'none',
          }}
        >
          {groupedMenu.length === 0 && (
            <Typography
              variant='body2'
              sx={{ px: 3, py: 2, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}
            >
              No matches
            </Typography>
          )}
          {groupedMenu.map(({ category, items }) => {
            const isSearching = search.trim().length > 0;
            const isOpen = isSearching || !collapsed[category];
            return (
              <Box key={category} sx={{ mb: 0.5 }}>
                <Box
                  onClick={() => !isSearching && toggleCategory(category)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2.5,
                    pt: 1.5,
                    pb: 0.5,
                    cursor: isSearching ? 'default' : 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    {category}
                  </Typography>
                  {!isSearching &&
                    (isOpen ? (
                      <ExpandLess sx={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }} />
                    ))}
                </Box>
                <Collapse in={isOpen} timeout='auto' unmountOnExit>
                  <List sx={{ px: 1, py: 0 }}>
                    {items.map(({ text, icon, path }: any, index: number) => {
                      const isActive = router.pathname === path;
                      return (
                        <ListItem
                          component='a'
                          key={index}
                          onClick={() => handleMenuItemClick(path)}
                          sx={{
                            position: 'relative',
                            marginY: 0.25,
                            paddingX: 1.75,
                            paddingY: 1.1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            backgroundColor: isActive ? activeItemBg : 'transparent',
                            color: isActive ? activeItemText : sidebarText,
                            transition: 'background-color 0.2s, color 0.2s',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: isActive ? 'translateY(-50%) scaleY(1)' : 'translateY(-50%) scaleY(0)',
                              width: 3,
                              height: '60%',
                              borderRadius: '0 4px 4px 0',
                              backgroundColor: activeItemText,
                              transition: 'transform 0.2s',
                            },
                            '&:hover': {
                              backgroundColor: hoverItemBg,
                              color: activeItemText,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: 'inherit',
                              minWidth: 38,
                              marginRight: 0.5,
                              '& .MuiSvgIcon-root': { fontSize: 21 },
                            }}
                          >
                            {iconMap[icon] || <Dashboard />}
                          </ListItemIcon>
                          <ListItemText
                            primary={text}
                            primaryTypographyProps={{
                              color: 'inherit',
                              fontSize: 14.5,
                              fontWeight: isActive ? 600 : 500,
                              fontFamily: 'Roboto, sans-serif',
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </Box>

        {/* User footer */}
        {user && (
          <Box
            sx={{
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4E8098, #2B4864)',
                color: '#fff',
              }}
            >
              {(user.name || user.email || 'A').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant='body2'
                noWrap
                sx={{ fontWeight: 600, color: sidebarText, lineHeight: 1.2 }}
              >
                {user.name || user.email || 'Admin'}
              </Typography>
              {user.role && (
                <Typography
                  variant='caption'
                  noWrap
                  sx={{
                    display: 'block',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    textTransform: 'capitalize',
                  }}
                >
                  {String(user.role).replace(/_/g, ' ')}
                </Typography>
              )}
            </Box>
            <Tooltip title='Logout' arrow>
              <IconButton
                onClick={logout}
                size='small'
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                  '&:hover': { color: '#ff6b6b', backgroundColor: 'rgba(217,83,79,0.12)' },
                }}
              >
                <Logout fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          background: mainBg,
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
