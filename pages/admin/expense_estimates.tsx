import { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, CircularProgress, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Header from '../../src/components/common/Header';
import AuthContext from '../../src/components/Auth';
import axiosInstance from '../../src/util/axios';
import { toast } from 'react-toastify';
import StatusChip from '../../src/components/expenses/statusChip';
import EstimateDetailDrawer from '../../src/components/expenses/EstimateDetailDrawer';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

const ALL_STATUSES = ['Pending Review', 'Pending Second Review', 'Pending Payment', 'Draft', 'Submitted', 'Completed', 'Rejected'];

function getComments(est: any): { label: string; text: string }[] {
  const out = [];
  if (est.rahul_remarks) out.push({ label: 'Rahul', text: est.rahul_remarks });
  if (est.amit_remarks) out.push({ label: 'Amit', text: est.amit_remarks });
  if (est.yogesh_remarks) out.push({ label: 'Yogesh', text: est.yogesh_remarks });
  if (est.rejection_reason) out.push({ label: 'Rejected', text: est.rejection_reason });
  return out;
}
const PAGE_SIZE = 20;

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (v: any) =>
  v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : '—';

export default function AdminExpenseEstimates() {
  const { user } = useContext(AuthContext) as any;
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salespersonOptions, setSalespersonOptions] = useState<any[]>([]);
  const [salespersonFilter, setSalespersonFilter] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSalespeople = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/salespeople');
      setSalespersonOptions(data?.salespeople || data || []);
    } catch { /* silent */ }
  };

  const fetchData = async (pg = page) => {
    setLoading(true);
    try {
      const params: any = { page: pg, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (salespersonFilter?._id) params.salesperson_id = salespersonFilter._id;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const { data } = await axiosInstance.get('/admin/expense-estimates', { params });
      setEstimates(data.estimates || []);
      setTotalCount(data.total_count || 0);
    } catch {
      toast.error('Failed to load expense estimates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalespeople(); }, []);
  useEffect(() => { fetchData(0); setPage(0); }, [statusFilter, salespersonFilter, startDate, endDate]);
  useEffect(() => { fetchData(page); }, [page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/expense-estimates/${deleteTarget._id}`);
      toast.success('Estimate deleted');
      setDeleteTarget(null);
      fetchData(page);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (est: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.get(`/admin/expense-estimates/${est._id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_Report_${est.created_by_name}_${est.travel_start_date?.slice(0, 10) ?? ''}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const openDetail = async (est: any) => {
    setSelectedEstimate(est);
    setDrawerOpen(true);
    try {
      const { data } = await axiosInstance.get(`/admin/expense-estimates/${est._id}`);
      setSelectedEstimate(data);
    } catch { /* keep stale data if refresh fails */ }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Header title="Expense Estimates" showBackButton backUrl="/admin" />
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Expense Estimates</Typography>

      {/* Filters */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {ALL_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          options={salespersonOptions}
          getOptionLabel={(o: any) => o.name || o.email || ''}
          value={salespersonFilter}
          onChange={(_, v) => setSalespersonFilter(v)}
          renderInput={params => <TextField {...params} label="Salesperson" />}
        />
        <TextField label="Trip Start From" type="date" size="small"
          InputLabelProps={{ shrink: true }} value={startDate} onChange={e => setStartDate(e.target.value)} />
        <TextField label="Trip Start To" type="date" size="small"
          InputLabelProps={{ shrink: true }} value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Button variant="outlined" size="small" onClick={() => {
          setStatusFilter(''); setSalespersonFilter(null); setStartDate(''); setEndDate('');
        }}>Clear Filters</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Salesperson', 'Trip Dates', 'Locations', 'Est. Total', 'Advance', 'Status', 'Submitted', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {estimates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No expense estimates found
                  </TableCell>
                </TableRow>
              ) : estimates.map((est: any) => (
                <TableRow
                  key={est._id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openDetail(est)}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{est.created_by_name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(est.travel_start_date)} → {fmt(est.travel_end_date)}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {est.locations_visited}
                  </TableCell>
                  <TableCell>{fmtMoney(est.estimated_total)}</TableCell>
                  <TableCell>{fmtMoney(est.advance_requested)}</TableCell>
                  <TableCell>
                    <StatusChip status={est.status} />
                    {getComments(est).map(c => (
                      <Tooltip key={c.label} title={c.text} arrow placement="right">
                        <Stack direction="row" gap={0.5} alignItems="center" sx={{ mt: 0.5, cursor: 'default' }}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                            <strong>{c.label}:</strong> {c.text}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    ))}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(est.created_at)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Stack direction="row" gap={0.5}>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={e => handleDownload(est, e)}
                        variant="outlined"
                      >
                        Report
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={e => { e.stopPropagation(); setDeleteTarget(est); }}
                        variant="outlined"
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </Box>
      )}

      <EstimateDetailDrawer
        open={drawerOpen}
        estimate={selectedEstimate}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => fetchData(page)}
        isAdmin={true}
        adminEmail={user?.email}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Expense Estimate?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently delete the expense estimate for <strong>{deleteTarget?.created_by_name}</strong> (trip on {deleteTarget?.travel_start_date?.slice(0, 10) ?? '—'}). This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
