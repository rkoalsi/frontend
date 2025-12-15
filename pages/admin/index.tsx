'use client';
import { type JSX, useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Snackbar,
  Fade,
  Skeleton,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Stack,
} from '@mui/material';
import AuthContext from '../../src/components/Auth';
import {
  ShoppingCartOutlined,
  StorefrontOutlined,
  PeopleOutlined,
  PersonOutlineOutlined,
  Payment,
  LibraryBooks,
  VideoLibrary,
  Campaign,
  Checklist,
  Refresh,
  ArrowForward,
  Category,
  Phishing,
  Insights,
  Radar,
  Repeat,
  DeliveryDining,
  KeyboardReturn,
  PaidOutlined,
  PendingActionsOutlined,
  BrandingWatermark,
  Link,
  MiscellaneousServices,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

// Define TypeScript interfaces for better type safety
interface Stats {
  active_stock_products: number;
  active_products: number;
  inactive_products: number;
  total_products: number;
  out_of_stock_products: number;
  assigned_customers: number;
  unassigned_customers: number;
  active_customers: number;
  inactive_customers: number;
  active_sales_people: number;
  inactive_sales_people: number;
  total_sales_people: number;
  orders_draft: number;
  orders_accepted: number;
  orders_declined: number;
  orders_invoiced: number;
  recent_orders: number;
  total_due_payments: number;
  total_due_payments_today: number;
  active_catalogues: number;
  inactive_catalogues: number;
  active_trainings: number;
  inactive_trainings: number;
  active_announcements: number;
  inactive_announcements: number;
  submitted_daily_visits: number;
  updated_daily_visits: number;
  submitted_potential_customers: number;
  submitted_targeted_customers: number;
  delivery_partners: number;
  return_orders: number;
  submitted_shop_hooks: number;
  active_hook_categories: number;
  inactive_hook_categories: number;
  submitted_expected_reorders: number;
  total_unbilled_customers_6_months: number;
  total_billed_customers_6_months: number;
  brands: number;
  external_links: number;
  total_customer_analytics: number;
  total_attendance_records_today: number;
  permissions: number;
  last_updated?: string;
  product_additions_by_type?: {
    total_products: number;
    breakdown: Array<{
      added_by: string;
      count: number;
      percentage: number;
    }>;
  };
}

interface SubStat {
  label: string;
  value: number;
  color: string;
}

interface CardProps {
  label: string;
  route: string;
  value?: number;
  subStats?: SubStat[];
  icon?: JSX.Element;
  growth?: number;
}

const AdminDashboard = () => {
  const { user, permissions }: any = useContext(AuthContext);
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch stats function
  const fetchStats = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      }

      try {
        const { data } = await axiosInstance.get(`/admin/stats`);
        setStats({
          ...data,
          last_updated: new Date().toISOString(),
        });

        if (showRefreshing) {
          setSnackbarMessage('Dashboard refreshed successfully');
          setSnackbarOpen(true);
          setLastRefreshed(new Date());
        }

        if (error) {
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load statistics. Please try again later.'
        );

        if (showRefreshing) {
          setSnackbarMessage('Failed to refresh data. Please try again.');
          setSnackbarOpen(true);
        }
      } finally {
        setLoading(false);
        if (showRefreshing) {
          setRefreshing(false);
        }
      }
    },
    [error]
  );

  // Fetch stats on mount
  useEffect(() => {
    if (permissions) {
      fetchStats();

      // Auto-refresh every 5 minutes
      const refreshInterval = setInterval(() => {
        fetchStats(false);
      }, 5 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [permissions, fetchStats]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Define all possible cards - now we'll filter based on backend permissions
  const getAllCards = (stats: Stats): CardProps[] => [
    {
      label: 'Payments Due',
      route: 'payments_due',
      value: stats.total_due_payments,
      subStats: [
        {
          label: 'Payments Due Today',
          value: stats.total_due_payments_today,
          color: 'warning',
        },
        {
          label: 'Total Payments Due',
          value: stats.total_due_payments,
          color: 'info',
        },
      ],
      icon: <Payment color='primary' />,
      growth: 5,
    },
    {
      label: 'Catalogues',
      route: 'catalogues',
      value: stats.active_catalogues + stats.inactive_catalogues,
      subStats: [
        {
          label: 'Active Catalogues',
          value: stats.active_catalogues,
          color: 'success',
        },
        {
          label: 'Inactive Catalogues',
          value: stats.inactive_catalogues,
          color: 'error',
        },
      ],
      icon: <LibraryBooks color='primary' />,
      growth: -2,
    },
    {
      label: 'Training Videos',
      route: 'training',
      value: stats.active_trainings + stats.inactive_trainings,
      subStats: [
        {
          label: 'Active Training Videos',
          value: stats.active_trainings,
          color: 'success',
        },
        {
          label: 'Inactive Training Videos',
          value: stats.inactive_trainings,
          color: 'error',
        },
      ],
      icon: <VideoLibrary color='primary' />,
      growth: 8,
    },
    {
      label: 'Announcements',
      route: 'announcements',
      value: stats.active_announcements + stats.inactive_announcements,
      subStats: [
        {
          label: 'Active Announcements',
          value: stats.active_announcements,
          color: 'success',
        },
        {
          label: 'Inactive Announcements',
          value: stats.inactive_announcements,
          color: 'error',
        },
      ],
      icon: <Campaign color='primary' />,
      growth: 0,
    },
    {
      label: 'Orders (last 24 hours)',
      route: 'orders',
      value: stats.recent_orders,
      subStats: [
        {
          label: 'Total Orders',
          value: stats.recent_orders,
          color: 'success',
        },
        {
          label: 'Draft Orders',
          value: stats.orders_draft,
          color: 'info',
        },
        {
          label: 'Accepted Orders',
          value: stats.orders_accepted,
          color: 'success',
        },
        {
          label: 'Declined Orders',
          value: stats.orders_declined,
          color: 'error',
        },
        {
          label: 'Invoiced Orders',
          value: stats.orders_invoiced,
          color: 'success',
        },
      ],
      icon: <ShoppingCartOutlined color='primary' />,
      growth: 12,
    },
    {
      label: 'Products',
      route: 'products',
      value: stats.total_products,
      subStats: [
        {
          label: 'Active Stock',
          value: stats.active_stock_products,
          color: 'success',
        },
        {
          label: 'Active',
          value: stats.active_products,
          color: 'success',
        },
        {
          label: 'Inactive',
          value: stats.inactive_products,
          color: 'error',
        },
        {
          label: 'Out of Stock',
          value: stats.out_of_stock_products,
          color: 'error',
        },
        {
          label: 'Total',
          value: stats.total_products,
          color: 'info',
        },
      ],
      icon: <StorefrontOutlined color='primary' />,
      growth: 3,
    },
    {
      label: 'Sales People',
      route: 'sales_people',
      value: stats.total_sales_people,
      subStats: [
        {
          label: 'Active',
          value: stats.active_sales_people,
          color: 'success',
        },
        {
          label: 'Inactive',
          value: stats.inactive_sales_people,
          color: 'error',
        },
        {
          label: 'Total',
          value: stats.total_sales_people,
          color: 'info',
        },
      ],
      icon: <PersonOutlineOutlined color='primary' />,
      growth: -1,
    },
    {
      label: 'Customers',
      route: 'customers',
      value: stats.active_customers + stats.inactive_customers,
      subStats: [
        {
          label: 'Assigned',
          value: stats.assigned_customers,
          color: 'success',
        },
        {
          label: 'Unassigned',
          value: stats.unassigned_customers,
          color: 'error',
        },
        {
          label: 'Active',
          value: stats.active_customers,
          color: 'success',
        },
        {
          label: 'Inactive',
          value: stats.inactive_customers,
          color: 'error',
        },
      ],
      icon: <PeopleOutlined color='primary' />,
      growth: 7,
    },
    {
      label: 'Daily Visits (last 24 hours)',
      route: 'daily_visits',
      value: stats.submitted_daily_visits + stats.updated_daily_visits,
      subStats: [
        {
          label: 'Submitted Daily Visits',
          value: stats.submitted_daily_visits,
          color: 'info',
        },
        {
          label: 'Updated Daily Visits',
          value: stats.updated_daily_visits,
          color: 'info',
        },
      ],
      icon: <Checklist color='primary' />,
    },
    {
      label: 'Hooks Categories',
      route: 'hooks_categories',
      value: stats.active_hook_categories + stats.inactive_hook_categories,
      subStats: [
        {
          label: 'Active Hook Categories',
          value: stats.active_hook_categories,
          color: 'info',
        },
        {
          label: 'Updated Hooks Categories',
          value: stats.inactive_hook_categories,
          color: 'info',
        },
      ],
      icon: <Category color='primary' />,
    },
    {
      label: 'Shop Hooks (last 24 hours)',
      route: 'hooks',
      value: stats.submitted_shop_hooks,
      subStats: [
        {
          label: 'Submitted Shop Hooks',
          value: stats.submitted_shop_hooks,
          color: 'info',
        },
      ],
      icon: <Phishing color='primary' />,
    },
    {
      label: 'Delivery Partners',
      route: 'delivery_partners',
      value: stats.delivery_partners,
      subStats: [
        {
          label: 'All Delivery Partners',
          value: stats.delivery_partners,
          color: 'info',
        },
      ],
      icon: <DeliveryDining color='primary' />,
    },
    {
      label: 'Return Orders',
      route: 'return_orders',
      value: stats.return_orders,
      subStats: [
        {
          label: 'All Return Orders',
          value: stats.return_orders,
          color: 'info',
        },
      ],
      icon: <KeyboardReturn color='primary' />,
    },
    {
      label: 'Expected Reorders',
      route: 'expected_reorders',
      value: stats.submitted_expected_reorders,
      subStats: [
        {
          label: 'Submitted Expected Reorders',
          value: stats.submitted_expected_reorders,
          color: 'info',
        },
      ],
      icon: <Repeat color='primary' />,
    },
    {
      label: 'Potential Customers',
      route: 'potential_customers',
      value: stats.submitted_potential_customers,
      subStats: [
        {
          label: 'Submitted Potential Customers',
          value: stats.submitted_potential_customers,
          color: 'info',
        },
      ],
      icon: <Insights color='primary' />,
    },
    {
      label: 'Targeted Customers',
      route: 'targeted_customers',
      value: stats.submitted_targeted_customers,
      subStats: [
        {
          label: 'Submitted Targeted Customers',
          value: stats.submitted_targeted_customers,
          color: 'info',
        },
      ],
      icon: <Radar color='primary' />,
    },
    {
      label: 'Billed Customers',
      route: 'billed_customers',
      value: stats.total_billed_customers_6_months,
      subStats: [
        {
          label: 'All Billed Customers Last 6 Months',
          value: stats.total_billed_customers_6_months,
          color: 'info',
        },
      ],
      icon: <PaidOutlined color='primary' />,
    },
    {
      label: 'Unbilled Customers',
      route: 'unbilled_customers',
      value: stats.total_unbilled_customers_6_months,
      subStats: [
        {
          label: 'All Unbilled Customers Last 6 Months',
          value: stats.total_unbilled_customers_6_months,
          color: 'info',
        },
      ],
      icon: <PendingActionsOutlined color='primary' />,
    },
    {
      label: 'Brands',
      route: 'brands',
      value: stats.brands,
      subStats: [
        {
          label: 'All Active Brands',
          value: stats.brands,
          color: 'info',
        },
      ],
      icon: <BrandingWatermark color='primary' />,
    },
    {
      label: 'External Links',
      route: 'external_links',
      value: stats.external_links,
      subStats: [
        {
          label: 'All Active Links',
          value: stats.external_links,
          color: 'info',
        },
      ],
      icon: <Link color='primary' />,
    },
    {
      label: 'Customer Analytics',
      route: 'customer_analytics',
      value: stats.total_customer_analytics,
      subStats: [
        {
          label: 'Total Customer Analytics',
          value: stats.total_customer_analytics,
          color: 'info',
        },
      ],
      icon: <Link color='primary' />,
    },
    {
      label: 'Employee Attendance',
      route: 'employee_attendance',
      value: stats.total_attendance_records_today,
      subStats: [
        {
          label: `Employee Attendance for Today (${new Date().getDate()})`,
          value: stats.total_attendance_records_today,
          color: 'info',
        },
      ],
      icon: <Link color='primary' />,
    },
    {
      label: 'User and Permission Management',
      route: 'permissions',
      value: stats.permissions,
      subStats: [
        {
          label: `Total Permissions`,
          value: stats.permissions,
          color: 'info',
        },
      ],
      icon: <MiscellaneousServices color='primary' />,
    },
  ];

  // Filter cards based on backend permissions instead of frontend role checking
  const getFilteredCards = (allCards: CardProps[]): CardProps[] => {
    if (!permissions || !permissions.dashboard_sections) {
      return [];
    }
    
    // Filter cards based on dashboard sections allowed by backend
    return allCards.filter(card => 
      permissions.dashboard_sections.includes(card.route)
    );
  };

  // Get filtered cards
  const filteredCards = stats ? getFilteredCards(getAllCards(stats)) : [];

  // Separate cards for smart grouping
  const compactCards = filteredCards.filter(
    (card) => !card.subStats || card.subStats.length <= 1
  );

  const detailedCards = filteredCards.filter(
    (card) => card.subStats && card.subStats.length > 1
  );

  // Group compact cards into sets of 4 for square layout
  const compactCardGroups = [];
  for (let i = 0; i < compactCards.length; i += 4) {
    compactCardGroups.push(compactCards.slice(i, i + 4));
  }

  // Render loading skeletons
  const renderSkeletons = () => (
    <Box>
      <Skeleton variant='text' width={200} height={32} sx={{ mb: 3 }} />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'flex-start',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Paper
            key={item}
            elevation={1}
            sx={{
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 12px)',
                md: '1 1 calc(33.333% - 16px)',
              },
              minWidth: '250px',
              maxWidth: '400px',
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton
                variant='circular'
                width={48}
                height={48}
                sx={{ mr: 2 }}
              />
              <Skeleton variant='text' width='60%' height={24} />
            </Box>
            <Skeleton variant='text' width='40%' height={40} sx={{ mb: 2 }} />
            <Skeleton variant='rectangular' height={80} />
          </Paper>
        ))}
      </Box>
    </Box>
  );

  // Render compact card for square grouping
  const renderCompactCard = (card: CardProps, idx: number) => (
    <Paper
      key={idx}
      elevation={1}
      sx={{
        flex: '1 1 calc(50% - 8px)',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={() => router.push(`/admin/${card.route}`)}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box
            sx={{
              mr: 1.5,
              p: 0.8,
              borderRadius: '10px',
              backgroundColor: `${theme.palette.primary.main}08`,
            }}
          >
            {card.icon}
          </Box>
          <Typography
            variant='caption'
            fontWeight={600}
            sx={{
              color: theme.palette.text.primary,
              fontSize: '0.8rem',
              lineHeight: 1.2,
            }}
          >
            {card.label}
          </Typography>
        </Box>

        {card.value !== undefined && (
          <Typography
            variant='h5'
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 0.5,
            }}
          >
            {card.value.toLocaleString()}
          </Typography>
        )}

        {card.subStats && card.subStats[0] && (
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
            }}
          >
            {card.subStats[0].label}
          </Typography>
        )}
      </Box>
    </Paper>
  );

  const renderDetailedCard = (card: CardProps, idx: number) => (
    <Paper
      key={idx}
      elevation={1}
      sx={{
        flex: {
          xs: '1 1 100%',
          sm: '1 1 calc(100% - 12px)',
          md: '1 1 calc(50% - 16px)',
          lg: '1 1 calc(50% - 18px)',
        },
        minWidth: { xs: '100%', sm: '350px' },
        maxWidth: { xs: '100%', lg: '600px' },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              mr: 2,
              p: 1.5,
              borderRadius: '16px',
              backgroundColor: `${theme.palette.primary.main}08`,
              border: `1px solid ${theme.palette.primary.main}20`,
            }}
          >
            {card.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant='h6'
              fontWeight={600}
              sx={{
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {card.label}
            </Typography>
          </Box>
        </Box>

        {card.value !== undefined && (
          <Typography
            variant='h3'
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 3,
            }}
          >
            {card.value.toLocaleString()}
          </Typography>
        )}

        {/* Sub Stats */}
        {card.subStats && (
          <Stack spacing={1.5}>
            {card.subStats.map((subStat, sidx) => (
              <Box
                key={sidx}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: `${theme?.palette[subStat.color]?.main}08`,
                  border: `1px solid ${theme?.palette[subStat.color]?.main}20`,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  {subStat.label}
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight={600}
                  sx={{ color: `${subStat.color}.main` }}
                >
                  {subStat.value.toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Card Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          onClick={() => router.push(`/admin/${card.route}`)}
          endIcon={<ArrowForward />}
          size='small'
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            color: theme.palette.text.secondary,
            textTransform: 'none',
            fontWeight: 500,
            py: 1,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.primary.main,
            },
          }}
        >
          View details
        </Button>
      </Box>
    </Paper>
  );

  // Render compact card group (2x2 square)
  const renderCompactCardGroup = (cardGroup: CardProps[], groupIdx: number) => (
    <Box
      key={`group-${groupIdx}`}
      sx={{
        flex: {
          xs: '1 1 100%',
          sm: '1 1 calc(50% - 12px)',
          md: '1 1 calc(50% - 16px)',
          lg: '1 1 calc(33.333% - 18px)',
        },
        minWidth: { xs: '100%', sm: '300px' },
        maxWidth: { xs: '100%', md: '400px' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        {cardGroup.map((card, idx) => renderCompactCard(card, idx))}
        {/* Fill empty slots if less than 4 cards */}
        {cardGroup.length < 4 &&
          Array.from({ length: 4 - cardGroup.length }).map((_, idx) => (
            <Box
              key={`empty-${idx}`}
              sx={{
                flex: '1 1 calc(50% - 8px)',
                minHeight: '100px',
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`,
                backgroundColor: theme.palette.action.hover,
                opacity: 0.3,
              }}
            />
          ))}
      </Box>
    </Box>
  );

  // Don't render if permissions are not loaded
  if (!permissions) {
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            padding: { xs: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                gutterBottom
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.first_name || 'User'}
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                {format(new Date(), 'PPPP')} • Your dashboard overview
              </Typography>
            </Box>

            <Tooltip title='Refresh data'>
              <IconButton
                color='inherit'
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                {refreshing ? (
                  <CircularProgress size={24} color='inherit' />
                ) : (
                  <Refresh />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Status chip */}
          {!loading && !error && (
            <Box sx={{ mt: 3 }}>
              <Chip
                label={`Last updated: ${format(lastRefreshed, 'h:mm a')}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 500,
                  backdropFilter: 'blur(10px)',
                }}
              />
            </Box>
          )}
        </Box>

        {/* Main content */}
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            backgroundColor: theme.palette.background.default,
          }}
        >
          {loading && !refreshing ? (
            renderSkeletons()
          ) : error ? (
            <Alert
              severity='error'
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.error.light}`,
              }}
              action={
                <Button
                  color='inherit'
                  size='small'
                  onClick={handleRefresh}
                  sx={{ fontWeight: 600 }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <Box>
              <Typography
                variant='h6'
                fontWeight={600}
                sx={{
                  mb: 3,
                  color: theme.palette.text.primary,
                }}
              >
                Dashboard Overview
              </Typography>

              {refreshing && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant='body2' color='text.secondary'>
                    Refreshing data...
                  </Typography>
                </Box>
              )}

              {/* Product Additions Pie Chart */}
              {stats?.product_additions_by_type && stats.product_additions_by_type.breakdown.length > 0 && (
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ mb: 3, color: theme.palette.text.primary }}
                  >
                    Product Additions by Type (SP vs Customer)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.product_additions_by_type.breakdown.map(item => ({
                              name: item.added_by === 'customer' ? 'Customer' : 'Sales Person',
                              value: item.count,
                              percentage: item.percentage,
                              added_by: item.added_by
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.product_additions_by_type.breakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.added_by === 'customer' ? '#4caf50' : '#2196f3'} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: any, name: string | number | undefined, props: any) => [
                              `${(typeof value === 'number' ? value : 0).toLocaleString()} products (${props.payload.percentage}%)`,
                              String(name || '')
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                      <Stack spacing={2}>
                        <Typography variant='subtitle1' fontWeight={600} color='text.secondary'>
                          Total Products: {stats.product_additions_by_type.total_products.toLocaleString()}
                        </Typography>
                        {stats.product_additions_by_type.breakdown.map((item, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: item.added_by === 'customer' ? '#4caf5008' : '#2196f308',
                              border: `1px solid ${item.added_by === 'customer' ? '#4caf5020' : '#2196f320'}`,
                            }}
                          >
                            <Typography variant='body1' fontWeight={600} sx={{ mb: 0.5 }}>
                              {item.added_by === 'customer' ? 'Customer' : 'Sales Person'}
                            </Typography>
                            <Typography
                              variant='h5'
                              fontWeight={700}
                              sx={{ color: item.added_by === 'customer' ? '#4caf50' : '#2196f3' }}
                            >
                              {item.count.toLocaleString()}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {item.percentage}% of total
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Mixed layout with square-grouped compact cards and detailed cards */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                }}
              >
                {/* Render detailed cards */}
                {detailedCards.map((card, idx) =>
                  renderDetailedCard(card, idx)
                )}

                {/* Render compact card groups (2x2 squares) */}
                {compactCardGroups.map((cardGroup, groupIdx) =>
                  renderCompactCardGroup(cardGroup, groupIdx)
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        TransitionComponent={Fade}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};

export default AdminDashboard;