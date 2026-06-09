import {
  Box, Button, Typography, TextField, MenuItem, Select, FormControl, InputLabel,
  Stack, IconButton, Divider, CircularProgress, Alert, Chip,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axiosInstance from '../../util/axios';

const EXPENSE_TYPES = ['Travel', 'Stay', 'Other'];
const BILL_STATUSES = ['Bill Attached', 'No Bill'];

function emptyActualItem(index: number) {
  return {
    sl_no: index + 1, date: '', expense_type: 'Travel', description: '', location_route: '',
    amount: '', bill_status: 'No Bill', bill_no: '', tax_gst: '', daily_allowance: '',
    da_date: '', remarks: '', approved_amount: '', bill_url: '',
  };
}

interface Props {
  estimate: any;
  onSuccess: () => void;
}

export default function ActualsForm({ estimate, onSuccess }: Props) {
  const [actualItems, setActualItems] = useState<any[]>(
    estimate.actual_expense_items?.length
      ? estimate.actual_expense_items
      : [emptyActualItem(0)]
  );
  const [customerVisits, setCustomerVisits] = useState<any[]>(estimate.customer_visits || []);
  const [actualExisting, setActualExisting] = useState(String(estimate.actual_existing_visits || ''));
  const [actualNew, setActualNew] = useState(String(estimate.actual_new_visits || ''));
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (idx: number, key: string, val: any) =>
    setActualItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const [uploadingBill, setUploadingBill] = useState<{ [idx: number]: boolean }>({});
  const handleBillUpload = async (idx: number, file: File | undefined) => {
    if (!file) return;
    setUploadingBill(p => ({ ...p, [idx]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axiosInstance.post('/expense-estimates/upload-bill', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateItem(idx, 'bill_url', data.url);
    } catch {
      toast.error('Bill upload failed');
    } finally {
      setUploadingBill(p => ({ ...p, [idx]: false }));
    }
  };

  const addItem = () => setActualItems(prev => [...prev, emptyActualItem(prev.length)]);
  const removeItem = (idx: number) => setActualItems(prev => prev.filter((_, i) => i !== idx));

  const updateVisit = (idx: number, key: string, val: any) =>
    setCustomerVisits(prev => prev.map((v, i) => i === idx ? { ...v, [key]: val } : v));

  const actualTravel = actualItems.filter(i => i.expense_type === 'Travel').reduce((s, i) => s + parseFloat(i.amount || '0'), 0);
  const actualStay = actualItems.filter(i => i.expense_type === 'Stay').reduce((s, i) => s + parseFloat(i.amount || '0'), 0);
  const actualDA = actualItems.reduce((s, i) => s + parseFloat(i.daily_allowance || '0'), 0);
  const actualTotal = actualTravel + actualStay + actualDA;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post(`/expense-estimates/${estimate._id}/submit-actuals`, {
        actual_expense_items: actualItems,
        customer_visits: customerVisits,
        actual_existing_visits: parseInt(actualExisting) || 0,
        actual_new_visits: parseInt(actualNew) || 0,
      });
      toast.success('Actual expenses submitted!');
      onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        You are back from your trip. Please fill in your actual expenses and update the customer visit outcomes below.
      </Alert>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Actual Expense Items</Typography>
      <Stack gap={2}>
        {actualItems.map((item, idx) => (
          <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Item #{idx + 1}</Typography>
              {actualItems.length > 1 && (
                <IconButton size="small" color="error" onClick={() => removeItem(idx)}><DeleteIcon fontSize="small" /></IconButton>
              )}
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                value={item.date} onChange={e => updateItem(idx, 'date', e.target.value)} />
              <FormControl size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select label="Expense Type" value={item.expense_type} onChange={e => updateItem(idx, 'expense_type', e.target.value)}>
                  {EXPENSE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Bill Status</InputLabel>
                <Select label="Bill Status" value={item.bill_status} onChange={e => updateItem(idx, 'bill_status', e.target.value)}>
                  {BILL_STATUSES.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Description" size="small"
                value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
              <TextField label="Location / Route" size="small"
                value={item.location_route} onChange={e => updateItem(idx, 'location_route', e.target.value)} />
              <TextField label="Bill No." size="small"
                value={item.bill_no} onChange={e => updateItem(idx, 'bill_no', e.target.value)} />
              <TextField label="Amount (₹)" type="number" size="small"
                value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} />
              <TextField label="Tax / GST (₹)" type="number" size="small"
                value={item.tax_gst} onChange={e => updateItem(idx, 'tax_gst', e.target.value)} />
              <TextField label="Daily Allowance (₹)" type="number" size="small"
                value={item.daily_allowance} onChange={e => updateItem(idx, 'daily_allowance', e.target.value)} />
              <TextField label="DA Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                value={item.da_date} onChange={e => updateItem(idx, 'da_date', e.target.value)} />
              <TextField label="Remarks" size="small"
                value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} />
              {item.bill_status === 'Bill Attached' && (
                <Box sx={{ gridColumn: { sm: 'span 3' }, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.bill_url ? (
                    <>
                      <Chip
                        label="Bill uploaded"
                        color="success"
                        size="small"
                        icon={<OpenInNewIcon />}
                        component="a"
                        href={item.bill_url}
                        target="_blank"
                        clickable
                      />
                      <Button size="small" color="error" onClick={() => updateItem(idx, 'bill_url', '')}>Remove</Button>
                    </>
                  ) : (
                    <Button
                      component="label"
                      size="small"
                      variant="outlined"
                      startIcon={uploadingBill[idx] ? <CircularProgress size={14} /> : <UploadFileIcon />}
                      disabled={!!uploadingBill[idx]}
                    >
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
        <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
          Add Item
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, mb: 3 }}>
        {[['Travel', actualTravel], ['Stay', actualStay], ['DA', actualDA], ['Total', actualTotal]].map(([label, val]) => (
          <Box key={String(label)} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={700}>₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Visit Actuals</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2, maxWidth: 400 }}>
        <TextField label="Actual Existing Visits" type="number" size="small"
          value={actualExisting} onChange={e => setActualExisting(e.target.value)} />
        <TextField label="Actual New/Prospect Visits" type="number" size="small"
          value={actualNew} onChange={e => setActualNew(e.target.value)} />
      </Box>

      {customerVisits.length > 0 && (
        <Stack gap={2}>
          <Typography variant="subtitle2">Update Visit Outcomes</Typography>
          {customerVisits.map((v, idx) => (
            <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {v.customer_name || v.potential_customer_name || `Visit #${idx + 1}`} — {v.city}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <TextField label="Outcome / Next Action" size="small"
                  value={v.outcome || ''} onChange={e => updateVisit(idx, 'outcome', e.target.value)} />
                <TextField label="Follow-up Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                  value={v.follow_up_date || ''} onChange={e => updateVisit(idx, 'follow_up_date', e.target.value)} />
                <TextField label="Order Value (₹)" type="number" size="small"
                  value={v.order_value || ''} onChange={e => updateVisit(idx, 'order_value', e.target.value)} />
                <TextField label="Notes" size="small"
                  value={v.notes || ''} onChange={e => updateVisit(idx, 'notes', e.target.value)} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}>
          Submit Actual Expenses
        </Button>
      </Stack>
    </Box>
  );
}
