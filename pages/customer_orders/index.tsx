import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import InboxIcon from '@mui/icons-material/Inbox';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme, alpha } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';
import Header from '../../src/components/common/Header';

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  draft: 'warning',
  sent: 'info',
  accepted: 'success',
  invoiced: 'success',
  declined: 'error',
};

interface CustomerOrder {
  _id: string;
  status: string;
  total_amount?: number;
  created_at: string;
  customer_name?: string;
  estimate_created?: boolean;
  estimate_number?: string;
  placed_by_customer?: boolean;
}

interface SelfServeStats {
  customers_with_orders: number;
  orders_finalized: number;
}

interface CustomerGroup {
  _id: string;
  customer_name?: string;
  latest_order_date: string;
  order_count: number;
  total_amount: number;
  orders: CustomerOrder[];
}

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

const CustomerOrdersPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [stats, setStats] = useState<SelfServeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Customer-placed orders are the point of this page, so lead with them —
  // the chip toggles off to show every order for the customer.
  const [onlyCustomerOrders, setOnlyCustomerOrders] = useState(true);

  const isStaff = user?.role !== 'customer';

  const getData = async () => {
    // Admins have no salesperson code — the backend then returns every active
    // customer's orders. Salespeople are scoped to their own code server-side.
    if (!user || (!user.code && !isStaff)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const resp = await axiosInstance.get('/orders/by_salesperson', {
        params: user.code ? { code: user.code } : {},
      });
      setGroups(resp.data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Self-serve counts come from customer_activity_logs (same source as the
  // /admin/customer_activity cards) rather than being derived here, so the two
  // pages can't drift apart. Scoped server-side: admins see all, salespeople
  // see their own customers.
  const getStats = async () => {
    try {
      const resp = await axiosInstance.get('/customer_activity/self_serve_stats');
      setStats(resp.data);
    } catch (error) {
      console.error('Error fetching self-serve stats:', error);
    }
  };

  useEffect(() => {
    getData();
    if (user && isStaff) getStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // `user` is null until /me resolves; admins never get a `code`, so the
    // fetch has to be keyed on the user landing, not just on the code.
  }, [user?._id, user?.code]);

  const filteredGroups = groups
    .filter((g) =>
      !search.trim() || (g.customer_name || '').toLowerCase().includes(search.trim().toLowerCase())
    )
    .map((g) => {
      if (!onlyCustomerOrders) return g;
      // Keep only orders the customer placed themselves, and recompute the
      // group's summary counts/total/latest-date from the filtered set.
      // Orders arrive newest-first, so orders[0] is the latest customer order.
      const orders = g.orders.filter((o) => o.placed_by_customer);
      return {
        ...g,
        orders,
        order_count: orders.length,
        total_amount: orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
        latest_order_date: orders[0]?.created_at ?? g.latest_order_date,
      };
    })
    .filter((g) => g.orders.length > 0);

  // When filtering to customer-placed orders, re-sort so the customer with the
  // most recent customer-placed order appears first.
  if (onlyCustomerOrders) {
    filteredGroups.sort(
      (a, b) => new Date(b.latest_order_date).getTime() - new Date(a.latest_order_date).getTime()
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 720, md: 960, lg: 1100 },
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Header title='Customer Orders' showBackButton useBack />

      <Typography variant='body2' color='text.secondary'>
        Orders placed by your customers, most recent customer first.
      </Typography>

      {isStaff && !loading && stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {[
            {
              label: 'Customers ordering directly',
              value: stats.customers_with_orders,
              color: '#15803d',
            },
            {
              label: 'Orders finalised by customers',
              value: stats.orders_finalized,
              color: '#0d9488',
            },
            {
              label: 'Customers with orders',
              value: groups.length,
              color: '#4633B8',
            },
          ].map((s) => (
            <Paper
              key={s.label}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant='h5' fontWeight={800} sx={{ color: s.color }}>
                {s.value}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {s.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      <TextField
        fullWidth
        size='small'
        placeholder='Search customer…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon fontSize='small' />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position='end'>
              <IconButton size='small' onClick={() => setSearch('')}>
                <ClearIcon fontSize='small' />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label='Only customer-placed orders'
          color={onlyCustomerOrders ? 'secondary' : 'default'}
          variant={onlyCustomerOrders ? 'filled' : 'outlined'}
          onClick={() => setOnlyCustomerOrders((prev) => !prev)}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 8, color: 'text.secondary' }}>
          <InboxIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography variant='body2'>No customer orders found.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredGroups.map((group) => (
            <Accordion
              key={group._id}
              disableGutters
              sx={{
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 0, pr: 1 }}>
                  <Typography
                    variant='subtitle1'
                    fontWeight={700}
                    color='text.primary'
                    sx={{ overflowWrap: 'anywhere', lineHeight: 1.3 }}
                  >
                    {group.customer_name || 'Unknown customer'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                    <Chip size='small' label={`${group.order_count} order${group.order_count === 1 ? '' : 's'}`} />
                    <Typography variant='caption' color='text.secondary'>
                      Last: {formatDate(group.latest_order_date)}
                    </Typography>
                    <Typography variant='caption' fontWeight={700} color='text.primary'>
                      ₹{(group.total_amount ?? 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Divider />
                {group.orders.map((order) => {
                  const statusKey = (order.status || '').toLowerCase();
                  const statusColor = STATUS_COLOR[statusKey] ?? 'default';
                  const title = order.estimate_created
                    ? order.estimate_number
                    : `Order #${order._id.slice(-6)}`;
                  return (
                    <Box
                      key={order._id}
                      onClick={() => router.push(`/orders/past/${order._id}`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-of-type': { borderBottom: 'none' },
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          <Typography variant='body2' fontWeight={600} color='text.primary'>
                            {title}
                          </Typography>
                          {order.placed_by_customer && (
                            <Chip
                              size='small'
                              color='secondary'
                              variant='outlined'
                              label='By customer'
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Typography variant='caption' color='text.secondary'>
                          {formatDate(order.created_at)}
                        </Typography>
                      </Box>
                      <Chip
                        size='small'
                        color={statusColor}
                        label={statusKey ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1) : 'Unknown'}
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant='subtitle2' fontWeight={700} color='text.primary' sx={{ minWidth: 72, textAlign: 'right' }}>
                        ₹{(order.total_amount ?? 0).toLocaleString('en-IN')}
                      </Typography>
                      <ChevronRightIcon fontSize='small' sx={{ color: 'text.secondary' }} />
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CustomerOrdersPage;
