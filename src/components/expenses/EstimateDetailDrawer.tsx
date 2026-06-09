import {
  Drawer, Box, Typography, Divider, Chip, Stack, Grid, Button,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../util/axios';
import StatusChip from './statusChip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (v: any) =>
  v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

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

  const expenseTable = (items: any[], label: string) => (
    items?.length > 0 && (
      <Box sx={{ overflowX: 'auto', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{label}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['#', 'Date', 'Type', 'Description', 'Route', 'Amount', 'Bill', 'GST', 'Net', 'DA'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item: any, i: number) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: 11 }}>{i + 1}</TableCell>
                <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(item.date)}</TableCell>
                <TableCell sx={{ fontSize: 11 }}><Chip label={item.expense_type} size="small" /></TableCell>
                <TableCell sx={{ fontSize: 11 }}>{item.description}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{item.location_route}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{fmtMoney(item.amount)}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{item.bill_status || '—'}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{fmtMoney(item.tax_gst)}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{fmtMoney((parseFloat(item.amount || 0) + parseFloat(item.tax_gst || 0)))}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>{fmtMoney(item.daily_allowance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    )
  );

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 600, md: 720 }, p: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Expense Estimate</Typography>
          <Stack direction="row" gap={1} alignItems="center">
            <StatusChip status={estimate.status} />
            {isAdmin && (
              <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownload} variant="outlined">
                Download
              </Button>
            )}
          </Stack>
        </Stack>

        {estimate.status === 'Rejected' && estimate.rejection_reason && (
          <Box sx={{ p: 1.5, mb: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.contrastText">
              <strong>Rejection reason:</strong> {estimate.rejection_reason}
            </Typography>
          </Box>
        )}

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

        <SectionTitle>Section 2B — Visit Summary</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          <LabelValue label="Planned Existing" value={estimate.planned_existing_visits} />
          <LabelValue label="Actual Existing" value={estimate.actual_existing_visits || 0} />
          <LabelValue label="Planned New" value={estimate.planned_new_visits} />
          <LabelValue label="Actual New" value={estimate.actual_new_visits || 0} />
        </Box>

        <SectionTitle>Section 3 — Expenses</SectionTitle>
        {expenseTable(estimate.expense_items, 'Estimated Expenses')}
        {expenseTable(estimate.actual_expense_items, 'Actual Expenses')}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
          <LabelValue label="Est. Travel" value={fmtMoney(estimate.estimated_travel)} />
          <LabelValue label="Est. Stay" value={fmtMoney(estimate.estimated_stay)} />
          <LabelValue label="Est. DA" value={fmtMoney(estimate.estimated_da)} />
          <LabelValue label="Est. Total" value={fmtMoney(estimate.estimated_total)} />
          <LabelValue label="Advance Requested" value={fmtMoney(estimate.advance_requested)} />
          {estimate.actual_total > 0 && <LabelValue label="Actual Total" value={fmtMoney(estimate.actual_total)} />}
          {estimate.approved_total > 0 && <LabelValue label="Approved Total" value={fmtMoney(estimate.approved_total)} />}
          {estimate.amount_to_reimburse > 0 && <LabelValue label="To Reimburse" value={fmtMoney(estimate.amount_to_reimburse)} />}
          {estimate.amount_to_return > 0 && <LabelValue label="To Return" value={fmtMoney(estimate.amount_to_return)} />}
        </Box>

        {estimate.customer_visits?.length > 0 && (
          <>
            <SectionTitle>Section 2A — Customer Visit Log</SectionTitle>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Date', 'Customer', 'City', 'Status', 'Purpose', 'Outcome', 'Order Value', 'Notes'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estimate.customer_visits.map((v: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(v.date)}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.customer_name || v.potential_customer_name}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.city}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}><Chip label={v.customer_status} size="small" /></TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.purpose_of_visit}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.outcome || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{fmtMoney(v.order_value)}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}

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
