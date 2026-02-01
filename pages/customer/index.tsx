'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
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
  Chip,
  Divider,
  Stack,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Skeleton,
  alpha,
} from '@mui/material';
import AuthContext from '../../src/components/Auth';
import {
  ShoppingCartOutlined,
  History,
  LocalShipping,
  TrendingUp,
  Add,
  ArrowForward,
  Receipt,
  CreditCard,
  AccountBalanceWallet,
  Warning,
  CheckCircle,
  ReceiptLong,
  Download,
  Payment,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';
import axios from 'axios';

interface CustomerStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_spent: number;
  recent_orders: Array<{
    _id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
  }>;
}

interface Invoice {
  _id: string;
  invoice_id?: string;
  invoice_number: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  customer_name?: string;
}

interface CreditNote {
  _id: string;
  creditnote_id?: string;
  creditnote_number: string;
  status: string;
  date: string;
  total: number;
  balance: number;
  customer_name?: string;
}

interface DashboardSummary {
  recent_invoices: Invoice[];
  recent_credit_notes: CreditNote[];
  invoice_stats: {
    total: number;
    total_amount: number;
    total_balance: number;
    paid: number;
    overdue: number;
    pending: number;
  };
  credit_note_stats: {
    total: number;
    total_amount: number;
    total_balance: number;
  };
}

