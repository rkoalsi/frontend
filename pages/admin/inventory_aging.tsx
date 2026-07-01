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
  Checkbox,
  Tabs,
  Tab,
  Chip,
  Avatar,
  InputAdornment,
  Stack,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LocalOffer as LocalOfferIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const SPECIAL_OFFERS_ICON =
  'https://assets.pupscribe.in/assets/special_offers.png';

interface AgingRow {
  product_id: string;
  item_id: string;
  name: string;
  brand: string;
  image: string | null;
  mrp: number;
  stock: number;
  status: string;
  aging_qty: number;
  clearance: boolean;
  clearance_margin: number | null;
}

interface ReportResponse {
  to_date: string;
  slow_movers: AgingRow[];
  dead_stock: AgingRow[];
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const InventoryAgingPage = () => {
  const [date, setDate] = useState<string>(todayStr());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [tab, setTab] = useState(0); // 0 = slow movers, 1 = dead stock

  // Selection + bulk margin are kept per-tab so the two tabs don't interfere.
  const [selectedSlow, setSelectedSlow] = useState<Set<string>>(new Set());
  const [selectedDead, setSelectedDead] = useState<Set<string>>(new Set());
  const [marginSlow, setMarginSlow] = useState<string>('');
  const [marginDead, setMarginDead] = useState<string>('');
  const [applying, setApplying] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const rows: AgingRow[] = useMemo(() => {
    if (!report) return [];
    return tab === 0 ? report.slow_movers : report.dead_stock;
  }, [report, tab]);

  // Brand options for the current tab, sorted alphabetically.
  const brandOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.brand).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  // Status options for the current tab, sorted alphabetically.
  const statusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!brandFilter || r.brand === brandFilter) &&
          (!statusFilter || r.status === statusFilter)
      ),
    [rows, brandFilter, statusFilter]
  );

  const selected = tab === 0 ? selectedSlow : selectedDead;
  const setSelected = tab === 0 ? setSelectedSlow : setSelectedDead;
  const margin = tab === 0 ? marginSlow : marginDead;
  const setMargin = tab === 0 ? setMarginSlow : setMarginDead;

  const fetchReport = async () => {
    if (!date) {
      toast.error('Please pick a date.');
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/inventory_aging/report', {
        params: { to_date: date },
      });
      setReport(res.data);
      setSelectedSlow(new Set());
      setSelectedDead(new Set());
      setMarginSlow('');
      setMarginDead('');
      setBrandFilter('');
      setStatusFilter('');
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail ||
          'Failed to load slow movers / dead stock report.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    const visibleIds = filteredRows.map((r) => r.product_id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allVisibleSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelected(next);
  };

  const applyBulk = async (clearance: boolean) => {
    if (selected.size === 0) {
      toast.error('Select at least one product.');
      return;
    }
    let clearance_margin: number | undefined;
    if (clearance) {
      const m = Number(margin);
      if (margin === '' || Number.isNaN(m) || m < 0 || m > 100) {
        toast.error('Enter a sale margin between 0 and 100.');
        return;
      }
      clearance_margin = m;
    } else {
      clearance_margin = 0; // clear margin when removing
    }
    try {
      setApplying(true);
      const body: any = {
        product_ids: Array.from(selected),
        clearance,
        clearance_margin,
      };
      const res = await axiosInstance.post(
        '/admin/inventory_aging/bulk_clearance',
        body
      );
      toast.success(
        clearance
          ? `Put ${res.data.modified} product(s) on Special Offers.`
          : `Removed ${res.data.modified} product(s) from Special Offers.`
      );
      // Reflect the change locally so the chips update without a refetch.
      setReport((prev) => {
        if (!prev) return prev;
        const apply = (list: AgingRow[]) =>
          list.map((r) =>
            selected.has(r.product_id)
              ? { ...r, clearance, clearance_margin: clearance_margin ?? null }
              : r
          );
        return {
          ...prev,
          slow_movers: apply(prev.slow_movers),
          dead_stock: apply(prev.dead_stock),
        };
      });
      setSelected(new Set());
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || 'Failed to update Special Offers.'
      );
    } finally {
      setApplying(false);
    }
  };

  const visibleSelectedCount = filteredRows.filter((r) =>
    selected.has(r.product_id)
  ).length;
  const allChecked =
    filteredRows.length > 0 && visibleSelectedCount === filteredRows.length;
  const someChecked =
    visibleSelectedCount > 0 && visibleSelectedCount < filteredRows.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Box
          component="img"
          src={SPECIAL_OFFERS_ICON}
          alt="Special Offers"
          sx={{ width: 40, height: 40, objectFit: 'contain' }}
        />
        <Typography variant="h5" fontWeight={700}>
          Slow Movers &amp; Dead Stock
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Pick a date to pull the inventory aging report from Zoho. Slow Movers are
        items aged 121–180 days; Dead Stock is aged over 180 days. Select items
        and put them on Special Offers with a bulk sale margin.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              type="date"
              label="As of date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayStr() }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <Button
              variant="contained"
              onClick={fetchReport}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : undefined
              }
            >
              {loading ? 'Loading…' : 'Submit'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setBrandFilter('');
              setStatusFilter('');
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Slow Movers (${report.slow_movers.length})`} />
            <Tab label={`Dead Stock (${report.dead_stock.length})`} />
          </Tabs>

          <CardContent>
            {/* Brand filter */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Filter by Brand</InputLabel>
                <Select
                  label="Filter by Brand"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Brands</em>
                  </MenuItem>
                  {brandOptions.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Statuses</em>
                  </MenuItem>
                  {statusOptions.map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredRows.length} of {rows.length}
              </Typography>
            </Stack>

            {/* Bulk action bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <Chip
                icon={<LocalOfferIcon />}
                label={`${selected.size} selected`}
                color={selected.size > 0 ? 'primary' : 'default'}
                variant="outlined"
              />
              <TextField
                type="number"
                size="small"
                label="Additional Sale Margin"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100 },
                }}
                helperText="Added on top of customer margin"
                sx={{ width: 220 }}
              />
              <Button
                variant="contained"
                disabled={applying || selected.size === 0}
                onClick={() => applyBulk(true)}
              >
                Put on Special Offers
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={applying || selected.size === 0}
                onClick={() => applyBulk(false)}
              >
                Remove from Special Offers
              </Button>
            </Stack>

            {filteredRows.length === 0 ? (
              <Alert severity="info">
                No {tab === 0 ? 'slow movers' : 'dead stock'} found
                {brandFilter || statusFilter
                  ? ' matching the selected filters'
                  : ' for this date'}
                .
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={toggleAll}
                        />
                      </TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aging Qty</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">MRP</TableCell>
                      <TableCell>Special Offers</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((r) => {
                      const isSel = selected.has(r.product_id);
                      return (
                        <TableRow
                          key={r.product_id}
                          hover
                          selected={isSel}
                          onClick={() => toggleRow(r.product_id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSel} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                variant="rounded"
                                src={r.image || undefined}
                                sx={{ width: 40, height: 40, bgcolor: '#fff' }}
                              >
                                {r.name?.[0] || '?'}
                              </Avatar>
                              <Typography variant="body2">{r.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{r.brand}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant={r.status === 'active' ? 'filled' : 'outlined'}
                              color={r.status === 'active' ? 'success' : 'default'}
                              label={r.status || 'unknown'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right">{r.aging_qty}</TableCell>
                          <TableCell align="right">{r.stock}</TableCell>
                          <TableCell align="right">
                            {r.mrp ? `₹${r.mrp}` : '—'}
                          </TableCell>
                          <TableCell>
                            {r.clearance ? (
                              <Tooltip
                                title={`+${r.clearance_margin ?? 0}% sale margin`}
                              >
                                <Chip
                                  size="small"
                                  color="error"
                                  label={`On Offer +${r.clearance_margin ?? 0}%`}
                                />
                              </Tooltip>
                            ) : (
                              <Chip size="small" variant="outlined" label="—" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InventoryAgingPage;
