import {
  Box, Button, Typography, TextField, MenuItem, Select, FormControl, InputLabel,
  Stepper, Step, StepLabel, Stack, IconButton, Divider, Autocomplete, CircularProgress,
  FormControlLabel, Checkbox, Chip, Alert,
} from '@mui/material';
import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axiosInstance from '../../util/axios';
import AuthContext from '../Auth';

const EXPENSE_TYPES = ['Travel', 'Stay', 'Other'];
const TRAVEL_MODES = ['Train', 'Flight', 'Road', 'Train + Road', 'Flight + Road', 'Multiple'];
const BILL_STATUSES = ['Bill Attached', 'No Bill'];
const CUSTOMER_STATUSES = ['Existing Customer', 'New / Prospect Customer'];

function emptyExpenseItem(index: number) {
  return {
    sl_no: index + 1, date: '', expense_type: 'Travel', description: '', location_route: '',
    amount: '', bill_status: 'No Bill', bill_no: '', tax_gst: '', daily_allowance: '', da_date: '', remarks: '',
    bill_url: '',
  };
}

function emptyVisit() {
  return {
    date: '', customer_type: 'existing', customer_id: '', customer_name: '', address_id: '', address_label: '',
    potential_customer_id: '', potential_customer_name: '',
    city: '', customer_status: 'Existing Customer', current_yr_sales: '', fy_2025_sales: '',
    fy_2024_sales: '', outstanding_balance: '', purpose_of_visit: '', outcome: '',
    follow_up_date: '', order_value: '', notes: '',
  };
}

const STEPS = ['Trip Information', 'Planned Customer Visits', 'Estimated Expenses'];

interface Props {
  onSuccess: () => void;
  userInfo: any;
}