const CustomerDashboard = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  // Fetch customer stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/orders`, {
        params: {
          created_by: user?.data?._id,
          limit: 5,
        },
      });

      const orders = data.orders || data || [];
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(
        (o: any) => o.status === 'draft' || o.status === 'accepted'
      ).length;
      const completedOrders = orders.filter(
        (o: any) => o.status === 'invoiced' || o.status === 'delivered'
      ).length;

      setStats({
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        total_spent: 0,
        recent_orders: orders.slice(0, 5),
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch invoices and credit notes summary
  const fetchDashboardSummary = useCallback(async () => {
    if (!user?.data?.customer_id) {
      setSummaryLoading(false);
      return;
    }

    try {
      setSummaryLoading(true);
      const { data } = await axiosInstance.get(`/customer_portal/dashboard-summary`, {
        params: {
          customer_id: user?.data?.customer_id,
        },
      });
      setDashboardSummary(data);
    } catch (err: any) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchDashboardSummary();
    }
  }, [user, fetchStats, fetchDashboardSummary]);

  // Create new order
  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      router.push(`/orders/new/${_id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  // Get current financial year label (e.g., "FY 2025-26")
  const getFinancialYearLabel = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-indexed

    // If we're in Jan-Mar, FY started in April of previous year
    const fyStartYear = currentMonth < 4 ? currentYear - 1 : currentYear;
    const fyEndYear = fyStartYear + 1;

    return `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`;
  };

  // Download customer statement for current financial year
  const handleDownloadStatement = async () => {
    if (!user?.data?.customer_id) return;

    try {
      setDownloadingStatement(true);
      const response = await axiosInstance.get('/customer_portal/statement/download', {
        params: {
          customer_id: user.data.customer_id,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement_${getFinancialYearLabel().replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading statement:', err);
    } finally {
      setDownloadingStatement(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'default';
      case 'accepted':
        return 'primary';
      case 'invoiced':
      case 'paid':
        return 'success';
      case 'declined':
      case 'overdue':
        return 'error';
      case 'pending':
      case 'sent':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Stat Card Component
  const StatCard = ({
    icon,
    label,
    value,
    color,
    subValue,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
    subValue?: string;
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
        <Typography variant='caption' color='text.secondary'>
          {subValue}
        </Typography>
      )}
    </Paper>
  );

  // Invoice/Credit Note List Item
  const FinanceListItem = ({
    number,
    date,
    amount,
    balance,
    status,
    onClick,
  }: {
    number: string;
    date: string;
    amount: number;
    balance: number;
    status: string;
    onClick?: () => void;
  }) => (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1, sm: 0 },
        borderBottom: `1px solid ${theme.palette.divider}`,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: theme.palette.action.hover,
        } : {},
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {number}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {date ? format(new Date(date), 'PP') : 'N/A'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {formatCurrency(amount)}
          </Typography>
          {balance > 0 && (
            <Typography variant='caption' color='error.main'>
              Due: {formatCurrency(balance)}
            </Typography>
          )}
        </Box>
        <Chip
          label={status}
          color={getStatusColor(status) as any}
          size='small'
          sx={{ textTransform: 'capitalize', minWidth: 70 }}
        />
      </Box>
    </Box>
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
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: { xs: 150, md: 200 },
              height: { xs: 150, md: 200 },
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              position: 'relative',
              zIndex: 1,
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? 'h6' : 'h4'}
                gutterBottom
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Welcome back, {user?.data?.first_name || 'Customer'}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  opacity: 0.9,
                  fontWeight: 400,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {format(new Date(), 'PPPP')}
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
              sx={{ borderRadius: 2, mb: 3 }}
              action={
                <Button color='inherit' size='small' onClick={fetchStats}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Create Order CTA Card */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #9b81d2 0%, #0015ff 100%)',
                  color: 'white',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant='h6' fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Ready to place a new order?
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Create a new estimate and get started with your purchase
                  </Typography>
                </Box>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewOrder}
                  size={isMobile ? 'medium' : 'large'}
                  sx={{
                    backgroundColor: 'white',
                    color: 'white',
                    '&:hover': { backgroundColor: '#f0fff4', color: 'primary' },
                    textTransform: 'none',
                    fontWeight: 700,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 1.5 },
                    width: { xs: '100%', sm: 'auto' },
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  Create New Order
                </Button>
              </Paper>

              {/* Stats Section */}
              <Typography
                variant='h6'
                fontWeight={600}
                sx={{ mb: 3, color: theme.palette.text.primary, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Overview
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <StatCard
                    icon={<ShoppingCartOutlined />}
                    label='Total Orders (Estimates)'
                    value={stats?.total_orders || 0}
                    color='#3b82f6'
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <StatCard
                    icon={<LocalShipping />}
                    label='Pending Orders (Estimates)'
                    value={stats?.pending_orders || 0}
                    color='#f59e0b'
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <StatCard
                    icon={<CheckCircle />}
                    label='Completed Orders (Estimates)'
                    value={stats?.completed_orders || 0}
                    color='#10b981'
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <StatCard
                    icon={<AccountBalanceWallet />}
                    label='Outstanding Amount'
                    value={formatCurrency(dashboardSummary?.invoice_stats?.total_balance || 0)}
                    color='#ef4444'
                  />
                </Grid>
              </Grid>

              {/* Financial Summary Cards */}
              {user?.data?.customer_id && (
                <>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ mb: 3, color: theme.palette.text.primary, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Financial Summary
                  </Typography>

                  <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card
                        elevation={0}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 3,
                          height: '100%',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                mr: 2,
                              }}
                            >
                              <Receipt />
                            </Box>
                            <Typography variant='h6' fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              Invoices
                            </Typography>
                          </Box>

                          {summaryLoading ? (
                            <Box>
                              <Skeleton variant='text' width='60%' />
                              <Skeleton variant='text' width='40%' />
                            </Box>
                          ) : (
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant='body2' color='text.secondary'>Total Invoices</Typography>
                                <Typography variant='h5' fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                  {dashboardSummary?.invoice_stats?.total || 0}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant='body2' color='text.secondary'>Total Amount</Typography>
                                <Typography variant='h5' fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                  {formatCurrency(dashboardSummary?.invoice_stats?.total_amount || 0)}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant='body2' color='text.secondary'>Paid</Typography>
                                </Box>
                                <Typography variant='body1' fontWeight={500} color='success.main'>
                                  {dashboardSummary?.invoice_stats?.paid || 0}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Warning sx={{ fontSize: 16, color: 'error.main' }} />
                                  <Typography variant='body2' color='text.secondary'>Overdue</Typography>
                                </Box>
                                <Typography variant='body1' fontWeight={500} color='error.main'>
                                  {dashboardSummary?.invoice_stats?.overdue || 0}
                                </Typography>
                              </Grid>
                            </Grid>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card
                        elevation={0}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 3,
                          height: '100%',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                mr: 2,
                              }}
                            >
                              <CreditCard />
                            </Box>
                            <Typography variant='h6' fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              Credit Notes
                            </Typography>
                          </Box>

                          {summaryLoading ? (
                            <Box>
                              <Skeleton variant='text' width='60%' />
                              <Skeleton variant='text' width='40%' />
                            </Box>
                          ) : (
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant='body2' color='text.secondary'>Total Credit Notes</Typography>
                                <Typography variant='h5' fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                  {dashboardSummary?.credit_note_stats?.total || 0}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant='body2' color='text.secondary'>Total Credits</Typography>
                                <Typography variant='h5' fontWeight={600} color='success.main' sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                  {formatCurrency(dashboardSummary?.credit_note_stats?.total_amount || 0)}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <Typography variant='body2' color='text.secondary'>Available Balance</Typography>
                                <Typography variant='h5' fontWeight={600} color='success.main' sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                  {formatCurrency(dashboardSummary?.credit_note_stats?.total_balance || 0)}
                                </Typography>
                              </Grid>
                            </Grid>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Quick Actions */}
              <Typography
                variant='h6'
                fontWeight={600}
                sx={{ mb: 3, color: theme.palette.text.primary, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Quick Actions
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 1, sm: 2 },
                  mb: 4,
                }}
              >
                <Button
                  variant='outlined'
                  startIcon={<Add />}
                  onClick={handleNewOrder}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ textTransform: 'none', flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
                >
                  Create Order
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<History />}
                  onClick={() => router.push('/customer/orders')}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ textTransform: 'none', flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
                >
                  View Orders
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<TrendingUp />}
                  onClick={() => router.push('/customer/analytics')}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ textTransform: 'none', flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
                >
                  Analytics
                </Button>
                {user?.data?.customer_id && (
                  <Button
                    variant='outlined'
                    startIcon={<ReceiptLong />}
                    onClick={() => router.push('/customer/invoices')}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ textTransform: 'none', flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
                  >
                    View Invoices
                  </Button>
                )}
                {user?.data?.customer_id && (
                  <Button
                    variant='outlined'
                    startIcon={<Payment />}
                    onClick={() => router.push('/customer/payments')}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ textTransform: 'none', flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
                  >
                    View Payments
                  </Button>
                )}
                {user?.data?.customer_id && (
                  <Button
                    variant='contained'
                    startIcon={downloadingStatement ? <CircularProgress size={16} color='inherit' /> : <Download />}
                    onClick={handleDownloadStatement}
                    disabled={downloadingStatement}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      textTransform: 'none',
                      flex: { xs: '1 1 45%', sm: '0 0 auto' },
                      backgroundColor: '#38a169',
                      '&:hover': { backgroundColor: '#2f855a' },
                    }}
                  >
                    {downloadingStatement ? 'Downloading...' : `Download Statement (${getFinancialYearLabel()})`}
                  </Button>
                )}
              </Box>

              {/* Tabbed Content - Recent Orders (Estimates), Invoices, Credit Notes */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant={isMobile ? 'fullWidth' : 'standard'}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minHeight: { xs: 40, sm: 48 },
                    },
                  }}
                >
                  <Tab label='Recent Orders (Estimates)' icon={<ShoppingCartOutlined sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition='start' />
                  {user?.data?.customer_id && (
                    <Tab label='Invoices' icon={<Receipt sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition='start' />
                  )}
                  {user?.data?.customer_id && (
                    <Tab label='Credit Notes' icon={<CreditCard sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition='start' />
                  )}
                </Tabs>

                {/* Recent Orders (Estimates) Tab */}
                {activeTab === 0 && (
                  <>
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle1' fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Recent Orders (Estimates)
                      </Typography>
                      <Button
                        size='small'
                        endIcon={<ArrowForward />}
                        onClick={() => router.push('/customer/orders')}
                        sx={{ textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        View All
                      </Button>
                    </Box>
                    <Divider />

                    {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                      <Stack>
                        {stats.recent_orders.map((order, index) => (
                          <Box
                            key={order._id}
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              justifyContent: 'space-between',
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              gap: { xs: 1, sm: 0 },
                              borderBottom:
                                index < stats.recent_orders.length - 1
                                  ? `1px solid ${theme.palette.divider}`
                                  : 'none',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                            onClick={() =>
                              router.push(`/customer/orders/${order._id}`)
                            }
                          >
                            <Box>
                              <Typography fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                Order #{order.order_number || order._id.slice(-6)}
                              </Typography>
                              <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {order.created_at
                                  ? format(new Date(order.created_at), 'PPp')
                                  : 'N/A'}
                              </Typography>
                            </Box>
                            <Chip
                              label={order.status}
                              color={getStatusColor(order.status) as any}
                              size='small'
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                        <ShoppingCartOutlined
                          sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }}
                        />
                        <Typography color='text.secondary' sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No orders yet. Create your first order!
                        </Typography>
                        <Button
                          variant='contained'
                          startIcon={<Add />}
                          onClick={handleNewOrder}
                          size={isMobile ? 'small' : 'medium'}
                          sx={{
                            mt: 2,
                            backgroundColor: '#38a169',
                            '&:hover': { backgroundColor: '#2f855a' },
                            textTransform: 'none',
                          }}
                        >
                          Create Order
                        </Button>
                      </Box>
                    )}
                  </>
                )}

                {/* Invoices Tab */}
                {activeTab === 1 && user?.data?.customer_id && (
                  <>
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle1' fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Recent Invoices
                      </Typography>
                      <Button
                        size='small'
                        endIcon={<ArrowForward />}
                        onClick={() => router.push('/customer/invoices')}
                        sx={{ textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        View All
                      </Button>
                    </Box>
                    <Divider />

                    {summaryLoading ? (
                      <Box sx={{ p: 3 }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} variant='rectangular' height={60} sx={{ mb: 1, borderRadius: 1 }} />
                        ))}
                      </Box>
                    ) : dashboardSummary?.recent_invoices && dashboardSummary.recent_invoices.length > 0 ? (
                      <Stack>
                        {dashboardSummary.recent_invoices.map((invoice) => (
                          <FinanceListItem
                            key={invoice._id}
                            number={invoice.invoice_number}
                            date={invoice.date}
                            amount={invoice.total}
                            balance={invoice.balance}
                            status={invoice.status}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                        <Receipt
                          sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }}
                        />
                        <Typography color='text.secondary' sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No invoices found
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {/* Credit Notes Tab */}
                {activeTab === 2 && user?.data?.customer_id && (
                  <>
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle1' fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Recent Credit Notes
                      </Typography>
                    </Box>
                    <Divider />

                    {summaryLoading ? (
                      <Box sx={{ p: 3 }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} variant='rectangular' height={60} sx={{ mb: 1, borderRadius: 1 }} />
                        ))}
                      </Box>
                    ) : dashboardSummary?.recent_credit_notes && dashboardSummary.recent_credit_notes.length > 0 ? (
                      <Stack>
                        {dashboardSummary.recent_credit_notes.map((creditNote) => (
                          <FinanceListItem
                            key={creditNote._id}
                            number={creditNote.creditnote_number}
                            date={creditNote.date}
                            amount={creditNote.total}
                            balance={creditNote.balance}
                            status={creditNote.status}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                        <CreditCard
                          sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }}
                        />
                        <Typography color='text.secondary' sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No credit notes found
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerDashboard;
