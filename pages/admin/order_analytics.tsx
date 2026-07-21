import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  TablePagination,
  Button as MuiButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Insights as InsightsIcon,
  ShoppingCartCheckout,
  RemoveShoppingCart,
  Person,
  Paid as PaidIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

// ── Types ────────────────────────────────────────────────────────────────
interface Metrics {
  totalOrders: number;
  estimateOrders: number;
  finalisedOrders: number;
  customerCreatedOrders: number;
  customerFinalisedOrders: number;
  salespersonCreatedOrders: number;
  paidOrders: number;
  customerPaidOrders: number;
  customerAddedItems: number;
  customerAddedQty: number;
  salespersonAddedItems: number;
  salespersonAddedQty: number;
  totalValue: number;
  estimateValue: number;
  finalisedValue: number;
  paidValue: number;
  customerAddedValue: number;
  salespersonAddedValue: number;
}

interface Period extends Metrics {
  period: string;
}

interface Summary extends Metrics {
  abandonedOrders: number;
  abandonedCustomerOrders: number;
  dueOrders: number;
  dueValue: number;
  customerStartedOrders: number;
  customerActivityFinalised: number;
  customerActivityPaid: number;
  customerSelfServiceCount: number;
}

interface AddedByRow {
  addedBy: string;
  lineItems: number;
  qty: number;
  value: number;
}

interface StatusRow {
  status: string;
  count: number;
  value: number;
}

interface CustomerRow {
  id: string | null;
  name: string;
  orders: number;
  finalised: number;
  paid: number;
  value: number;
  paidValue: number;
  productsAdded: number;
  sharedLinkOrders: number;
  selfFinalisedOrders: number;
  lastOrder: string | null;
  contactId?: string | null;
  salesPerson?: string;
  hasCustomerLogin?: boolean;
  customerLoginEmail?: string;
}

interface SalespersonRow {
  id: string | null;
  name: string;
  email: string;
  role: string;
  orders: number;
  finalised: number;
  paid: number;
  value: number;
  paidValue: number;
  lastOrder: string | null;
}

interface AnalyticsResponse {
  granularity: 'month' | 'day';
  summary: Summary;
  periods: Period[];
  productsByAddedBy: AddedByRow[];
  byStatus: StatusRow[];
  customers: CustomerRow[];
  salespeople: SalespersonRow[];
  customerCreators: SalespersonRow[];
}

// Friendly label for an `added_by` value.
const addedByLabel = (v: string) =>
  v === 'sales_person'
    ? 'Salesperson'
    : v === 'customer'
    ? 'Customer'
    : v === 'unknown'
    ? 'Unknown'
    : v
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

// ── Formatting helpers ──────────────────────────────────────────────────
const fmtInt = (n: number) => (n ?? 0).toLocaleString('en-IN');

const fmtMoney = (n: number) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Turn "2026-07" / "2026-07-14" into a friendly label.
const fmtPeriod = (p: string) => {
  if (!p) return '—';
  const parts = p.split('-');
  if (parts.length === 2) return `${MONTHS[+parts[1] - 1]} ${parts[0]}`;
  if (parts.length === 3)
    return `${+parts[2]} ${MONTHS[+parts[1] - 1]} ${parts[0]}`;
  return p;
};

const pct = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 100) : 0;

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Summary card ─────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', borderTop: `3px solid ${color}` }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.24 : 0.14),
              color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ── Searchable usage list (customers / salespeople) ──────────────────────
interface ListColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (row: any) => React.ReactNode;
}