export default function EstimateForm({ onSuccess, userInfo }: Props) {
  const { user } = useContext(AuthContext) as any;
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [employeeInfoLoading, setEmployeeInfoLoading] = useState(true);

  // Step 1 — read-only fields fetched from backend
  const [employeeInfo, setEmployeeInfo] = useState({
    name: '', employee_id: '', designation: '', department: '',
  });
  const [tripInfo, setTripInfo] = useState({
    travel_start_date: '',
    travel_end_date: '',
    purpose_of_trip: '',
    locations_visited: '',
    mode_of_travel: 'Train',
    reporting_manager: '',
    current_location: '',
  });
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    axiosInstance.get('/expense-estimates/employee-info')
      .then(({ data }) => {
        setEmployeeInfo({
          name: data.name || '',
          employee_id: data.employee_id || '',
          designation: data.designation || '',
          department: data.department || '',
        });
        setTripInfo(p => ({
          ...p,
          reporting_manager: data.reporting_manager || '',
          current_location: data.current_location || '',
        }));
      })
      .catch((err) => { console.error('employee-info fetch failed', err); })
      .finally(() => setEmployeeInfoLoading(false));
  }, []);

  // Step 2
  const [expenseItems, setExpenseItems] = useState([emptyExpenseItem(0)]);
  const [advanceRequested, setAdvanceRequested] = useState('');

  // Step 3
  const [customerVisits, setCustomerVisits] = useState([emptyVisit()]);
  const [plannedExisting, setPlannedExisting] = useState('');
  const [plannedNew, setPlannedNew] = useState('');

  // Customer search helpers
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [potentialOptions, setPotentialOptions] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState<{ [idx: number]: string }>({});
  const [potentialSearch, setPotentialSearch] = useState<{ [idx: number]: string }>({});
  const [createNewPotential, setCreateNewPotential] = useState<{ [idx: number]: boolean }>({});
  const [newPotentialName, setNewPotentialName] = useState<{ [idx: number]: string }>({});
  const [newPotentialData, setNewPotentialData] = useState<{ [idx: number]: { address?: string; tier?: string } }>({});

  useEffect(() => {
    // Pre-fill planned counts from visit entries
    const existing = customerVisits.filter(v => v.customer_type === 'existing').length;
    const potential = customerVisits.filter(v => v.customer_type !== 'existing').length;
    setPlannedExisting(String(existing));
    setPlannedNew(String(potential));
  }, [customerVisits.length]);

  const fetchCustomers = async (query: string) => {
    if (!query || query.length < 2) return;
    try {
      const { data } = await axiosInstance.get(`/customers`, { params: { search: query, limit: 20 } });
      setCustomerOptions(data?.customers || data || []);
    } catch { /* silent */ }
  };

  const fetchPotentialCustomers = async (query?: string) => {
    try {
      const params = query && query.length >= 2 ? { search: query } : {};
      const { data } = await axiosInstance.get(`/potential_customers`, { params });
      setPotentialOptions(Array.isArray(data) ? data : []);
    } catch (err) { console.error('potential customers fetch failed', err); }
  };

  // ── Trip Info validation ───────────────────────────────────────────────────
  const validateTripInfo = () => {
    if (!tripInfo.travel_start_date || !tripInfo.travel_end_date) {
      toast.error('Travel dates are required'); return false;
    }
    const start = new Date(tripInfo.travel_start_date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysAhead = Math.floor((start.getTime() - today.getTime()) / 86400000);
    if (daysAhead < 10) {
      setDateError('Estimate must be submitted at least 10 days before travel start date.');
      return false;
    }
    setDateError('');
    if (!tripInfo.purpose_of_trip) { toast.error('Purpose of trip is required'); return false; }
    if (!tripInfo.locations_visited) { toast.error('Locations visited is required'); return false; }
    return true;
  };

  // ── Expense items helpers ─────────────────────────────────────────────────
  const [daWarnings, setDaWarnings] = useState<{ [idx: number]: string }>({});
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

  const updateItem = (idx: number, key: string, val: any) => {
    setExpenseItems(prev => {
      const updated = prev.map((it, i) => i === idx ? { ...it, [key]: val } : it);
      // DA duplicate check
      if (key === 'daily_allowance' || key === 'da_date') {
        const item = updated[idx];
        const daDate = key === 'da_date' ? val : item.da_date;
        const daAmt = key === 'daily_allowance' ? val : item.daily_allowance;
        if (daDate && parseFloat(daAmt) > 0) {
          const conflict = updated.some((it, i) => i !== idx && it.da_date === daDate && parseFloat(it.daily_allowance || '0') > 0);
          setDaWarnings(w => ({ ...w, [idx]: conflict ? `DA already claimed for ${daDate}` : '' }));
        } else {
          setDaWarnings(w => ({ ...w, [idx]: '' }));
        }
      }
      return updated;
    });
  };

  const addItem = () => setExpenseItems(prev => [...prev, emptyExpenseItem(prev.length)]);
  const removeItem = (idx: number) => setExpenseItems(prev => prev.filter((_, i) => i !== idx));

  const estimatedTravel = expenseItems.filter(i => i.expense_type === 'Travel').reduce((s, i) => s + parseFloat(i.amount || '0'), 0);
  const estimatedStay = expenseItems.filter(i => i.expense_type === 'Stay').reduce((s, i) => s + parseFloat(i.amount || '0'), 0);
  const estimatedDA = expenseItems.reduce((s, i) => s + parseFloat(i.daily_allowance || '0'), 0);
  const estimatedTotal = estimatedTravel + estimatedStay + estimatedDA;

  // ── Visit helpers ─────────────────────────────────────────────────────────
  const updateVisit = (idx: number, key: string, val: any) =>
    setCustomerVisits(prev => prev.map((v, i) => i === idx ? { ...v, [key]: val } : v));

  const addVisit = () => setCustomerVisits(prev => [...prev, emptyVisit()]);
  const removeVisit = (idx: number) => setCustomerVisits(prev => prev.filter((_, i) => i !== idx));

  const handleCustomerSelect = (idx: number, customer: any) => {
    if (!customer) return;
    // Use Zoho contact_id so invoice lookups work; fall back to MongoDB _id
    updateVisit(idx, 'customer_id', customer.contact_id || customer._id);
    updateVisit(idx, 'customer_name', customer.contact_name || customer.customer_name || customer.name || '');
    updateVisit(idx, 'city', customer.billing_address?.city || '');
    updateVisit(idx, '_addresses', customer.addresses || []);
    updateVisit(idx, '_billingAddress', customer.billing_address || {});
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const activeDaWarnings = Object.values(daWarnings).some(w => !!w);
    if (activeDaWarnings) {
      toast.error('Please resolve duplicate Daily Allowance entries before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      // Create any new potential customers inline
      const processedVisits = await Promise.all(customerVisits.map(async (v, idx) => {
        if (v.customer_type === 'potential' && createNewPotential[idx] && newPotentialName[idx]) {
          const { data } = await axiosInstance.post('/potential_customers', {
            name: newPotentialName[idx],
            address: newPotentialData[idx]?.address || v.city || '',
            tier: newPotentialData[idx]?.tier || 'B',
            created_by: user?._id,
            status: 'New',
          });
          return { ...v, potential_customer_id: data._id || '', potential_customer_name: newPotentialName[idx] };
        }
        return v;
      }));

      await axiosInstance.post('/expense-estimates', {
        ...employeeInfo,
        ...tripInfo,
        expense_items: expenseItems,
        advance_requested: parseFloat(advanceRequested) || 0,
        customer_visits: processedVisits,
        planned_existing_visits: parseInt(plannedExisting) || 0,
        planned_new_visits: parseInt(plannedNew) || 0,
      });
      toast.success('Expense estimate submitted!');
      onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateTripInfo()) return;
    setActiveStep(s => s + 1);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* Step 1 – Trip Info */}
      {activeStep === 0 && (
        <Stack gap={2}>
          {employeeInfoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
          ) : (
            <>
              <Typography variant="subtitle2" color="text.secondary">Employee Details (read-only)</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Employee Name" value={employeeInfo.name} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Employee ID" value={employeeInfo.employee_id} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Designation" value={employeeInfo.designation} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Department" value={employeeInfo.department} size="small" InputProps={{ readOnly: true }} />
                <TextField
                  label="Reporting Manager"
                  value={tripInfo.reporting_manager}
                  onChange={e => setTripInfo(p => ({ ...p, reporting_manager: e.target.value }))}
                  size="small"
                />
                <TextField
                  label="Current Location / Base City"
                  value={tripInfo.current_location}
                  onChange={e => setTripInfo(p => ({ ...p, current_location: e.target.value }))}
                  size="small"
                />
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Trip Details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl size="small">
                  <InputLabel>Mode of Travel</InputLabel>
                  <Select label="Mode of Travel" value={tripInfo.mode_of_travel} onChange={e => setTripInfo(p => ({ ...p, mode_of_travel: e.target.value }))}>
                    {TRAVEL_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  label="Travel Start Date" type="date" InputLabelProps={{ shrink: true }}
                  value={tripInfo.travel_start_date}
                  onChange={e => { setTripInfo(p => ({ ...p, travel_start_date: e.target.value })); setDateError(''); }}
                  size="small" error={!!dateError}
                />
                <TextField
                  label="Travel End Date" type="date" InputLabelProps={{ shrink: true }}
                  value={tripInfo.travel_end_date}
                  onChange={e => setTripInfo(p => ({ ...p, travel_end_date: e.target.value }))}
                  size="small"
                />
              </Box>
              {dateError && <Alert severity="error">{dateError}</Alert>}
              <TextField
                label="Purpose of Trip"
                value={tripInfo.purpose_of_trip}
                onChange={e => setTripInfo(p => ({ ...p, purpose_of_trip: e.target.value }))}
                size="small" fullWidth
              />
              <TextField
                label="Locations Visited (comma separated)"
                value={tripInfo.locations_visited}
                onChange={e => setTripInfo(p => ({ ...p, locations_visited: e.target.value }))}
                size="small" fullWidth
              />
            </>
          )}
        </Stack>
      )}

      {/* Step 2 – Customer Visits */}
      {activeStep === 1 && (
        <Stack gap={2}>
          <Typography variant="body2" color="text.secondary">
            Pre-fill the customers you plan to visit. Actual outcomes can be updated after you return.
          </Typography>
          {customerVisits.map((visit, idx) => (
            <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2">Visit #{idx + 1}</Typography>
                {customerVisits.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => removeVisit(idx)}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <TextField label="Planned Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                  value={visit.date} onChange={e => updateVisit(idx, 'date', e.target.value)} />
                <FormControl size="small">
                  <InputLabel>Customer Type</InputLabel>
                  <Select label="Customer Type" value={visit.customer_type}
                    onChange={e => updateVisit(idx, 'customer_type', e.target.value)}>
                    <MenuItem value="existing">Existing Customer</MenuItem>
                    <MenuItem value="potential">New / Potential Customer</MenuItem>
                  </Select>
                </FormControl>

                {/* Existing customer flow */}
                {visit.customer_type === 'existing' && (
                  <>
                    <Autocomplete
                      size="small"
                      options={customerOptions}
                      getOptionLabel={(o: any) => o.contact_name || o.customer_name || o.name || ''}
                      onInputChange={(_, v) => { setCustomerSearch(p => ({ ...p, [idx]: v })); fetchCustomers(v); }}
                      onChange={(_, v) => handleCustomerSelect(idx, v)}
                      renderInput={params => <TextField {...params} label="Search Customer" />}
                      sx={{ gridColumn: 'span 2' }}
                    />
                    {(visit as any)._addresses?.length > 0 && (
                      <FormControl size="small">
                        <InputLabel>Address</InputLabel>
                        <Select label="Address" value={visit.address_id}
                          onChange={e => {
                            const addr = (visit as any)._addresses.find((a: any) => a.address_id === e.target.value);
                            updateVisit(idx, 'address_id', e.target.value);
                            updateVisit(idx, 'address_label', addr ? [addr.address, addr.city, addr.state].filter(Boolean).join(', ') : '');
                            updateVisit(idx, 'city', addr?.city || visit.city);
                          }}>
                          {(visit as any)._addresses.map((a: any) => (
                            <MenuItem key={a.address_id} value={a.address_id}>
                              {[a.attention, a.address, a.city, a.state].filter(Boolean).join(', ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <FormControl size="small">
                      <InputLabel>Customer Status</InputLabel>
                      <Select label="Customer Status" value={visit.customer_status}
                        onChange={e => updateVisit(idx, 'customer_status', e.target.value)}>
                        {CUSTOMER_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </>
                )}

                {/* Potential customer flow */}
                {visit.customer_type === 'potential' && (
                  <>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={!!createNewPotential[idx]}
                        onChange={e => setCreateNewPotential(p => ({ ...p, [idx]: e.target.checked }))} />}
                      label={<Typography variant="body2">Create new potential customer</Typography>}
                      sx={{ gridColumn: 'span 2' }}
                    />
                    {createNewPotential[idx] ? (
                      <>
                        <TextField label="Customer Name" size="small" required
                          value={newPotentialName[idx] || ''}
                          onChange={e => setNewPotentialName(p => ({ ...p, [idx]: e.target.value }))} />
                        <TextField label="Address" size="small"
                          value={(newPotentialData[idx]?.address) || ''}
                          onChange={e => setNewPotentialData(p => ({ ...p, [idx]: { ...p[idx], address: e.target.value } }))} />
                        <FormControl size="small">
                          <InputLabel>Tier</InputLabel>
                          <Select label="Tier" value={(newPotentialData[idx]?.tier) || 'B'}
                            onChange={e => setNewPotentialData(p => ({ ...p, [idx]: { ...p[idx], tier: e.target.value } }))}>
                            <MenuItem value="A">A</MenuItem>
                            <MenuItem value="B">B</MenuItem>
                            <MenuItem value="C">C</MenuItem>
                          </Select>
                        </FormControl>
                      </>
                    ) : (
                      <Autocomplete
                        size="small"
                        options={potentialOptions}
                        getOptionLabel={(o: any) => o.name || ''}
                        filterOptions={(x) => x}
                        onOpen={() => fetchPotentialCustomers()}
                        onInputChange={(_, v) => { setPotentialSearch(p => ({ ...p, [idx]: v })); fetchPotentialCustomers(v); }}
                        onChange={(_, v) => {
                          if (v) {
                            updateVisit(idx, 'potential_customer_id', v._id);
                            updateVisit(idx, 'potential_customer_name', v.name);
                            updateVisit(idx, 'city', v.address || '');
                          }
                        }}
                        renderInput={params => <TextField {...params} label="Search Potential Customer" />}
                        sx={{ gridColumn: 'span 2' }}
                      />
                    )}
                  </>
                )}

                <TextField label="City" size="small" value={visit.city}
                  onChange={e => updateVisit(idx, 'city', e.target.value)} />
                <TextField label="Purpose of Visit" size="small" value={visit.purpose_of_visit}
                  onChange={e => updateVisit(idx, 'purpose_of_visit', e.target.value)} />
                <TextField label="Notes" size="small" value={visit.notes}
                  onChange={e => updateVisit(idx, 'notes', e.target.value)} />
              </Box>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addVisit} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
            Add Visit
          </Button>
          <Divider />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 400 }}>
            <TextField label="Planned Existing Visits" type="number" size="small"
              value={plannedExisting} onChange={e => setPlannedExisting(e.target.value)} />
            <TextField label="Planned New/Prospect Visits" type="number" size="small"
              value={plannedNew} onChange={e => setPlannedNew(e.target.value)} />
          </Box>
        </Stack>
      )}

      {/* Step 3 – Estimated Expenses */}
      {activeStep === 2 && (
        <Stack gap={2}>
          {expenseItems.map((item, idx) => (
            <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Item #{idx + 1}</Typography>
                {expenseItems.length > 1 && (
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
                <TextField label="Description / Particulars" size="small"
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
                  value={item.daily_allowance} onChange={e => updateItem(idx, 'daily_allowance', e.target.value)}
                  error={!!daWarnings[idx]}
                  helperText={daWarnings[idx] || "DA = ₹1500/day"} />
                <TextField label="DA Date" type="date" InputLabelProps={{ shrink: true }} size="small"
                  value={item.da_date} onChange={e => updateItem(idx, 'da_date', e.target.value)}
                  error={!!daWarnings[idx]}
                  helperText={daWarnings[idx] || ''} />
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
            Add Expense Item
          </Button>
          <Divider />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1 }}>
            {[['Travel', estimatedTravel], ['Stay', estimatedStay], ['DA', estimatedDA], ['Total', estimatedTotal]].map(([label, val]) => (
              <Box key={String(label)} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700}>₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            ))}
          </Box>
          <TextField
            label="Advance Requested (₹)" type="number" size="small" sx={{ maxWidth: 250 }}
            value={advanceRequested} onChange={e => setAdvanceRequested(e.target.value)}
          />
        </Stack>
      )}

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button onClick={() => setActiveStep(s => s - 1)} disabled={activeStep === 0}>Back</Button>
        {activeStep < STEPS.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>Next</Button>
        ) : (
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}>
            Submit Estimate
          </Button>
        )}
      </Stack>
    </Box>
  );
}
