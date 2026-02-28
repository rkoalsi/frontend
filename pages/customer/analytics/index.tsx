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
  ShoppingCart,
  AttachMoney,
  Inventory,
  ArrowBack,
  Receipt,
} from '@mui/icons-material';
import axiosInstance from '../../../src/util/axios';
import { format, subMonths } from 'date-fns';
import { useRouter } from 'next/router';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

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

const INVOICE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280'];
const PRODUCT_COLOR = '#38a169';

const CustomerAnalytics = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const { data: ordersData } = await axiosInstance.get(`/orders`, {
        params: { created_by: user?.data?._id },
      });

      const orders = ordersData.orders || ordersData || [];
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const totalOrders = orders.length;

      const ordersThisMonth = orders.filter((o: any) => {
        const d = new Date(o.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length;

      const lastMonth = subMonths(now, 1);
      const ordersLastMonth = orders.filter((o: any) => {
        const d = new Date(o.created_at);
        return (
          d.getMonth() === lastMonth.getMonth() &&
          d.getFullYear() === lastMonth.getFullYear()
        );
      }).length;

      const monthlyOrders = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthOrders = orders.filter((o: any) => {
          const d = new Date(o.created_at);
          return (
            d.getMonth() === monthDate.getMonth() &&
            d.getFullYear() === monthDate.getFullYear()
          );
        });
        monthlyOrders.push({
          month: format(monthDate, 'MMM yy'),
          count: monthOrders.length,
          total: monthOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        });
      }

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
                name: product.name || product.product_name || 'Unknown',
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

      let invoiceStats = { total: 0, total_amount: 0, total_balance: 0, paid: 0, overdue: 0 };
      let creditNoteStats = { total: 0, total_amount: 0 };

      if (user?.data?.customer_id) {
        try {
          const { data: summaryData } = await axiosInstance.get(
            '/customer_portal/dashboard-summary',
            { params: { customer_id: user.data.customer_id } }
          );
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
    if (user) fetchAnalytics();
  }, [user, fetchAnalytics]);

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
        '&:hover': { boxShadow: theme.shadows[4], transform: 'translateY(-2px)' },
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
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {label}
        </Typography>
      </Box>
      <Typography variant='h4' fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        {value}
      </Typography>
      {subValue && (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
        >
          {subValue}
        </Typography>
      )}
    </Paper>
  );

  // Custom tooltip for area/bar charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 120,
          }}
        >
          <Typography variant='caption' fontWeight={600} display='block' sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          {payload.map((entry: any, i: number) => (
            <Typography key={i} variant='caption' display='block' sx={{ color: entry.color }}>
              {entry.name}:{' '}
              <strong>
                {entry.name === 'Amount' ? formatCurrency(entry.value) : entry.value}
              </strong>
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#38a169' }} />
        </Box>
      </Container>
    );
  }

  // Invoice pie data
  const invoicePieData = [
    { name: 'Paid', value: analytics?.invoice_stats?.paid || 0, color: '#10b981' },
    { name: 'Overdue', value: analytics?.invoice_stats?.overdue || 0, color: '#ef4444' },
    {
      name: 'Pending',
      value: Math.max(
        0,
        (analytics?.invoice_stats?.total || 0) -
          (analytics?.invoice_stats?.paid || 0) -
          (analytics?.invoice_stats?.overdue || 0)
      ),
      color: '#f59e0b',
    },
  ].filter((d) => d.value > 0);

  // Top products data for horizontal bar
  const productsData = (analytics?.most_ordered_products || []).map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
    quantity: p.quantity,
  }));

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
        {/* Header */}
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
              <Typography variant={isMobile ? 'h6' : 'h4'} sx={{ fontWeight: 700, mb: 0.5 }}>
                Analytics
              </Typography>
              <Typography
                variant='body2'
                sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Track your ordering patterns and spending
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content */}
        <Box
          sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}
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
              <Typography
                variant='h6'
                fontWeight={600}
                sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
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

              {/* Monthly Orders Area Chart */}
              <Typography
                variant='h6'
                fontWeight={600}
                sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Order History — Last 6 Months
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 3 },
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 4,
                }}
              >
                <ResponsiveContainer width='100%' height={isMobile ? 200 : 260}>
                  <AreaChart
                    data={analytics?.monthly_orders || []}
                    margin={{ top: 10, right: 10, left: isMobile ? -20 : 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id='ordersGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#38a169' stopOpacity={0.35} />
                        <stop offset='95%' stopColor='#38a169' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
                    <XAxis
                      dataKey='month'
                      tick={{ fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type='monotone'
                      dataKey='count'
                      name='Orders'
                      stroke='#38a169'
                      strokeWidth={2.5}
                      fill='url(#ordersGradient)'
                      dot={{ fill: '#38a169', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive
                      animationDuration={1000}
                      animationEasing='ease-out'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>

              {/* Invoice Status & Financial */}
              {user?.data?.customer_id && invoicePieData.length > 0 && (
                <>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Invoice Status Breakdown
                  </Typography>

                  <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                    {/* Pie Chart */}
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
                        <Typography
                          variant='subtitle2'
                          fontWeight={600}
                          sx={{ mb: 2, textAlign: 'center' }}
                        >
                          By Count
                        </Typography>
                        <ResponsiveContainer width='100%' height={200}>
                          <PieChart>
                            <Pie
                              data={invoicePieData}
                              cx='50%'
                              cy='50%'
                              innerRadius={50}
                              outerRadius={80}
                              dataKey='value'
                              isAnimationActive
                              animationDuration={900}
                              animationEasing='ease-out'
                            >
                              {invoicePieData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(val: any, name: any) => [val, name]}
                            />
                            <Legend
                              iconType='circle'
                              iconSize={10}
                              formatter={(value) => (
                                <span style={{ fontSize: isMobile ? 11 : 13 }}>{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>

                    {/* Invoice Stats */}
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
                        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 2 }}>
                          Invoice Summary
                        </Typography>
                        <Stack spacing={1.5}>
                          {[
                            {
                              label: 'Total Amount',
                              value: formatCurrency(analytics?.invoice_stats?.total_amount || 0),
                              color: '#3b82f6',
                            },
                            {
                              label: 'Paid',
                              value: `${analytics?.invoice_stats?.paid || 0} invoices`,
                              color: '#10b981',
                            },
                            {
                              label: 'Overdue Balance',
                              value: formatCurrency(analytics?.invoice_stats?.total_balance || 0),
                              color: '#ef4444',
                            },
                          ].map((item) => (
                            <Box
                              key={item.label}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 1.5,
                                backgroundColor: alpha(item.color, 0.07),
                              }}
                            >
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                              >
                                {item.label}
                              </Typography>
                              <Typography
                                variant='body2'
                                fontWeight={700}
                                sx={{ color: item.color, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                              >
                                {item.value}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Top Products Bar Chart */}
              {productsData.length > 0 && (
                <>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Most Ordered Products
                  </Typography>

                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 3 },
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      mb: 4,
                    }}
                  >
                    <ResponsiveContainer width='100%' height={isMobile ? 200 : 240}>
                      <BarChart
                        data={productsData}
                        layout='vertical'
                        margin={{ top: 5, right: 20, left: isMobile ? 0 : 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          horizontal={false}
                          stroke={theme.palette.divider}
                        />
                        <XAxis
                          type='number'
                          allowDecimals={false}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary }}
                        />
                        <YAxis
                          type='category'
                          dataKey='name'
                          width={isMobile ? 90 : 120}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary }}
                        />
                        <Tooltip
                          formatter={(val: any) => [val, 'Units']}
                          cursor={{ fill: alpha(PRODUCT_COLOR, 0.08) }}
                        />
                        <Bar
                          dataKey='quantity'
                          name='Units'
                          fill={PRODUCT_COLOR}
                          radius={[0, 4, 4, 0]}
                          isAnimationActive
                          animationDuration={900}
                          animationEasing='ease-out'
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </>
              )}

              {/* Empty products state */}
              {productsData.length === 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Inventory sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }} />
                  <Typography color='text.secondary'>No product data available yet</Typography>
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
