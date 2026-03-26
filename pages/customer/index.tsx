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
  ReceiptLong,
  Download,
  Payment,
  ManageAccounts,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';
import axios from 'axios';
import { trackActivity } from '../../src/util/trackActivity';

interface CustomerStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
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
  invoice_number: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
}

interface CreditNote {
  _id: string;
  creditnote_number: string;
  status: string;
  date: string;
  total: number;
  balance: number;
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

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/orders`, {
        params: { created_by: user?.data?._id, limit: 5 },
      });

      const orders = data.orders || data || [];
      setStats({
        total_orders: orders.length,
        pending_orders: orders.filter(
          (o: any) => o.status === 'draft' || o.status === 'accepted'
        ).length,
        completed_orders: orders.filter(
          (o: any) => o.status === 'invoiced' || o.status === 'delivered'
        ).length,
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

  const fetchDashboardSummary = useCallback(async () => {
    if (!user?.data?.customer_id) {
      setSummaryLoading(false);
      return;
    }
    try {
      setSummaryLoading(true);
      const { data } = await axiosInstance.get(`/customer_portal/dashboard-summary`, {
        params: { customer_id: user?.data?.customer_id },
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

  useEffect(() => {
    if (user) {
      trackActivity({ action: 'view_dashboard', category: 'portal' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNewOrder = async () => {
    trackActivity({ action: 'click_new_order', category: 'orders' });
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      router.push(`/orders/new/${data._id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const getFinancialYearLabel = () => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const fy = m < 4 ? today.getFullYear() - 1 : today.getFullYear();
    return `FY ${fy}-${(fy + 1).toString().slice(-2)}`;
  };

