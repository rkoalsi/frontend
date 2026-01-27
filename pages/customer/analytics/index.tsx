'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Divider,
  Stack,
  Grid,
  Alert,
  Button,
  IconButton,
  alpha,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AttachMoney,
  CalendarMonth,
  Inventory,
  ArrowBack,
  Receipt,
  CreditCard,
} from '@mui/icons-material';
import axiosInstance from '../../../src/util/axios';
import { format, subMonths } from 'date-fns';
import { useRouter } from 'next/router';

interface AnalyticsData {
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  orders_this_month: number;
  orders_last_month: number;
  invoice_stats: {
    total: number;
    total_amount: number;
    total_balance: number;
    paid: number;
    overdue: number;
  };
  credit_note_stats: {
    total: number;
    total_amount: number;
  };
  most_ordered_products: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  monthly_orders: Array<{
    month: string;
    count: number;
    total: number;
  }>;
}

const CustomerAnalytics = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch orders to calculate order-based analytics
      const { data: ordersData } = await axiosInstance.get(`/orders`, {
        params: {
          created_by: user?.data?._id,
        },
      });

      const orders = ordersData.orders || ordersData || [];
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Calculate order analytics
      const totalOrders = orders.length;

      // Orders this month
      const ordersThisMonth = orders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return (
          orderDate.getMonth() === thisMonth &&
          orderDate.getFullYear() === thisYear
        );
      }).length;

      // Orders last month
      const lastMonth = subMonths(now, 1);
      const ordersLastMonth = orders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return (
          orderDate.getMonth() === lastMonth.getMonth() &&
          orderDate.getFullYear() === lastMonth.getFullYear()
        );
      }).length;

      // Calculate monthly orders for last 6 months
      const monthlyOrders = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthOrders = orders.filter((o: any) => {
          const orderDate = new Date(o.created_at);
          return (
            orderDate.getMonth() === monthDate.getMonth() &&
            orderDate.getFullYear() === monthDate.getFullYear()
          );
        });
        monthlyOrders.push({
          month: format(monthDate, 'MMM yyyy'),
          count: monthOrders.length,
          total: monthOrders.reduce(
            (sum: number, o: any) => sum + (o.total || 0),
            0
          ),
        });
      }

      // Most ordered products (aggregate from all orders)
      const productMap = new Map();
      orders.forEach((order: any) => {
        (order.products || []).forEach((product: any) => {
          const key = product.name || product.product_name || product._id;
          if (key) {
            if (productMap.has(key)) {
              const existing = productMap.get(key);
              existing.quantity += product.quantity || 1;
              existing.total += (product.rate || 0) * (product.quantity || 1);
            } else {
              productMap.set(key, {
                name: product.name || product.product_name || 'Unknown Product',
                quantity: product.quantity || 1,
                total: (product.rate || 0) * (product.quantity || 1),
              });
            }
          }
        });
      });

      const mostOrderedProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Fetch invoice and credit note stats if customer_id exists
      let invoiceStats = { total: 0, total_amount: 0, total_balance: 0, paid: 0, overdue: 0 };
      let creditNoteStats = { total: 0, total_amount: 0 };

      if (user?.data?.customer_id) {
        try {
          const { data: summaryData } = await axiosInstance.get('/customer_portal/dashboard-summary', {
            params: {
              customer_id: user.data.customer_id,
            },
          });
          invoiceStats = summaryData.invoice_stats || invoiceStats;
          creditNoteStats = summaryData.credit_note_stats || creditNoteStats;
        } catch (err) {
          console.error('Error fetching invoice stats:', err);
        }
      }

      const totalSpent = invoiceStats.total_amount || 0;
      const averageOrderValue = invoiceStats.total > 0 ? totalSpent / invoiceStats.total : 0;

      setAnalytics({
        total_orders: totalOrders,
        total_spent: totalSpent,
        average_order_value: averageOrderValue,
        orders_this_month: ordersThisMonth,
        orders_last_month: ordersLastMonth,
        invoice_stats: invoiceStats,
        credit_note_stats: creditNoteStats,
        most_ordered_products: mostOrderedProducts,
        monthly_orders: monthlyOrders,
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  // Stat Card Component
  const StatCard = ({
    icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: { xs: 1, sm: 1.5 },
            borderRadius: 2,
            backgroundColor: `${color}15`,
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {label}
        </Typography>
      </Box>
      <Typography variant='h4' fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        {value}
      </Typography>
      {subValue && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
          {subValue}
        </Typography>
      )}
    </Paper>
  );

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress sx={{ color: '#38a169' }} />
        </Box>
      </Container>
    );
  }

  const growthPercentage =
    analytics?.orders_last_month && analytics.orders_last_month > 0
      ? Math.round(
          ((analytics.orders_this_month - analytics.orders_last_month) /
            analytics.orders_last_month) *
            100
        )
      : analytics?.orders_this_month && analytics.orders_this_month > 0
      ? 100
      : 0;

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: { xs: 2, md: 4 },
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/customer')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              size={isMobile ? 'small' : 'medium'}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography
                variant={isMobile ? 'h6' : 'h4'}
                sx={{ fontWeight: 700, mb: 0.5 }}
              >
                Analytics
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Track your ordering patterns and spending
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: theme.palette.background.default,
          }}
        >
          {error ? (
            <Alert
              severity='error'
              sx={{ borderRadius: 2 }}
              action={
                <Button color='inherit' size='small' onClick={fetchAnalytics}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Overview Stats */}
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Overview
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                  <StatCard
                    icon={<ShoppingCart />}
                    label='Total Orders (Estimates)'
                    value={analytics?.total_orders || 0}
                    color='#3b82f6'
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                  <StatCard
                    icon={<AttachMoney />}
                    label='Total Invoiced'
                    value={formatCurrency(analytics?.total_spent || 0)}
                    subValue={`${analytics?.invoice_stats?.total || 0} invoices`}
                    color='#10b981'
                  />
                </Grid>
              </Grid>

              {/* Financial Stats */}
              {user?.data?.customer_id && (
                <>
                  <Typography variant='h6' fontWeight={600} sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Financial Overview
                  </Typography>

                  <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                      <StatCard
                        icon={<Receipt />}
                        label='Paid Invoices'
                        value={analytics?.invoice_stats?.paid || 0}
                        color='#10b981'
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                      <StatCard
                        icon={<Receipt />}
                        label='Overdue Amount'
                        value={analytics?.invoice_stats?.overdue || 0}
                        subValue={formatCurrency(analytics?.invoice_stats?.total_balance || 0)}
                        color='#ef4444'
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Monthly Comparison */}
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Monthly Comparison
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: { xs: 1, sm: 1.5 },
                          borderRadius: 2,
                          backgroundColor: '#3b82f615',
                          color: '#3b82f6',
                          mr: 2,
                        }}
                      >
                        <CalendarMonth />
                      </Box>
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        This Month
                      </Typography>
                    </Box>
                    <Typography variant='h4' fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {analytics?.orders_this_month || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      orders placed
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: { xs: 1, sm: 1.5 },
                          borderRadius: 2,
                          backgroundColor: '#6b728015',
                          color: '#6b7280',
                          mr: 2,
                        }}
                      >
                        <CalendarMonth />
                      </Box>
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Last Month
                      </Typography>
                    </Box>
                    <Typography variant='h4' fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {analytics?.orders_last_month || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      orders placed
                    </Typography>
                  </Paper>
                </Grid>

                {/* <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: { xs: 1, sm: 1.5 },
                          borderRadius: 2,
                          backgroundColor:
                            growthPercentage >= 0 ? '#10b98115' : '#ef444415',
                          color: growthPercentage >= 0 ? '#10b981' : '#ef4444',
                          mr: 2,
                        }}
                      >
                        {growthPercentage >= 0 ? <TrendingUp /> : <TrendingDown />}
                      </Box>
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Growth
                      </Typography>
                    </Box>
                    <Typography
                      variant='h4'
                      fontWeight={700}
                      color={growthPercentage >= 0 ? '#10b981' : '#ef4444'}
                      sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                    >
                      {growthPercentage >= 0 ? '+' : ''}
                      {growthPercentage}%
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      vs last month
                    </Typography>
                  </Paper>
                </Grid> */}
              </Grid>

              {/* Monthly Orders Chart (Simple Bar) */}
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Order History (Last 6 Months)
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: { xs: 1, sm: 2 },
                    height: { xs: 150, sm: 200 },
                    justifyContent: 'space-around',
                  }}
                >
                  {analytics?.monthly_orders.map((month, index) => {
                    const maxCount = Math.max(
                      ...analytics.monthly_orders.map((m) => m.count),
                      1
                    );
                    const height = (month.count / maxCount) * (isMobile ? 100 : 150);
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1,
                        }}
                      >
                        <Typography variant='caption' fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          {month.count}
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: { xs: 30, sm: 50 },
                            height: height || 4,
                            backgroundColor: '#38a169',
                            borderRadius: 1,
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ mt: 1, textAlign: 'center', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                        >
                          {month.month.split(' ')[0]}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Most Ordered Products */}
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Most Ordered Products
              </Typography>

              {analytics?.most_ordered_products &&
              analytics.most_ordered_products.length > 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                  }}
                >
                  <Stack divider={<Divider />}>
                    {analytics.most_ordered_products.map((product, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              backgroundColor: '#38a16915',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2,
                            }}
                          >
                            <Inventory sx={{ fontSize: 18, color: '#38a169' }} />
                          </Box>
                          <Typography fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            {product.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={`${product.quantity} units ordered`}
                            size='small'
                            variant='outlined'
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Inventory
                    sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }}
                  />
                  <Typography color='text.secondary'>
                    No product data available yet
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerAnalytics;