const UsageListCard: React.FC<{
  title: string;
  subtitle: string;
  rows: any[];
  columns: ListColumn[];
  searchPlaceholder: string;
  onDownload?: () => void;
  downloading?: boolean;
}> = ({
  title,
  subtitle,
  rows,
  columns,
  searchPlaceholder,
  onDownload,
  downloading,
}) => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.name || '').toLowerCase().includes(q.trim().toLowerCase())
      ),
    [rows, q]
  );
  // Reset to first page whenever the search narrows the list.
  React.useEffect(() => setPage(0), [q, rows]);
  const paged = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          mb={1.5}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            {onDownload && (
              <MuiButton
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                disabled={downloading}
                sx={{ whiteSpace: 'nowrap' }}
              >
                XLSX
              </MuiButton>
            )}
          </Stack>
        </Stack>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align}>
                    {c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No matches.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((r, i) => (
                  <TableRow key={r.id || i} hover>
                    {columns.map((c) => (
                      <TableCell key={c.key} align={c.align}>
                        {c.render(r)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
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
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>
    </Card>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────
const OrderAnalyticsPage = () => {
  const theme = useTheme();
  const [granularity, setGranularity] = useState<'month' | 'day'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createdBy, setCreatedBy] = useState<'all' | 'customer' | 'sales_person'>(
    'all'
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [periodPage, setPeriodPage] = useState(0);
  const [periodRpp, setPeriodRpp] = useState(12);

  const downloadReport = async (section: string) => {
    try {
      setDownloading(section);
      const res = await axiosInstance.get('/admin/order_analytics/report', {
        params: {
          section,
          granularity,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          created_by: createdBy,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `order_analytics_${section}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/order_analytics', {
        params: {
          granularity,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          created_by: createdBy,
        },
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || 'Failed to load order analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount with defaults.
  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data?.summary;

  const customerProducts = useMemo(
    () => data?.productsByAddedBy.find((r) => r.addedBy === 'customer'),
    [data]
  );

  const customersFinalisedByLogin = useMemo(
    () =>
      (data?.customers || []).filter((c) => c.selfFinalisedOrders > 0).length,
    [data]
  );

  const COLORS = {
    orders: theme.palette.primary.main,
    finalised: theme.palette.success.main,
    paid: theme.palette.success.dark,
    abandoned: theme.palette.error.main,
    value: theme.palette.info.main,
    customer: theme.palette.warning.main,
    salesperson: theme.palette.secondary.main,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <InsightsIcon color="primary" sx={{ fontSize: 34 }} />
        <Typography variant="h5" fontWeight={700}>
          Order Analytics
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Month-wise / day-wise breakdown of orders placed on Marketplace.
        Empty orders (someone clicked <em>Create Order</em> but never added any
        products or value) are excluded from every metric and reported
        separately as <strong>abandoned</strong>.
      </Typography>

      {/* ── Filters ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={granularity}
              onChange={(_, v) => v && setGranularity(v)}
            >
              <ToggleButton value="month">Monthly</ToggleButton>
              <ToggleButton value="day">Daily</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              type="date"
              label="From"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayStr() }}
              sx={{ width: { xs: '100%', md: 170 } }}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayStr() }}
              sx={{ width: { xs: '100%', md: 170 } }}
            />

            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Created By</InputLabel>
              <Select
                label="Created By"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value as any)}
              >
                <MenuItem value="all">Everyone</MenuItem>
                <MenuItem value="customer">Customers (self-service)</MenuItem>
                <MenuItem value="sales_person">Salespeople</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {loading ? 'Loading…' : 'Apply'}
            </Button>
            {(startDate || endDate) && (
              <Button
                variant="text"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear dates
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {loading && !data ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !s ? (
        <Alert severity="info">No data.</Alert>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
              mb: 3,
            }}
          >
            <StatCard
              icon={<InsightsIcon />}
              color={COLORS.orders}
              label="Orders Placed"
              value={fmtInt(s.totalOrders)}
              sub={`${fmtMoney(s.totalValue)} total order value`}
            />
            <StatCard
              icon={<ShoppingCartCheckout />}
              color={COLORS.value}
              label="Estimates Created"
              value={fmtInt(s.estimateOrders)}
              sub={`${pct(s.estimateOrders, s.totalOrders)}% of orders · ${fmtMoney(
                s.estimateValue
              )}`}
            />
            <StatCard
              icon={<ShoppingCartCheckout />}
              color={COLORS.finalised}
              label="Finalised (Invoiced)"
              value={fmtInt(s.finalisedOrders)}
              sub={`${pct(
                s.finalisedOrders,
                s.estimateOrders
              )}% fulfilment of estimates · ${fmtMoney(s.finalisedValue)}`}
            />
            <StatCard
              icon={<PaidIcon />}
              color={COLORS.paid}
              label="Paid (invoice settled)"
              value={fmtInt(s.paidOrders)}
              sub={`${pct(s.paidOrders, s.finalisedOrders)}% of finalised · ${fmtMoney(
                s.paidValue
              )}`}
            />
            <StatCard
              icon={<RemoveShoppingCart />}
              color={COLORS.abandoned}
              label="Abandoned (empty)"
              value={fmtInt(s.abandonedOrders)}
              sub={`Created but never used · ${s.abandonedCustomerOrders} by customers`}
            />
            <StatCard
              icon={<Person />}
              color={COLORS.customer}
              label="Customer Self-Service Orders"
              value={fmtInt(s.customerStartedOrders)}
              sub={`started · ${fmtInt(
                s.customerActivityFinalised
              )} finalised by ${fmtInt(
                s.customerSelfServiceCount
              )} customers (activity tracking)`}
            />
            <StatCard
              icon={<Person />}
              color={COLORS.customer}
              label="Products Added by Customers"
              value={fmtInt(customerProducts?.lineItems ?? s.customerAddedItems)}
              sub={`line items · ${fmtInt(
                s.customerAddedQty
              )} units · ${fmtMoney(s.customerAddedValue)}`}
            />
          </Box>

          {/* ── Fulfillment funnel ── */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                mb={1.5}
              >
                <Typography variant="h6" fontWeight={600}>
                  Fulfillment Funnel
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    color="success"
                    variant="outlined"
                    label={`Overall fulfilment: ${pct(
                      s.finalisedOrders,
                      s.estimateOrders
                    )}% (invoiced / estimates)`}
                  />
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`Paid: ${pct(
                      s.paidOrders,
                      s.estimateOrders
                    )}% of estimates`}
                  />
                </Stack>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr 1fr',
                    md: 'repeat(5, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {[
                  {
                    label: 'Orders Placed',
                    value: s.totalOrders,
                    money: s.totalValue,
                    of: null as number | null,
                    note: 'excl. abandoned',
                    color: COLORS.orders,
                  },
                  {
                    label: 'Estimates Created',
                    value: s.estimateOrders,
                    money: s.estimateValue,
                    of: s.totalOrders,
                    note: null,
                    color: COLORS.value,
                  },
                  {
                    label: 'Invoiced',
                    value: s.finalisedOrders,
                    money: s.finalisedValue,
                    of: s.estimateOrders,
                    note: null,
                    color: COLORS.finalised,
                  },
                  {
                    label: 'Paid',
                    value: s.paidOrders,
                    money: s.paidValue,
                    of: s.finalisedOrders,
                    note: null,
                    color: COLORS.paid,
                  },
                  {
                    label: 'Payments Due',
                    value: s.dueOrders,
                    money: s.dueValue,
                    of: null,
                    note: 'invoiced, not yet paid',
                    color: COLORS.abandoned,
                  },
                ].map((step) => (
                  <Box key={step.label}>
                    <Typography variant="body2" color="text.secondary">
                      {step.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ color: step.color }}
                    >
                      {fmtInt(step.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {fmtMoney(step.money)}
                    </Typography>
                    {step.of != null ? (
                      <Typography variant="caption" color="text.secondary">
                        {pct(step.value, step.of)}% of previous
                      </Typography>
                    ) : step.note ? (
                      <Typography variant="caption" color="text.secondary">
                        {step.note}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* ── Who adds the products ── */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="h6" fontWeight={600}>
                  Products Added — Customer vs Salesperson
                </Typography>
                <MuiButton
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadReport('products')}
                  disabled={downloading === 'products'}
                >
                  XLSX
                </MuiButton>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Line items in the <code>orders</code> collection, split by who
                added each product (<code>added_by</code>). Value is{' '}
                <strong>net of the B2B margin</strong> (price × qty × (1 −
                margin%)), so it reconciles with the order totals above rather
                than the gross list price.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Added By</TableCell>
                      <TableCell align="right">Line Items</TableCell>
                      <TableCell align="right">Units</TableCell>
                      <TableCell align="right">Net Value</TableCell>
                      <TableCell align="right">Share of Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const rows = data!.productsByAddedBy;
                      const totalItems = rows.reduce(
                        (a, r) => a + r.lineItems,
                        0
                      );
                      const totalQty = rows.reduce((a, r) => a + r.qty, 0);
                      const totalValue = rows.reduce((a, r) => a + r.value, 0);
                      return rows.map((r) => (
                        <TableRow key={r.addedBy} hover>
                          <TableCell>
                            <Chip
                              size="small"
                              label={addedByLabel(r.addedBy)}
                              color={
                                r.addedBy === 'customer'
                                  ? 'warning'
                                  : r.addedBy === 'sales_person'
                                  ? 'secondary'
                                  : 'default'
                              }
                              variant={
                                r.addedBy === 'customer' ||
                                r.addedBy === 'sales_person'
                                  ? 'filled'
                                  : 'outlined'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {fmtInt(r.lineItems)}
                          </TableCell>
                          <TableCell align="right">{fmtInt(r.qty)}</TableCell>
                          <TableCell align="right">
                            {fmtMoney(r.value)}
                          </TableCell>
                          <TableCell align="right" sx={{ width: 160 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <LinearProgress
                                variant="determinate"
                                value={pct(r.lineItems, totalItems)}
                                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">
                                {pct(r.lineItems, totalItems)}%
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )).concat(
                        <TableRow key="__total__">
                          <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {fmtInt(totalItems)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {fmtInt(totalQty)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {fmtMoney(totalValue)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            100%
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* ── Salespeople using the form ── */}
          <UsageListCard
            title="Salespeople Using the Marketplace"
            subtitle="Team members who created at least one real order in the range, most active first."
            rows={data!.salespeople}
            searchPlaceholder="Search salespeople…"
            onDownload={() => downloadReport('salespeople')}
            downloading={downloading === 'salespeople'}
            columns={[
              {
                key: 'name',
                label: 'Salesperson',
                render: (r) => (
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {r.name}
                    </Typography>
                    {r.email && (
                      <Typography variant="caption" color="text.secondary">
                        {r.email}
                      </Typography>
                    )}
                  </Box>
                ),
              },
              {
                key: 'orders',
                label: 'Orders',
                align: 'right',
                render: (r) => fmtInt(r.orders),
              },
              {
                key: 'finalised',
                label: 'Finalised',
                align: 'right',
                render: (r) =>
                  `${fmtInt(r.finalised)} (${pct(r.finalised, r.orders)}%)`,
              },
              {
                key: 'paid',
                label: 'Paid',
                align: 'right',
                render: (r) =>
                  `${fmtInt(r.paid)} (${pct(r.paid, r.orders)}%)`,
              },
              {
                key: 'value',
                label: 'Value',
                align: 'right',
                render: (r) => fmtMoney(r.value),
              },
              {
                key: 'paidValue',
                label: 'Paid Value',
                align: 'right',
                render: (r) => fmtMoney(r.paidValue),
              },
              {
                key: 'lastOrder',
                label: 'Last Order',
                align: 'right',
                render: (r) => r.lastOrder || '—',
              },
            ]}
          />

          {/* ── Customers whose orders flow through the form ── */}
          <UsageListCard
            title="Customers Using the Marketplace"
            subtitle={`Customers who added product(s) themselves (added_by = customer) on at least one real order. ${fmtInt(
              customersFinalisedByLogin
            )} of them also finalised an order by logging in themselves.`}
            rows={data!.customers}
            searchPlaceholder="Search customers…"
            onDownload={() => downloadReport('customers')}
            downloading={downloading === 'customers'}
            columns={[
              {
                key: 'name',
                label: 'Customer',
                render: (r) => (
                  <Typography variant="body2" fontWeight={600}>
                    {r.name}
                  </Typography>
                ),
              },
              {
                key: 'salesPerson',
                label: 'Sales Person',
                render: (r) => r.salesPerson || '—',
              },
              {
                key: 'hasLogin',
                label: 'Login',
                render: (r) =>
                  r.hasCustomerLogin ? (
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label={r.customerLoginEmail || 'Yes'}
                    />
                  ) : (
                    <Chip size="small" variant="outlined" label="No account" />
                  ),
              },
              {
                key: 'orders',
                label: 'Orders',
                align: 'right',
                render: (r) => fmtInt(r.orders),
              },
              {
                key: 'finalised',
                label: 'Finalised',
                align: 'right',
                render: (r) =>
                  `${fmtInt(r.finalised)} (${pct(r.finalised, r.orders)}%)`,
              },
              {
                key: 'paid',
                label: 'Paid',
                align: 'right',
                render: (r) => `${fmtInt(r.paid)} (${pct(r.paid, r.orders)}%)`,
              },
              {
                key: 'sharedLink',
                label: 'Shared-Link Orders',
                align: 'right',
                render: (r) =>
                  r.sharedLinkOrders > 0 ? (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={`${fmtInt(r.sharedLinkOrders)} · ${fmtInt(
                        r.productsAdded
                      )} items`}
                    />
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'loginFinalised',
                label: 'Finalised by Login',
                align: 'right',
                render: (r) =>
                  r.selfFinalisedOrders > 0 ? (
                    <Chip
                      size="small"
                      color="success"
                      label={fmtInt(r.selfFinalisedOrders)}
                    />
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'value',
                label: 'Value',
                align: 'right',
                render: (r) => fmtMoney(r.value),
              },
              {
                key: 'lastOrder',
                label: 'Last Order',
                align: 'right',
                render: (r) => r.lastOrder || '—',
              },
            ]}
          />

          {/* ── Self-service customers (created their own orders) ── */}
          {data!.customerCreators.length > 0 && (
            <UsageListCard
              title="Self-Service Customers"
              subtitle="Customers who logged in and created their own orders (created_by role = customer)."
              rows={data!.customerCreators}
              searchPlaceholder="Search customers…"
              onDownload={() => downloadReport('salespeople')}
              downloading={downloading === 'salespeople'}
              columns={[
                {
                  key: 'name',
                  label: 'Customer',
                  render: (r) => (
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {r.name}
                      </Typography>
                      {r.email && (
                        <Typography variant="caption" color="text.secondary">
                          {r.email}
                        </Typography>
                      )}
                    </Box>
                  ),
                },
                {
                  key: 'orders',
                  label: 'Orders',
                  align: 'right',
                  render: (r) => fmtInt(r.orders),
                },
                {
                  key: 'finalised',
                  label: 'Finalised',
                  align: 'right',
                  render: (r) =>
                    `${fmtInt(r.finalised)} (${pct(r.finalised, r.orders)}%)`,
                },
                {
                  key: 'value',
                  label: 'Value',
                  align: 'right',
                  render: (r) => fmtMoney(r.value),
                },
                {
                  key: 'lastOrder',
                  label: 'Last Order',
                  align: 'right',
                  render: (r) => r.lastOrder || '—',
                },
              ]}
            />
          )}

          {/* ── Period breakdown ── */}
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="h6" fontWeight={600}>
                  {granularity === 'day' ? 'Daily' : 'Monthly'} Breakdown
                </Typography>
                <MuiButton
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadReport('periods')}
                  disabled={downloading === 'periods'}
                >
                  XLSX
                </MuiButton>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Click a row for the full breakdown of that{' '}
                {granularity === 'day' ? 'day' : 'month'}.
              </Typography>
              {data!.periods.length === 0 ? (
                <Alert severity="info">
                  No orders in the selected range.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            {granularity === 'day' ? 'Day' : 'Month'}
                          </TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Estimates</TableCell>
                          <TableCell align="right">Invoiced</TableCell>
                          <TableCell align="right">Paid</TableCell>
                          <TableCell align="right">Fulfilment %</TableCell>
                          <TableCell align="right">Cust. Products</TableCell>
                          <TableCell align="right">Estimate Value</TableCell>
                          <TableCell align="right">Invoiced Value</TableCell>
                          <TableCell align="right">Paid Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...data!.periods]
                          .reverse()
                          .slice(
                            periodPage * periodRpp,
                            periodPage * periodRpp + periodRpp
                          )
                          .map((p) => (
                            <TableRow
                              key={p.period}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => setSelectedPeriod(p)}
                            >
                              <TableCell>{fmtPeriod(p.period)}</TableCell>
                              <TableCell align="right">
                                {fmtInt(p.totalOrders)}
                              </TableCell>
                              <TableCell align="right">
                                {fmtInt(p.estimateOrders)}
                              </TableCell>
                              <TableCell align="right">
                                {fmtInt(p.finalisedOrders)}{' '}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ({pct(p.finalisedOrders, p.estimateOrders)}%)
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {fmtInt(p.paidOrders)}
                              </TableCell>
                              <TableCell align="right">
                                {pct(p.finalisedOrders, p.estimateOrders)}%
                              </TableCell>
                              <TableCell align="right">
                                {fmtInt(p.customerAddedItems)}
                              </TableCell>
                              <TableCell align="right">
                                {fmtMoney(p.estimateValue)}
                              </TableCell>
                              <TableCell align="right">
                                {fmtMoney(p.finalisedValue)}
                              </TableCell>
                              <TableCell align="right">
                                {fmtMoney(p.paidValue)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={data!.periods.length}
                    page={periodPage}
                    onPageChange={(_, pg) => setPeriodPage(pg)}
                    rowsPerPage={periodRpp}
                    onRowsPerPageChange={(e) => {
                      setPeriodRpp(parseInt(e.target.value, 10));
                      setPeriodPage(0);
                    }}
                    rowsPerPageOptions={[12, 31, 60, 100]}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Period detail popup ── */}
      <Dialog
        open={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPeriod && (
          <>
            <DialogTitle>
              {fmtPeriod(selectedPeriod.period)} · Breakdown
            </DialogTitle>
            <DialogContent dividers>
              <PeriodDetail p={selectedPeriod} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPeriod(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

// ── Popup body ──────────────────────────────────────────────────────────
const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      py: 0.75,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

const PeriodDetail: React.FC<{ p: Period }> = ({ p }) => (
  <Box>
    <Typography variant="overline" color="text.secondary">
      Orders
    </Typography>
    <DetailRow label="Orders placed" value={fmtInt(p.totalOrders)} />
    <DetailRow
      label="Estimates created"
      value={`${fmtInt(p.estimateOrders)} (${pct(
        p.estimateOrders,
        p.totalOrders
      )}%)`}
    />
    <DetailRow
      label="Invoiced (finalised)"
      value={`${fmtInt(p.finalisedOrders)} (${pct(
        p.finalisedOrders,
        p.estimateOrders
      )}% of estimates)`}
    />
    <DetailRow
      label="Paid"
      value={`${fmtInt(p.paidOrders)} (${pct(
        p.paidOrders,
        p.finalisedOrders
      )}% of invoiced)`}
    />
    <DetailRow
      label="Payments due"
      value={fmtInt(Math.max(0, p.finalisedOrders - p.paidOrders))}
    />

    <Divider sx={{ my: 1.5 }} />
    <Typography variant="overline" color="text.secondary">
      Value
    </Typography>
    <DetailRow label="Total order value" value={fmtMoney(p.totalValue)} />
    <DetailRow label="Estimate value" value={fmtMoney(p.estimateValue)} />
    <DetailRow label="Finalised value" value={fmtMoney(p.finalisedValue)} />
    <DetailRow label="Paid value" value={fmtMoney(p.paidValue)} />
    <DetailRow
      label="Payments due value"
      value={fmtMoney(Math.max(0, p.finalisedValue - p.paidValue))}
    />

    <Divider sx={{ my: 1.5 }} />
    <Typography variant="overline" color="text.secondary">
      Products added by customers
    </Typography>
    <DetailRow label="Line items" value={fmtInt(p.customerAddedItems)} />
    <DetailRow label="Units" value={fmtInt(p.customerAddedQty)} />
    <DetailRow label="Value" value={fmtMoney(p.customerAddedValue)} />

    <Divider sx={{ my: 1.5 }} />
    <Typography variant="overline" color="text.secondary">
      Products added by salespeople
    </Typography>
    <DetailRow label="Line items" value={fmtInt(p.salespersonAddedItems)} />
    <DetailRow label="Units" value={fmtInt(p.salespersonAddedQty)} />
    <DetailRow label="Value" value={fmtMoney(p.salespersonAddedValue)} />
  </Box>
);

export default OrderAnalyticsPage;