  const handleDownloadStatement = async () => {
    if (!user?.data?.customer_id) return;
    try {
      setDownloadingStatement(true);
      const response = await axiosInstance.get('/customer_portal/statement/download', {
        params: { customer_id: user.data.customer_id },
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
      case 'draft': return 'default';
      case 'accepted': return 'primary';
      case 'invoiced': case 'paid': return 'success';
      case 'declined': case 'overdue': return 'error';
      case 'pending': case 'sent': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  // FinanceListItem for tabs
  const FinanceListItem = ({
    number, date, amount, balance, status,
  }: {
    number: string; date: string; amount: number; balance: number; status: string;
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
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {number}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {date ? format(new Date(date), 'PP') : 'N/A'}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
        }}
      >
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#38a169' }} />
        </Box>
      </Container>
    );
  }

  // Action cards config
  const actionCards = [
    {
      title: 'New Order',
      description: 'Start a new estimate',
      icon: <Add />,
      color: '#38a169',
      onClick: handleNewOrder,
      show: true,
    },
    {
      title: 'My Orders',
      description: 'View all estimates',
      icon: <History />,
      color: '#3b82f6',
      onClick: () => router.push('/customer/orders'),
      show: true,
    },
    {
      title: 'Invoices',
      description: 'View & download invoices',
      icon: <ReceiptLong />,
      color: '#8b5cf6',
      onClick: () => router.push('/customer/invoices'),
      show: !!user?.data?.customer_id,
    },
    {
      title: 'Payments',
      description: 'View payment history',
      icon: <Payment />,
      color: '#10b981',
      onClick: () => router.push('/customer/payments'),
      show: !!user?.data?.customer_id,
    },
    {
      title: 'Shipments',
      description: 'Track your deliveries',
      icon: <LocalShipping />,
      color: '#f59e0b',
      onClick: () => router.push('/customer/shipments'),
      show: !!user?.data?.customer_id,
    },
    // {
    //   title: 'Analytics',
    //   description: 'View order insights',
    //   icon: <TrendingUp />,
    //   color: '#6366f1',
    //   onClick: () => router.push('/customer/analytics'),
    //   show: true,
    // },
    {
      title: downloadingStatement ? 'Downloading…' : 'Statement',
      description: getFinancialYearLabel(),
      icon: downloadingStatement ? <CircularProgress size={18} color='inherit' /> : <Download />,
      color: '#0891b2',
      onClick: handleDownloadStatement,
      show: !!user?.data?.customer_id,
      disabled: downloadingStatement,
    },
    {
      title: 'My Account',
      description: 'Manage your profile',
      icon: <ManageAccounts />,
      color: '#64748b',
      onClick: () => router.push('/customer/account'),
      show: true,
    },
  ].filter((c) => c.show);

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 1.5, md: 4 }, px: { xs: 0, sm: 2, md: 3 } }}>
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
            padding: { xs: 2.5, sm: 3, md: 4 },
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
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Welcome back, {user?.data?.first_name || 'Customer'}
            </Typography>
            <Typography
              variant='body2'
              sx={{ opacity: 0.8, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {format(new Date(), 'PPPP')}
            </Typography>
          </Box>
        </Box>

        {/* Main content */}
        <Box
          sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}
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
              {/* Action Cards */}
              <Typography
                variant='subtitle1'
                fontWeight={600}
                sx={{ mb: 2, color: theme.palette.text.primary, fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Quick Access
              </Typography>

              <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 4 }}>
                {actionCards.map((card, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Card
                      elevation={0}
                      onClick={card.disabled ? undefined : card.onClick}
                      sx={{
                        height: '100%',
                        cursor: card.disabled ? 'default' : 'pointer',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2.5,
                        transition: 'all 0.18s ease',
                        opacity: card.disabled ? 0.7 : 1,
                        '&:hover': card.disabled
                          ? {}
                          : {
                              boxShadow: `0 4px 16px ${alpha(card.color, 0.18)}`,
                              transform: 'translateY(-2px)',
                              borderColor: card.color,
                            },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                        <Box
                          sx={{
                            width: { xs: 36, sm: 42 },
                            height: { xs: 36, sm: 42 },
                            borderRadius: 2,
                            backgroundColor: alpha(card.color, 0.12),
                            color: card.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.5,
                            '& svg': { fontSize: { xs: 20, sm: 22 } },
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Typography
                          variant='body2'
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.3, mb: 0.25 }}
                        >
                          {card.title}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1.3 }}
                        >
                          {card.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Recent Activity Tabs */}
              <Typography
                variant='subtitle1'
                fontWeight={600}
                sx={{ mb: 2, color: theme.palette.text.primary, fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Recent Activity
              </Typography>

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
                  <Tab
                    label={isMobile ? 'Orders' : 'Recent Orders'}
                    icon={<ShoppingCartOutlined sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                    iconPosition='start'
                  />
                  {user?.data?.customer_id && (
                    <Tab
                      label='Invoices'
                      icon={<Receipt sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                      iconPosition='start'
                    />
                  )}
                  {user?.data?.customer_id && (
                    <Tab
                      label={isMobile ? 'Credits' : 'Credit Notes'}
                      icon={<CreditCard sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                      iconPosition='start'
                    />
                  )}
                </Tabs>

                {/* Recent Orders Tab */}
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
                      <Typography
                        variant='subtitle2'
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
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
                              gap: { xs: 0.75, sm: 0 },
                              borderBottom:
                                index < stats.recent_orders.length - 1
                                  ? `1px solid ${theme.palette.divider}`
                                  : 'none',
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: theme.palette.action.hover },
                            }}
                            onClick={() => router.push(`/customer/orders/${order._id}`)}
                          >
                            <Box>
                              <Typography
                                fontWeight={500}
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                Order #{order.order_number || order._id.slice(-6)}
                              </Typography>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {order.created_at
                                  ? format(new Date(order.created_at), 'PP')
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
                        <Typography
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 2 }}
                        >
                          No orders yet — create your first!
                        </Typography>
                        <Button
                          variant='contained'
                          startIcon={<Add />}
                          onClick={handleNewOrder}
                          size={isMobile ? 'small' : 'medium'}
                          sx={{
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
                      <Typography
                        variant='subtitle2'
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
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
                      <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            variant='rectangular'
                            height={56}
                            sx={{ mb: 1, borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    ) : dashboardSummary?.recent_invoices?.length ? (
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
                        <Receipt sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }} />
                        <Typography
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
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
                      <Typography
                        variant='subtitle2'
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Recent Credit Notes
                      </Typography>
                      <Button
                        size='small'
                        endIcon={<ArrowForward />}
                        onClick={() => router.push('/customer/credit-notes')}
                        sx={{ textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        View All
                      </Button>
                    </Box>
                    <Divider />

                    {summaryLoading ? (
                      <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            variant='rectangular'
                            height={56}
                            sx={{ mb: 1, borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    ) : dashboardSummary?.recent_credit_notes?.length ? (
                      <Stack>
                        {dashboardSummary.recent_credit_notes.map((note) => (
                          <FinanceListItem
                            key={note._id}
                            number={note.creditnote_number}
                            date={note.date}
                            amount={note.total}
                            balance={note.balance}
                            status={note.status}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                        <CreditCard
                          sx={{ fontSize: { xs: 40, sm: 48 }, color: 'grey.300', mb: 2 }}
                        />
                        <Typography
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
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
