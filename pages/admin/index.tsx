'use client';

import { type JSX, useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Grid,
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
  TrendingUp,
  MoreVert,
  Dashboard,
  ArrowForward,
  Category,
  Phishing,
  Insights,
  Radar,
  Repeat,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
// import StatCard from '../../src/components/admin/StatCard';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';

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
  submitted_shop_hooks: number;
  active_hook_categories: number;
  inactive_hook_categories: number;
  submitted_expected_reorders: number;
  last_updated?: string;
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
  const { user }: any = useContext(AuthContext);
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
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
    fetchStats();

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchStats(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [fetchStats]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchStats(true);
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Define the cards with icons; all cards available for admin/sales_admin
  const allCards: CardProps[] = stats
    ? [
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
          growth: 5, // Example growth value
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
          growth: -2, // Example growth value
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
          growth: 8, // Example growth value
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
          growth: 0, // Example growth value
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
          growth: 12, // Example growth value
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
          growth: 3, // Example growth value
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
          growth: -1, // Example growth value
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
          growth: 7, // Example growth value
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
      ]
    : [];

  // Now filter the cards based on the user's role.
  const userRoles: string[] = user?.data?.role || [];
  let filteredCards = allCards;

  if (
    userRoles.includes('catalogue_manager') &&
    !userRoles.includes('admin') &&
    !userRoles.includes('sales_admin')
  ) {
    filteredCards = allCards.filter((card) =>
      ['products', 'catalogues'].includes(card.route)
    );
  }

  // Get top 3 performing cards based on value
  const topPerformingCards = filteredCards
    .filter((card) => card.value !== undefined && card.growth !== undefined)
    .sort((a, b) => (b.growth || 0) - (a.growth || 0))
    .slice(0, 3);

  // Render loading skeletons
  const renderSkeletons = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              background: theme.palette.background.default,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton
                variant='circular'
                width={40}
                height={40}
                sx={{ mr: 2 }}
              />
              <Skeleton variant='text' width='70%' height={24} />
            </Box>
            <Skeleton variant='rectangular' height={100} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={3}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: '80vh',
          position: 'relative',
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            padding: { xs: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background pattern - subtle grid */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `repeating-linear-gradient(0deg, ${theme.palette.primary.light}, ${theme.palette.primary.light} 1px, transparent 1px, transparent 20px),
                               repeating-linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.light} 1px, transparent 1px, transparent 20px)`,
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
                sx={{ fontWeight: 'bold' }}
              >
                Welcome, {user?.data?.first_name || 'User'}
              </Typography>
              <Typography variant='body1'>
                {format(new Date(), 'PPPP')} • Your central admin hub
              </Typography>
            </Box>

            <Box>
              <Tooltip title='Refresh data'>
                <IconButton
                  color='inherit'
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
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
          </Box>

          {/* Quick Stats Summary */}
          {!loading && !error && stats && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                // icon={<Dashboard fontSize='small' color='secondary' />}
                label={`Last updated: ${format(lastRefreshed, 'h:mm a')}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                }}
              />

              {/* {topPerformingCards.map((card, idx) => (
                <Chip
                  key={idx}
                  icon={card.icon}
                  label={`${card.label}: ${card.growth}%`}
                  color={(card.growth || 0) > 0 ? 'success' : 'error'}
                  variant='filled'
                  sx={{ fontWeight: 'medium' }}
                />
              ))} */}
            </Box>
          )}
        </Box>

        {/* Main content */}
        <Box
          sx={{
            padding: { xs: 2, md: 4 },
            backgroundColor: theme.palette.background.default,
          }}
        >
          {loading && !refreshing ? (
            renderSkeletons()
          ) : error ? (
            <Alert
              severity='error'
              sx={{ mt: 2 }}
              action={
                <Button color='inherit' size='small' onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Dashboard Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant='h6' fontWeight='medium'>
                  Dashboard Overview
                </Typography>
                {refreshing && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant='body2' color='text.secondary'>
                      Refreshing data...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Cards Grid */}
              <Grid container spacing={3}>
                {filteredCards.map((card, idx) => (
                  <Grid
                    item
                    xs={12}
                    sm={card.subStats && card.subStats.length > 2 ? 12 : 6}
                    md={card.subStats && card.subStats.length > 2 ? 6 : 4}
                    lg={card.subStats && card.subStats.length > 2 ? 4 : 3}
                    key={idx}
                  >
                    <Paper
                      elevation={2}
                      sx={{
                        p: 0,
                        height: '100%',
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                mr: 1.5,
                                p: 1,
                                borderRadius: '12px',
                                backgroundColor: `${theme.palette.primary.main}15`,
                              }}
                            >
                              {card.icon}
                            </Box>
                            <Typography variant='h6' fontWeight='medium' noWrap>
                              {card.label}
                            </Typography>
                          </Box>

                          {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {card.growth !== undefined && (
                              <Chip
                                size='small'
                                icon={<TrendingUp fontSize='small' />}
                                label={`${card.growth > 0 ? '+' : ''}${
                                  card.growth
                                }%`}
                                color={
                                  card.growth > 0
                                    ? 'success'
                                    : card.growth < 0
                                    ? 'error'
                                    : 'default'
                                }
                                variant='outlined'
                                sx={{ mr: 1 }}
                              />
                            )}
                          </Box> */}
                        </Box>

                        {card.value !== undefined && (
                          <Typography
                            variant='h4'
                            sx={{ mb: 2, fontWeight: 'bold' }}
                          >
                            {card.value.toLocaleString()}
                          </Typography>
                        )}

                        {card.subStats && (
                          <Box sx={{ mb: 2 }}>
                            <Grid container spacing={1}>
                              {card.subStats.map((subStat, sidx) => (
                                <Grid
                                  item
                                  xs={12}
                                  md={
                                    card.subStats && card.subStats.length > 3
                                      ? 6
                                      : 12
                                  }
                                  key={sidx}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      p: 1,
                                      borderRadius: 1,
                                      backgroundColor: `${
                                        theme?.palette[subStat.color]?.main
                                      }10`,
                                      mb: 0.5,
                                    }}
                                  >
                                    <Typography
                                      variant='body2'
                                      color='text.secondary'
                                    >
                                      {subStat.label}
                                    </Typography>
                                    <Typography
                                      variant='body2'
                                      fontWeight='medium'
                                      color={`${subStat.color}.main`}
                                    >
                                      {subStat.value.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>

                      <Divider />

                      <Box sx={{ p: 1 }}>
                        <Button
                          onClick={() => router.push(`/admin/${card.route}`)}
                          endIcon={<ArrowForward />}
                          size='small'
                          sx={{
                            width: '100%',
                            justifyContent: 'space-between',
                            color: theme.palette.text.secondary,
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
                  </Grid>
                ))}
              </Grid>
            </>
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
