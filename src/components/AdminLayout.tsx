import { useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
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
  Sensors,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AuthContext from './Auth';
import { useColorMode } from '../context/ColorModeContext';
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
  Sensors: <Sensors />,
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
  // Must sit above the early returns below — hooks can't be conditional.
  const scrolled = useTopbarScrolled();

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

  // The category that owns the page we're currently on (longest path match, so
  // nested routes like /admin/orders/[id] still map to their section).
  const activeCategory = useMemo(() => {
    const items = permissions?.menu_items ?? [];
    let best: string | null = null;
    let bestLen = -1;
    items.forEach((it: any) => {
      const p = it.path;
      if (
        p &&
        (router.pathname === p || router.pathname.startsWith(p + '/')) &&
        p.length > bestLen
      ) {
        bestLen = p.length;
        best = it.category || 'Other';
      }
    });
    return best;
  }, [permissions, router.pathname]);

  // Default sidebar state: on each navigation collapse every section except the
  // one containing the current page. Manual toggles persist until the next nav.
  useEffect(() => {
    const items = permissions?.menu_items ?? [];
    if (!items.length) return;
    const categories = Array.from(
      new Set(items.map((it: any) => it.category || 'Other'))
    ) as string[];
    setCollapsed(
      categories.reduce(
        (acc, c) => ({ ...acc, [c]: c !== activeCategory }),
        {} as { [category: string]: boolean }
      )
    );
  }, [router.pathname, activeCategory, permissions]);

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
          height: '100dvh',
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
    ? 'linear-gradient(135deg, #6A5AD1, #4633B8, #2A2168)'
    : '#f0f4f8';

  const sidebarBg = isDark ? '#37279C' : '#e8eef5';
  const sidebarText = isDark ? 'white' : '#191536';
  const activeItemBg = isDark ? '#78354f' : 'rgba(120, 53, 79, 0.15)';
  const activeItemText = isDark ? 'white' : '#78354f';
  const hoverItemBg = isDark ? '#78354f' : 'rgba(120, 53, 79, 0.1)';

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
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
              sx={topbarIconSx}
            >
              <MenuIcon />
            </IconButton>
            <BrandLockup descriptor='Admin' onClick={() => router.push('/admin')} />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {user && router.pathname.includes('/admin') && (
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
            height: 'calc(100dvh - 140px)',
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
                background: 'linear-gradient(135deg, #6A5AD1, #37279C)',
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
          minHeight: '100dvh',
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
