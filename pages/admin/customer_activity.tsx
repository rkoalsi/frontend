import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Drawer,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  TablePagination,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close,
  Refresh,
  AccessTime,
  Login,
  Dashboard,
  Receipt,
  LocalShipping,
  Payment,
  CreditCard,
  Download,
  ShoppingCart,
  Visibility,
  AccountCircle,
  AddShoppingCart,
  TouchApp,
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivitySummary {
  customer_id: string;
  customer_name: string | null;
  email: string | null;
  user_id: string | null;
  last_login: string | null;
  login_count: number;
  total_actions: number;
  last_seen: string | null;
  action_counts: Record<string, number>;
}

interface ActivityLog {
  _id: string;
  user_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  email: string | null;
  action: string;
  category: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; icon: React.ReactElement; color: string }> = {
  login:                  { label: 'Login',            icon: <Login />,            color: '#16a34a' },
  view_dashboard:         { label: 'Dashboard',        icon: <Dashboard />,        color: '#2563eb' },
  view_invoices:          { label: 'Invoices',         icon: <Receipt />,          color: '#7c3aed' },
  view_credit_notes:      { label: 'Credit Notes',     icon: <CreditCard />,       color: '#db2777' },
  view_shipments:         { label: 'Shipments',        icon: <LocalShipping />,    color: '#d97706' },
  view_payments:          { label: 'Payments',         icon: <Payment />,          color: '#0891b2' },
  download_statement:     { label: 'Statement DL',     icon: <Download />,         color: '#0284c7' },
  create_order:           { label: 'Created Order',    icon: <AddShoppingCart />,  color: '#16a34a' },
  finalize_order:         { label: 'Finalized Order',  icon: <ShoppingCart />,     color: '#15803d' },
  view_orders_list:       { label: 'Orders List',      icon: <ShoppingCart />,     color: '#2563eb' },
  view_order_detail:      { label: 'Order Detail',     icon: <Visibility />,       color: '#6d28d9' },
  view_account:           { label: 'Account',          icon: <AccountCircle />,    color: '#64748b' },
  click_new_order:        { label: 'New Order Btn',    icon: <TouchApp />,         color: '#84cc16' },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: <AccessTime />, color: '#94a3b8' };
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd MMM yyyy, hh:mm a');
  } catch {
    return iso;
  }
}

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  auth:      '#16a34a',
  portal:    '#2563eb',
  orders:    '#d97706',
  documents: '#0891b2',
};

// ─── Action Chip ──────────────────────────────────────────────────────────────

const ActionChip = ({ action }: { action: string }) => {
  const meta = getActionMeta(action);
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 10,
        backgroundColor: alpha(meta.color, 0.1),
        border: `1px solid ${alpha(meta.color, 0.25)}`,
      }}
    >
      <Box sx={{ color: meta.color, display: 'flex', '& svg': { fontSize: 13 } }}>
        {meta.icon}
      </Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: meta.color, lineHeight: 1 }}>
        {meta.label}
      </Typography>
    </Box>
  );
};

// ─── Activity Drawer ──────────────────────────────────────────────────────────

