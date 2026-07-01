import {
  Drawer, Box, Typography, Divider, Chip, Stack, Button, Link, IconButton,
  CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../util/axios';
import StatusChip from './statusChip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (v: any) =>
  v != null && v !== '' ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

function LabelValue({ label, value }: { label: string; value: any }) {
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
      {children}
    </Typography>
  );
}

interface Props {
  open: boolean;
  estimate: any;
  onClose: () => void;
  onRefresh: () => void;
  isAdmin?: boolean;
  adminEmail?: string;
}

const APPROVER_CHAIN = [
  { email: 'events@barkbutler.in', stage: 'Pending Review', label: 'Rahul (First Review)' },
  { email: 'barksalesamit@gmail.com', stage: 'Pending Second Review', label: 'Amit (Second Review)' },
  { email: 'barkbutleracs01@gmail.com', stage: 'Pending Payment', label: 'Yogesh (Payment)' },
];

function ExpenseItemCard({ item, index }: { item: any; index: number }) {
  const net = parseFloat(item.amount || 0) + parseFloat(item.tax_gst || 0);
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}>
      {/* Row 1: index, type chip, date, bill */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Stack direction="row" gap={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">#{index + 1}</Typography>
          <Chip label={item.expense_type} size="small" />
          <Typography variant="caption" color="text.secondary">{fmt(item.date)}</Typography>
        </Stack>
        {item.bill_url
          ? <Link href={item.bill_url} target="_blank" rel="noopener noreferrer" variant="caption">View Bill</Link>
          : <Typography variant="caption" color="text.secondary">{item.bill_status || '—'}</Typography>}
      </Stack>

      {/* Row 2: description + route */}
      {item.description && (
        <Typography variant="body2" sx={{ mb: 0.25 }}>{item.description}</Typography>
      )}
      {item.location_route && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
          {item.location_route}
        </Typography>
      )}

      {/* Row 3: financials */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Amount</Typography>
          <Typography variant="caption" fontWeight={600}>{fmtMoney(item.amount)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">GST</Typography>
          <Typography variant="caption" fontWeight={600}>{fmtMoney(item.tax_gst)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Net</Typography>
          <Typography variant="caption" fontWeight={600}>{fmtMoney(net)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">DA</Typography>
          <Typography variant="caption" fontWeight={600}>{fmtMoney(item.daily_allowance)}</Typography>
        </Box>
      </Box>

      {item.remarks && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Remarks: {item.remarks}
        </Typography>
      )}
    </Box>
  );
}

function VisitCard({ visit }: { visit: any }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {visit.customer_name || visit.potential_customer_name || '—'}
        </Typography>
        {visit.customer_type === 'existing' || (!visit.customer_type && visit.customer_status)
          ? <Chip label={visit.customer_status || '—'} size="small" />
          : <Chip label="New / Potential" size="small" color="info" />}
      </Stack>
      <Stack direction="row" gap={2} sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{visit.city || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">{fmt(visit.date)}</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
        {visit.purpose_of_visit && (
          <Box sx={{ gridColumn: 'span 2' }}>
            <Typography variant="caption" color="text.secondary">Purpose</Typography>
            <Typography variant="caption" display="block">{visit.purpose_of_visit}</Typography>
          </Box>
        )}
        {visit.outcome && (
          <Box sx={{ gridColumn: 'span 2' }}>
            <Typography variant="caption" color="text.secondary">Outcome</Typography>
            <Typography variant="caption" display="block">{visit.outcome}</Typography>
          </Box>
        )}
        {visit.order_value && (
          <Box>
            <Typography variant="caption" color="text.secondary">Order Value</Typography>
            <Typography variant="caption" display="block" fontWeight={600}>{fmtMoney(visit.order_value)}</Typography>
          </Box>
        )}
        {visit.notes && (
          <Box>
            <Typography variant="caption" color="text.secondary">Notes</Typography>
            <Typography variant="caption" display="block">{visit.notes}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function EstimateDetailDrawer({ open, estimate, onClose, onRefresh, isAdmin, adminEmail }: Props) {
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [advanceReleased, setAdvanceReleased] = useState(false);
  const [approvedTotal, setApprovedTotal] = useState('');
  const [completeDialog, setCompleteDialog] = useState(false);
  const [completeApproved, setCompleteApproved] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');

  if (!estimate) return null;

  const currentApprover = APPROVER_CHAIN.find(a => a.stage === estimate.status);
  const canApprove = isAdmin && currentApprover && adminEmail === currentApprover.email;
  const canComplete = isAdmin && estimate.status === 'Submitted';

  const handleApprove = async () => {
    if (estimate.status === 'Pending Payment') {
      setApprovedTotal(String(estimate.estimated_total || ''));
      setPaymentDialog(true);
      return;
    }
    setApproveLoading(true);
    try {
      await axiosInstance.post(`/admin/expense-estimates/${estimate._id}/approve`, { remarks: approveRemarks });
      toast.success('Approved successfully');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Approval failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const handlePaymentApprove = async () => {
    setApproveLoading(true);
    try {
      await axiosInstance.post(`/admin/expense-estimates/${estimate._id}/approve`, {
        remarks: approveRemarks,
        advance_released: advanceReleased,
        approved_total: parseFloat(approvedTotal) || 0,
      });
      toast.success('Payment processed successfully');
      setPaymentDialog(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Reason is required'); return; }
    setApproveLoading(true);
    try {
      await axiosInstance.post(`/admin/expense-estimates/${estimate._id}/reject`, { reason: rejectReason });
      toast.success('Rejected');
      setRejectDialog(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleComplete = async () => {
    setApproveLoading(true);
    try {
      await axiosInstance.post(`/admin/expense-estimates/${estimate._id}/complete`, {
        approved_total: parseFloat(completeApproved) || estimate.actual_total || 0,
      });
      toast.success('Settlement completed');
      setCompleteDialog(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axiosInstance.get(`/admin/expense-estimates/${estimate._id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_Report_${estimate.created_by_name}_${estimate.travel_start_date?.slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 600, md: 720 } } }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto', height: '100%' }}>

          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Expense Estimate</Typography>
            <Stack direction="row" gap={1} alignItems="center">
              <StatusChip status={estimate.status} />
              {isAdmin && (
                <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownload} variant="outlined">
                  Download
                </Button>
              )}
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
          </Stack>

          {estimate.status === 'Rejected' && estimate.rejection_reason && (
            <Box sx={{ p: 1.5, mb: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">
                <strong>Rejection reason:</strong> {estimate.rejection_reason}
              </Typography>
            </Box>
          )}

          {/* Section 1 — Trip Information */}
          <SectionTitle>Section 1 — Trip Information</SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <LabelValue label="Employee Name" value={estimate.created_by_name} />
            <LabelValue label="Employee ID" value={estimate.employee_number} />
            <LabelValue label="Designation" value={estimate.designation} />
            <LabelValue label="Department" value={estimate.department} />
            <LabelValue label="Reporting Manager" value={estimate.reporting_manager} />
            <LabelValue label="Current Location" value={estimate.current_location} />
            <LabelValue label="Travel Start" value={fmt(estimate.travel_start_date)} />
            <LabelValue label="Travel End" value={fmt(estimate.travel_end_date)} />
            <LabelValue label="Purpose of Trip" value={estimate.purpose_of_trip} />
            <LabelValue label="Mode of Travel" value={estimate.mode_of_travel} />
          </Box>
          <LabelValue label="Locations Visited" value={estimate.locations_visited} />

          {/* Section 2B — Visit Summary */}
          <SectionTitle>Section 2B — Visit Summary</SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            <LabelValue label="Planned Existing" value={estimate.planned_existing_visits} />
            <LabelValue label="Actual Existing" value={estimate.actual_existing_visits || 0} />
            <LabelValue label="Planned New" value={estimate.planned_new_visits} />
            <LabelValue label="Actual New" value={estimate.actual_new_visits || 0} />
          </Box>

          {/* Section 3 — Expenses */}
          <SectionTitle>Section 3 — Expenses</SectionTitle>

          {estimate.expense_items?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Estimated Expenses</Typography>
              {estimate.expense_items.map((item: any, i: number) => (
                <ExpenseItemCard key={i} item={item} index={i} />
              ))}
            </Box>
          )}

          {estimate.actual_expense_items?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Actual Expenses</Typography>
              {estimate.actual_expense_items.map((item: any, i: number) => (
                <ExpenseItemCard key={i} item={item} index={i} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mt: 1 }}>
            <LabelValue label="Est. Travel" value={fmtMoney(estimate.estimated_travel)} />
            <LabelValue label="Est. Stay" value={fmtMoney(estimate.estimated_stay)} />
            <LabelValue label="Est. DA" value={fmtMoney(estimate.estimated_da)} />
            <LabelValue label="Est. Total" value={fmtMoney(estimate.estimated_total)} />
            <LabelValue label="Advance" value={fmtMoney(estimate.advance_requested)} />
            {estimate.actual_total > 0 && <LabelValue label="Actual Total" value={fmtMoney(estimate.actual_total)} />}
            {estimate.approved_total > 0 && <LabelValue label="Approved Total" value={fmtMoney(estimate.approved_total)} />}
            {estimate.amount_to_reimburse > 0 && <LabelValue label="To Reimburse" value={fmtMoney(estimate.amount_to_reimburse)} />}
            {estimate.amount_to_return > 0 && <LabelValue label="To Return" value={fmtMoney(estimate.amount_to_return)} />}
          </Box>

          {/* Section 2A — Customer Visit Log */}
          {estimate.customer_visits?.length > 0 && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  Section 2A — Customer Visit Log
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const stops = estimate.customer_visits
                      .map((v: any) => v.address_label || v.city)
                      .filter(Boolean)
                      .map((s: string) => encodeURIComponent(s));
                    if (stops.length === 0) return;
                    const origin = estimate.current_location
                      ? encodeURIComponent(estimate.current_location)
                      : stops[0];
                    const allStops = estimate.current_location ? stops : stops.slice(1);
                    const url = `https://www.google.com/maps/dir/${origin}/${allStops.join('/')}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Plan Route
                </Button>
              </Stack>
              {estimate.customer_visits.map((v: any, i: number) => (
                <VisitCard key={i} visit={v} />
              ))}
            </>
          )}

          {/* Approval Timeline */}
          <SectionTitle>Approval Timeline</SectionTitle>
          <Stack gap={1}>
            {[
              { label: 'First Review (Rahul)', ts: estimate.rahul_approved_at, remarks: estimate.rahul_remarks },
              { label: 'Second Review (Amit)', ts: estimate.amit_approved_at, remarks: estimate.amit_remarks },
              { label: 'Payment (Yogesh)', ts: estimate.yogesh_processed_at, remarks: estimate.yogesh_remarks },
            ].map(step => (
              <Stack key={step.label} direction="row" gap={1} alignItems="flex-start">
                {step.ts
                  ? <CheckCircleIcon color="success" sx={{ mt: 0.2, fontSize: 18 }} />
                  : <CancelIcon color="disabled" sx={{ mt: 0.2, fontSize: 18 }} />}
                <Box>
                  <Typography variant="body2" fontWeight={600}>{step.label}</Typography>
                  {step.ts && <Typography variant="caption" color="text.secondary">{fmt(step.ts)}</Typography>}
                  {step.remarks && <Typography variant="caption" display="block" color="text.secondary">{step.remarks}</Typography>}
                </Box>
              </Stack>
            ))}
            {estimate.yogesh_advance_released && (
              <Chip label="Advance Released" color="success" size="small" sx={{ alignSelf: 'flex-start' }} />
            )}
          </Stack>

          {/* Admin actions */}
          {(canApprove || canComplete) && (
            <>
              <Divider sx={{ my: 2 }} />
              <TextField
                label="Remarks (optional)"
                value={approveRemarks}
                onChange={e => setApproveRemarks(e.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />
              <Stack direction="row" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={approveLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                  onClick={canComplete ? () => { setCompleteApproved(String(estimate.actual_total || '')); setCompleteDialog(true); } : handleApprove}
                  disabled={approveLoading}
                >
                  {canComplete ? 'Complete Settlement' : estimate.status === 'Pending Payment' ? 'Process Payment' : 'Approve'}
                </Button>
                {canApprove && (
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setRejectDialog(true)}>
                    Reject
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>

      {/* Reject dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Expense Estimate</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for rejection"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            fullWidth multiline rows={3} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={approveLoading}>Reject</Button>
        </DialogActions>
      </Dialog>

      {/* Payment process dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Approved Total (₹)"
              value={approvedTotal}
              onChange={e => setApprovedTotal(e.target.value)}
              type="number" fullWidth
            />
            <Stack direction="row" gap={1} alignItems="center">
              <input type="checkbox" id="adv-released" checked={advanceReleased} onChange={e => setAdvanceReleased(e.target.checked)} />
              <label htmlFor="adv-released"><Typography variant="body2">Advance has been released</Typography></label>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handlePaymentApprove} disabled={approveLoading}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Complete settlement dialog */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Complete Settlement</DialogTitle>
        <DialogContent>
          <TextField
            label="Final Approved Total (₹)"
            value={completeApproved}
            onChange={e => setCompleteApproved(e.target.value)}
            type="number" fullWidth sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleComplete} disabled={approveLoading}>Complete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
