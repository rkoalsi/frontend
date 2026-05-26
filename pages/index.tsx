import {
  Box,
  Typography,
  Paper,
  styled,
  useTheme,
  Button,
  Container,
  useMediaQuery,
  Grid,
  alpha,
  Chip,
  Tooltip,
  IconButton,
  Skeleton,
  Stack,
} from '@mui/material';
import { useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import {
  CalendarMonth,
  Campaign,
  Check,
  CheckCircle,
  ContentCopy,
  History,
  Insights,
  KeyboardReturn,
  MenuBook,
  NewReleases,
  OpenInNew,
  Payment,
  PictureAsPdf,
  Phishing,
  PlayCircle,
  Radar,
  Repeat,
  ShoppingCart,
  WorkHistory,
  Link,
  LineAxis,
  Rocket,
  PersonAdd,
  Assignment,
} from '@mui/icons-material';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerCreationRequestForm from '../src/components/CustomerCreationRequestForm';
import { toast } from 'react-toastify';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  borderRadius: 16,
  border: `1px solid ${theme.palette.primary.dark}`,
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
}));

const ActionCard = styled(Button)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2, 1.5),
  borderRadius: 14,
  textTransform: 'none',
  minHeight: 96,
  width: '100%',
  transition: 'all 0.18s ease-in-out',
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.06)'
    : theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.palette.mode === 'light' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
  backdropFilter: 'blur(4px)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.12)'
      : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : theme.palette.primary.light}`,
  },
  '&:active': {
    transform: 'scale(0.97)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.75rem',
    marginBottom: theme.spacing(0.75),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(0.5),
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

const CatalogueCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: theme.palette.primary.main,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    borderRadius: '3px 0 0 3px',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(2px)',
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: theme.shadows[2],
    '&::before': { opacity: 1 },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.25, 1.5),
    gap: theme.spacing(1.25),
    borderRadius: 10,
  },
}));

const CatalogueIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  minWidth: '44px',
  borderRadius: 10,
  background: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  [theme.breakpoints.down('sm')]: {
    width: '38px',
    height: '38px',
    minWidth: '38px',
    borderRadius: 8,
  },
}));

const CatalogueActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.action.active, 0.05),
  borderRadius: 8,
  padding: theme.spacing(0.75),
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
  },
}));

// Actions allowed for customer role (scalable - add more as needed)
const customerAllowedActions = [
  'newOrder',
  'pastOrder',
  'shipments',
  'customer'
];

// Grouped menu items for better organization
const menuSections = [
  {
    title: 'Orders',
    items: [
      {
        icon: <ShoppingCart />,
        text: 'Create New Order',
        color: '#3b82f6',
        action: 'newOrder',
      },
      {
        icon: <NewReleases />,
        text: 'New Arrivals',
        color: '#e11d48',
        action: 'new_arrivals',
      },
      {
        icon: <History />,
        text: 'Past Orders',
        color: '#8b5cf6',
        action: 'pastOrder',
      },
      {
        icon: <Payment />,
        text: 'Payments Due',
        color: '#ef4444',
        action: 'paymentsDue',
      },
      {
        icon: <KeyboardReturn />,
        text: 'Return Orders',
        color: '#f59e0b',
        action: 'return_orders',
      },
      {
        icon: <Rocket />,
        text: 'Shipments',
        color: '#10b981',
        action: 'shipments',
      },
      {
        icon: <LineAxis />,
        text: 'Customer Dashboard',
        color: '#64748b',
        action: 'customer',
      },
    ],
  },
  {
    title: 'Daily',
    items: [
      {
        icon: <CalendarMonth />,
        text: 'Daily Visits',
        color: '#06b6d4',
        action: 'dailyVisits',
      },
      {
        icon: <Check />,
        text: 'Greythr Login',
        color: '#10b981',
        action: 'check_in',
      },
    ],
  },
  {
    title: 'Customers',
    items: [
      {
        icon: <PersonAdd />,
        text: 'Create New Customer',
        color: '#22c55e',
        action: 'create_customer',
      },
      {
        icon: <LineAxis />,
        text: 'Customer Analytics',
        color: '#64748b',
        action: 'customer_analytics',
      },
      {
        icon: <WorkHistory />,
        text: 'Customer Margins',
        color: '#6366f1',
        action: 'customer_margins',
      },
      {
        icon: <Repeat />,
        text: 'Expected Reorders',
        color: '#14b8a6',
        action: 'expected_reorder',
      },
      {
        icon: <Assignment />,
        text: 'My Customer Requests',
        color: '#3b82f6',
        action: 'my_customer_requests',
      },
      {
        icon: <Insights />,
        text: 'Potential Customers',
        color: '#ec4899',
        action: 'potential_customers',
      },
      {
        icon: <Phishing />,
        text: 'Set Customer Hooks',
        color: '#a855f7',
        action: 'hooks',
      },
      {
        icon: <Radar />,
        text: 'Targeted Customers',
        color: '#f97316',
        action: 'targeted_customer',
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        icon: <Campaign />,
        text: 'Announcements',
        color: '#f59e0b',
        action: 'announcements',
      },
      {
        icon: <MenuBook />,
        text: 'Catalogues',
        color: '#0d9488',
        action: 'catalogues',
      },
      {
        icon: <Link />,
        text: 'External Links',
        color: '#6b7280',
        action: 'external_links',
      },
      {
        icon: <PlayCircle />,
        text: 'Training Videos',
        color: '#d946ef',
        action: 'training',
      },
    ],
  },
];

const Home = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showCustomerRequestForm, setShowCustomerRequestForm] = useState(false);
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [cataloguesLoading, setCataloguesLoading] = useState(false);

  const isCustomer = user?.role === 'customer';

  // Fetch catalogues for customer role
  const fetchCatalogues = useCallback(async () => {
    setCataloguesLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      setCatalogues(resp?.data || []);
    } catch (error) {
      console.error('Error fetching catalogues:', error);
    } finally {
      setCataloguesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCustomer) {
      fetchCatalogues();
    }
  }, [isCustomer, fetchCatalogues]);

  const handleOpenCatalogue = useCallback((url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name} catalogue`);
  }, []);

  const handleCopyLink = useCallback(
    (event: React.MouseEvent, url: string, name: string) => {
      event.stopPropagation();
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(`${name} catalogue link copied!`);
        })
        .catch(() => {
          toast.error('Failed to copy link');
        });
    },
    []
  );

  const handleShareAllCatalogues = useCallback(() => {
    if (catalogues.length === 0) return;
    const allProductsLink = `All Products Catalogue: ${window.location.origin}/catalogues/all_products`;
    const brandLinks = catalogues
      .map((b: any) => `${b.name} Catalogue: ${b.image_url}`)
      .join('\n\n');
    navigator.clipboard
      .writeText(`${allProductsLink}\n\n${brandLinks}`)
      .then(() => toast.success('All catalogue links copied to clipboard!'))
      .catch(() => toast.error('Failed to copy links'));
  }, [catalogues]);

  // Filter menu sections based on user role
  const getFilteredMenuSections = () => {
    const userRole = user?.role;

    // For customer role, filter to only allowed actions and remove Resources section
    if (userRole === 'customer') {
      return menuSections
        .filter((section) => section.title !== 'Resources')
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            customerAllowedActions.includes(item.action)
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    // For non-customer roles (salesperson, admin), hide Customer Dashboard
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.action !== 'customer'),
      }))
      .filter((section) => section.items.length > 0);
  };

  const filteredMenuSections = getFilteredMenuSections();

  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      router.push(`/orders/new/${_id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const handleNavigation = (action: string) => {
    switch (action) {
      case 'newOrder':
        handleNewOrder();
        break;
      case 'create_customer':
        setShowCustomerRequestForm(true);
        break;
      case 'my_customer_requests':
        router.push('/customer_requests');
        break;
      case 'pastOrder':
        router.push('/orders/past');
        break;
      case 'paymentsDue':
        router.push('/orders/past/payment_due');
        break;
      case 'catalogues':
        router.push('/catalogues');
        break;
      case 'training':
        router.push('/training');
        break;
      case 'announcements':
        router.push('/announcements');
        break;
      case 'dailyVisits':
        router.push('/daily_visits');
        break;
      case 'hooks':
        router.push('/hooks');
        break;
      case 'potential_customers':
        router.push('/potential_customers');
        break;
      case 'expected_reorder':
        router.push('/expected_reorder');
        break;
      case 'targeted_customer':
        router.push('/targeted_customer');
        break;
      case 'customer_margins':
        router.push('/customer_margins');
        break;
      case 'return_orders':
        router.push('/return_orders');
        break;
      case 'external_links':
        router.push('/external_links');
        break;
      case 'customer_analytics':
        router.push('/customer_analytics');
        break;
      case 'check_in':
        router.push('/check_in');
        break;
      case 'shipments':
        router.push('/shipments');
        break;
      case 'new_arrivals':
        router.push('/catalogues/all_products');
        break;
      default:
        router.push(action);
        break;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        pt: { xs: 2.5, sm: 3.5 },
        pb: { xs: 5, sm: 5 },
        px: { xs: 2, sm: 2.5 },
        mx: { xs: -2, sm: -3 },
        width: '100%',
      }}
    >
      <Container maxWidth='sm' disableGutters>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Header */}
          <Box
            mb={3.5}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              px: 2.5,
              py: 2,
              boxShadow: 1,
            }}
          >
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography
              variant='h5'
              component='h1'
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.35rem', sm: '1.6rem' },
                mt: 0.25,
                lineHeight: 1.3,
              }}
            >
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.first_name} 👋
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mt: 0.5, fontSize: '0.82rem' }}
            >
              {isCustomer ? 'Browse catalogues and manage your orders.' : 'Manage orders, customers, and more — all in one place.'}
            </Typography>
          </Box>

          {/* Menu Sections */}
          {filteredMenuSections.map((section) => (
            <Box key={section.title} sx={{ mb: 2.5 }}>
              <SectionTitle>{section.title}</SectionTitle>
              <Grid container spacing={1.5}>
                {section.items.map((item, index) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={index}>
                    <motion.div
                      variants={itemVariants}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ActionCard
                        onClick={() => handleNavigation(item.action)}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            color: item.color,
                          },
                        }}
                      >
                        {item.icon}
                        <Typography
                          sx={{
                            fontWeight: 500,
                            textAlign: 'center',
                            lineHeight: 1.3,
                            fontSize: '0.78rem',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </ActionCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {/* Catalogues List for Customer Role */}
          {isCustomer && (
            <Box sx={{ mb: 3 }}>
              <Box display='flex' alignItems='center' justifyContent='space-between' mb={1.5} px={0.5}>
                <SectionTitle sx={{ mb: 0 }}>
                  Brand Catalogues
                </SectionTitle>
                <Tooltip title='Copy all catalogue links' arrow>
                  <span>
                    <IconButton
                      size='small'
                      onClick={handleShareAllCatalogues}
                      disabled={cataloguesLoading || catalogues.length === 0}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <ContentCopy sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
                {cataloguesLoading ? (
                  <Stack spacing={1.5}>
                    {[1, 2, 3].map((i) => (
                      <Paper
                        key={i}
                        sx={{
                          p: 2,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          background: alpha(theme.palette.primary.main, 0.2),
                        }}
                      >
                        <Skeleton
                          variant='rounded'
                          width={48}
                          height={48}
                          sx={{ bgcolor: alpha('#fff', 0.1), borderRadius: 2.5 }}
                        />
                        <Box flex={1}>
                          <Skeleton
                            variant='text'
                            width='60%'
                            height={24}
                            sx={{ bgcolor: alpha('#fff', 0.1) }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <AnimatePresence mode='wait'>
                    <motion.div
                      variants={containerVariants}
                      initial='hidden'
                      animate='visible'
                    >
                      <Stack spacing={1.5}>
                        {/* All Products Catalogue */}
                        <motion.div variants={itemVariants}>
                          <CatalogueCard
                            elevation={0}
                            onClick={() => router.push('/catalogues/all_products')}
                            sx={{
                              '&::before': { opacity: 1, background: theme.palette.secondary.main },
                              borderColor: alpha(theme.palette.secondary.main, 0.3),
                              bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                            }}
                          >
                            <CatalogueIconWrapper
                              sx={{
                                background: alpha(theme.palette.secondary.main, 0.12),
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`,
                              }}
                            >
                              <NewReleases
                                sx={{
                                  fontSize: { xs: '20px', sm: '24px' },
                                  color: 'secondary.main',
                                }}
                              />
                            </CatalogueIconWrapper>
                            <Box flex={1} minWidth={0}>
                              <Box display='flex' alignItems='center' gap={1}>
                                <Typography
                                  variant='body1'
                                  fontWeight='700'
                                  color='text.primary'
                                  noWrap
                                >
                                  All Products
                                </Typography>
                                <Chip
                                  label='Latest'
                                  size='small'
                                  color='secondary'
                                  variant='outlined'
                                  sx={{ fontWeight: 600, height: '20px', fontSize: '0.65rem', flexShrink: 0 }}
                                />
                              </Box>
                              <Typography variant='caption' color='text.secondary' noWrap>
                                Browse all products across brands
                              </Typography>
                            </Box>
                            <Box display='flex' gap={0.5} onClick={(e) => e.stopPropagation()} flexShrink={0}>
                              <Tooltip title='Copy link' arrow>
                                <CatalogueActionButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/catalogues/all_products`;
                                    navigator.clipboard
                                      .writeText(url)
                                      .then(() => toast.success('All Products link copied!'))
                                      .catch(() => toast.error('Failed to copy link'));
                                  }}
                                  size='small'
                                >
                                  <ContentCopy sx={{ fontSize: '16px' }} />
                                </CatalogueActionButton>
                              </Tooltip>
                              <Tooltip title='Open catalogue' arrow>
                                <CatalogueActionButton
                                  onClick={() => router.push('/catalogues/all_products')}
                                  size='small'
                                >
                                  <OpenInNew sx={{ fontSize: '16px' }} />
                                </CatalogueActionButton>
                              </Tooltip>
                            </Box>
                          </CatalogueCard>
                        </motion.div>

                        {/* Brand Catalogues */}
                        {catalogues.map((b: any, index: number) => (
                          <motion.div key={b._id || index} variants={itemVariants}>
                            <CatalogueCard
                              elevation={0}
                              onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                            >
                              <CatalogueIconWrapper>
                                <PictureAsPdf
                                  sx={{
                                    fontSize: { xs: '20px', sm: '22px' },
                                    color: 'primary.main',
                                  }}
                                />
                              </CatalogueIconWrapper>
                              <Box flex={1} minWidth={0}>
                                <Typography
                                  variant='body1'
                                  fontWeight='600'
                                  color='text.primary'
                                  noWrap
                                >
                                  {b.name}
                                </Typography>
                                <Typography variant='caption' color='text.secondary' noWrap>
                                  Tap to view PDF catalogue
                                </Typography>
                              </Box>
                              <Box display='flex' gap={0.5} onClick={(e) => e.stopPropagation()} flexShrink={0}>
                                <Tooltip title='Copy link' arrow>
                                  <CatalogueActionButton
                                    onClick={(e) => handleCopyLink(e, b.image_url, b.name)}
                                    size='small'
                                  >
                                    <ContentCopy sx={{ fontSize: '16px' }} />
                                  </CatalogueActionButton>
                                </Tooltip>
                                <Tooltip title='Open catalogue' arrow>
                                  <CatalogueActionButton
                                    onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                                    size='small'
                                  >
                                    <OpenInNew sx={{ fontSize: '16px' }} />
                                  </CatalogueActionButton>
                                </Tooltip>
                              </Box>
                            </CatalogueCard>
                          </motion.div>
                        ))}
                      </Stack>
                    </motion.div>
                  </AnimatePresence>
                )}
            </Box>
          )}
        </motion.div>
      </Container>

      {/* Customer Creation Request Form Dialog */}
      <CustomerCreationRequestForm
        open={showCustomerRequestForm}
        onClose={() => setShowCustomerRequestForm(false)}
      />
    </Box>
  );
};

export default Home;