const ActivityDrawer = ({
  customer,
  open,
  onClose,
}: {
  customer: ActivitySummary | null;
  open: boolean;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        customer_id: customer.customer_id,
        page: page + 1,
        per_page: rowsPerPage,
      };
      if (actionFilter) params.action = actionFilter;
      const { data } = await axiosInstance.get('/customer_activity/', { params });
      setLogs(data.activities || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [customer, page, rowsPerPage, actionFilter]);

  useEffect(() => {
    if (open && customer) fetchLogs();
  }, [open, fetchLogs]);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [actionFilter]);

  if (!customer) return null;

  const topActions = Object.entries(customer.action_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 560, md: 680 }, p: 0 } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5282 100%)',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {customer.customer_name || 'Unknown Customer'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
            {customer.email || customer.customer_id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Stats strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {[
          { label: 'Total Actions', value: customer.total_actions },
          { label: 'Logins', value: customer.login_count },
          { label: 'Last Seen', value: timeAgo(customer.last_seen) },
        ].map((s, i) => (
          <Box
            key={i}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${theme.palette.divider}` : undefined,
            }}
          >
            <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Top actions breakdown */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Top Actions
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {topActions.map(([action, count]) => (
            <Chip
              key={action}
              label={`${getActionMeta(action).label} (${count})`}
              size="small"
              sx={{
                backgroundColor: alpha(getActionMeta(action).color, 0.1),
                color: getActionMeta(action).color,
                fontWeight: 600,
                fontSize: '0.72rem',
                border: `1px solid ${alpha(getActionMeta(action).color, 0.2)}`,
              }}
            />
          ))}
          {topActions.length === 0 && (
            <Typography variant="body2" color="text.secondary">No actions recorded</Typography>
          )}
        </Stack>
      </Box>

      {/* Last login */}
      {customer.last_login && (
        <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Login sx={{ fontSize: 16, color: '#16a34a' }} />
          <Typography variant="body2" color="text.secondary">
            Last login: <strong>{fmtDate(customer.last_login)}</strong>
          </Typography>
        </Box>
      )}

      {/* Filter */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Filter by action</InputLabel>
          <Select
            value={actionFilter}
            label="Filter by action"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="">All actions</MenuItem>
            {Object.entries(ACTION_META).map(([key, meta]) => (
              <MenuItem key={key} value={key}>{meta.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Activity log */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccessTime sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
            <Typography color="text.secondary">No activity found</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {logs.map((log) => {
              const meta = getActionMeta(log.action);
              return (
                <Box key={log._id} sx={{ py: 1.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      mt: 0.25,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: alpha(meta.color, 0.12),
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      '& svg': { fontSize: 16 },
                    }}
                  >
                    {meta.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography variant="body2" fontWeight={600}>{meta.label}</Typography>
                      <Chip
                        label={log.category}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: alpha(CATEGORY_COLORS[log.category] || '#94a3b8', 0.1),
                          color: CATEGORY_COLORS[log.category] || '#94a3b8',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {fmtDate(log.timestamp)}
                    </Typography>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <Typography key={k} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {k}: <strong>{String(v)}</strong>
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {log.ip_address && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                        {log.ip_address}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Per page:"
        />
      </Box>
    </Drawer>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CustomerActivityPage = () => {
  const theme = useTheme();
  const [summary, setSummary] = useState<ActivitySummary[]>([]);
  const [filtered, setFiltered] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selected, setSelected] = useState<ActivitySummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.get('/customer_activity/summary');
      setSummary(data.summary || []);
    } catch {
      setError('Failed to load customer activity. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Client-side search filter
  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(summary);
      return;
    }
    setFiltered(
      summary.filter(
        (s) =>
          s.customer_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.customer_id?.toLowerCase().includes(q)
      )
    );
    setPage(0);
  }, [search, summary]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRowClick = (row: ActivitySummary) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  // Summary totals
  const totalCustomers = summary.length;
  const totalLogins = summary.reduce((acc, s) => acc + s.login_count, 0);
  const totalActions = summary.reduce((acc, s) => acc + s.total_actions, 0);
  const activeToday = summary.filter((s) => {
    if (!s.last_seen) return false;
    const diff = Date.now() - new Date(s.last_seen).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="white">
            Customer Activity
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
            Track logins, page views, and actions across all customer accounts
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchSummary} sx={{ color: 'white' }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Tracked Customers', value: totalCustomers, color: '#2563eb' },
          { label: 'Total Logins',       value: totalLogins,    color: '#16a34a' },
          { label: 'Total Actions',      value: totalActions,   color: '#7c3aed' },
          { label: 'Active Today',       value: activeToday,    color: '#d97706' },
        ].map((s) => (
          <Paper
            key={s.label}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'white',
            }}
          >
            <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Table card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
        {/* Table toolbar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            size="small"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: 360 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
            {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    {['Customer', 'Email', 'Last Login', 'Last Seen', 'Logins', 'Actions', 'Top Activity'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No customer activity recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => {
                      const topAction = Object.entries(row.action_counts).sort((a, b) => b[1] - a[1])[0];
                      return (
                        <TableRow
                          key={row.customer_id}
                          hover
                          onClick={() => handleRowClick(row)}
                          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: alpha('#2563eb', 0.04) } }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {row.customer_name || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {row.email || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {row.last_login ? (
                              <Tooltip title={fmtDate(row.last_login)}>
                                <span>{timeAgo(row.last_login)}</span>
                              </Tooltip>
                            ) : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {row.last_seen ? (
                              <Tooltip title={fmtDate(row.last_seen)}>
                                <span>{timeAgo(row.last_seen)}</span>
                              </Tooltip>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.login_count}
                              size="small"
                              sx={{
                                backgroundColor: alpha('#16a34a', 0.1),
                                color: '#16a34a',
                                fontWeight: 700,
                                minWidth: 36,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.total_actions}
                              size="small"
                              sx={{
                                backgroundColor: alpha('#7c3aed', 0.1),
                                color: '#7c3aed',
                                fontWeight: 700,
                                minWidth: 36,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {topAction ? (
                              <ActionChip action={topAction[0]} />
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>

      {/* Detail drawer */}
      <ActivityDrawer
        customer={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </Box>
  );
};

export default CustomerActivityPage;
