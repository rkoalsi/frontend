import { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, CircularProgress, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  IconButton, Divider, Chip,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../src/components/common/Header';
import AuthContext from '../../src/components/Auth';
import axiosInstance from '../../src/util/axios';
import { toast } from 'react-toastify';
import StatusChip from '../../src/components/expenses/statusChip';
import EstimateDetailDrawer from '../../src/components/expenses/EstimateDetailDrawer';
import DownloadIcon from '@mui/icons-material/Download';

const EXPENSE_TYPES = ['Travel', 'Stay', 'Other'];
const BILL_STATUSES = ['Bill Attached', 'No Bill'];

function emptyExpenseItem(index: number) {
  return {
    sl_no: index + 1, date: '', expense_type: 'Travel', description: '', location_route: '',
    amount: '', bill_status: 'No Bill', bill_no: '', tax_gst: '', daily_allowance: '', remarks: '',
    bill_url: '',
  };
}

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
  const [editExpensesOpen, setEditExpensesOpen] = useState(false);
  const [editExpensesEstimate, setEditExpensesEstimate] = useState<any>(null);
  const [editExpenseItems, setEditExpenseItems] = useState<any[]>([]);
  const [savingExpenses, setSavingExpenses] = useState(false);
  const [uploadingBill, setUploadingBill] = useState<{ [idx: number]: boolean }>({});

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

  const openEditExpenses = (est: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditExpensesEstimate(est);
    setEditExpenseItems(est.expense_items?.length ? [...est.expense_items] : [emptyExpenseItem(0)]);
    setEditExpensesOpen(true);
  };

  const updateExpenseItem = (idx: number, key: string, val: any) =>
    setEditExpenseItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const handleBillUpload = async (idx: number, file: File | undefined) => {
    if (!file) return;
    setUploadingBill(p => ({ ...p, [idx]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axiosInstance.post('/expense-estimates/upload-bill', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateExpenseItem(idx, 'bill_url', data.url);
    } catch {
      toast.error('Bill upload failed');
    } finally {
      setUploadingBill(p => ({ ...p, [idx]: false }));
    }
  };

  const handleSaveExpenses = async () => {
    setSavingExpenses(true);
    try {
      await axiosInstance.put(`/admin/expense-estimates/${editExpensesEstimate._id}`, {
        expense_items: editExpenseItems,
      });
      toast.success('Expense items updated');
      setEditExpensesOpen(false);
      fetchData(page);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    } finally {
      setSavingExpenses(false);
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
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={e => handleDownload(est, e)}
                        variant="outlined"
                      >
                        Report
                      </Button>
                      {est.status === 'Pending Payment' && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={e => openEditExpenses(est, e)}
                          variant="outlined"
                          color="warning"
                        >
                          Edit Expenses
                        </Button>
                      )}
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

      {/* Yogesh expense items edit dialog */}
      <Dialog open={editExpensesOpen} onClose={() => setEditExpensesOpen(false)} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          Edit Expense Items — {editExpensesEstimate?.created_by_name}
          <IconButton onClick={() => setEditExpensesOpen(false)} size="small" edge="end"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            {editExpenseItems.map((item: any, idx: number) => (
              <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Item #{idx + 1}</Typography>
                  {editExpenseItems.length > 1 && (
                    <IconButton size="small" color="error"
                      onClick={() => setEditExpenseItems(prev => prev.filter((_, i) => i !== idx))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                  <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                    value={item.date} onChange={e => updateExpenseItem(idx, 'date', e.target.value)} />
                  <FormControl size="small">
                    <InputLabel>Expense Type</InputLabel>
                    <Select label="Expense Type" value={item.expense_type}
                      onChange={e => updateExpenseItem(idx, 'expense_type', e.target.value)}>
                      {EXPENSE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Bill Status</InputLabel>
                    <Select label="Bill Status" value={item.bill_status}
                      onChange={e => updateExpenseItem(idx, 'bill_status', e.target.value)}>
                      {BILL_STATUSES.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="Bill No." size="small"
                    value={item.bill_no} onChange={e => updateExpenseItem(idx, 'bill_no', e.target.value)} />
                  <TextField label="Description" size="small" sx={{ gridColumn: 'span 2' }}
                    value={item.description} onChange={e => updateExpenseItem(idx, 'description', e.target.value)} />
                  <TextField label="Location / Route" size="small" sx={{ gridColumn: 'span 2' }}
                    value={item.location_route} onChange={e => updateExpenseItem(idx, 'location_route', e.target.value)} />
                  <TextField label="Amount (₹)" type="number" size="small"
                    value={item.amount} onChange={e => updateExpenseItem(idx, 'amount', e.target.value)} />
                  <TextField label="Tax / GST (₹)" type="number" size="small"
                    value={item.tax_gst} onChange={e => updateExpenseItem(idx, 'tax_gst', e.target.value)} />
                  <TextField label="Daily Allowance (₹)" type="number" size="small"
                    value={item.daily_allowance} onChange={e => updateExpenseItem(idx, 'daily_allowance', e.target.value)} />
                  <TextField label="Remarks" size="small" sx={{ gridColumn: 'span 2' }}
                    value={item.remarks} onChange={e => updateExpenseItem(idx, 'remarks', e.target.value)} />
                  {item.bill_status === 'Bill Attached' && (
                    <Box sx={{ gridColumn: { xs: 'span 2', md: 'span 3' }, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.bill_url ? (
                        <>
                          <Chip label="Bill uploaded" color="success" size="small" icon={<OpenInNewIcon />}
                            component="a" href={item.bill_url} target="_blank" clickable />
                          <Button size="small" color="error" onClick={() => updateExpenseItem(idx, 'bill_url', '')}>Remove</Button>
                        </>
                      ) : (
                        <Button component="label" size="small" variant="outlined"
                          startIcon={uploadingBill[idx] ? <CircularProgress size={14} /> : <UploadFileIcon />}
                          disabled={!!uploadingBill[idx]}>
                          {uploadingBill[idx] ? 'Uploading…' : 'Upload Bill'}
                          <input type="file" hidden accept="image/jpeg,image/png,image/jpg,application/pdf"
                            onChange={e => handleBillUpload(idx, e.target.files?.[0])} />
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}
              onClick={() => setEditExpenseItems(prev => [...prev, emptyExpenseItem(prev.length)])}>
              Add Item
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditExpensesOpen(false)} disabled={savingExpenses}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveExpenses} disabled={savingExpenses}
            startIcon={savingExpenses ? <CircularProgress size={14} color="inherit" /> : undefined}>
            Save Expenses
          </Button>
        </DialogActions>
      </Dialog>

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
