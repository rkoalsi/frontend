import { useContext, useEffect, useState } from 'react';
import {
  Box, Button, Typography, CircularProgress, Stack, Card, CardContent,
  Chip, Dialog, DialogTitle, DialogContent, Tooltip, Alert, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Header from '../../src/components/common/Header';
import AuthContext from '../../src/components/Auth';
import axiosInstance from '../../src/util/axios';
import { toast } from 'react-toastify';
import EstimateForm from '../../src/components/expenses/EstimateForm';
import ActualsForm from '../../src/components/expenses/ActualsForm';
import EstimateDetailDrawer from '../../src/components/expenses/EstimateDetailDrawer';
import StatusChip from '../../src/components/expenses/statusChip';

const PAGE_SIZE = 10;

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (v: any) =>
  v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

export default function ExpensesPage() {
  const { user } = useContext(AuthContext) as any;
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeEstimate, setActiveEstimate] = useState<any>(null);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [actualsOpen, setActualsOpen] = useState(false);
  const [actualsEstimate, setActualsEstimate] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

  const fetchData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [listRes, activeRes] = await Promise.all([
        axiosInstance.get('/expense-estimates', { params: { page, limit: PAGE_SIZE } }),
        axiosInstance.get('/expense-estimates/active'),
      ]);
      setEstimates(listRes.data.estimates || []);
      setTotalPages(listRes.data.total_pages || 1);
      setActiveEstimate(activeRes.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?._id, page]);

  const hasActiveEstimate = !!activeEstimate;

  const openActuals = (est: any) => {
    setActualsEstimate(est);
    setActualsOpen(true);
  };

  const openDetail = (est: any) => {
    setSelectedEstimate(est);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Header title="My Expense Estimates" showBackButton backUrl="/" />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Expense Estimates</Typography>
        <Tooltip
          title={hasActiveEstimate ? `You have an active estimate (${activeEstimate.status}). Complete or submit it first.` : ''}
          arrow
        >
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewFormOpen(true)}
              disabled={hasActiveEstimate}
            >
              New Estimate
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {hasActiveEstimate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have an active estimate in <strong>{activeEstimate.status}</strong> status for trip on{' '}
          {fmt(activeEstimate.travel_start_date)}. A new estimate cannot be created until this one is completed or submitted.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : estimates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <ReceiptLongIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography>No expense estimates yet</Typography>
        </Box>
      ) : (
        <Stack gap={2}>
          {estimates.map((est: any) => (
            <Card key={est._id} sx={{ cursor: 'pointer' }} onClick={() => openDetail(est)}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} gap={1}>
                  <Box>
                    <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700}>{est.purpose_of_trip || 'Expense Estimate'}</Typography>
                      <StatusChip status={est.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {fmt(est.travel_start_date)} → {fmt(est.travel_end_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{est.locations_visited}</Typography>
                    {est.rejection_reason && (
                      <Typography variant="caption" color="error">Rejected: {est.rejection_reason}</Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: { sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Estimated Total</Typography>
                    <Typography variant="h6" fontWeight={700}>{fmtMoney(est.estimated_total)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Advance: {fmtMoney(est.advance_requested)}
                    </Typography>
                  </Box>
                </Stack>
                {est.status === 'Draft' && (
                  <Box sx={{ mt: 1.5 }} onClick={e => e.stopPropagation()}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Alert severity="success" sx={{ mb: 1.5 }}>
                      Your trip has been approved and advance released. Please submit your actual expenses after returning.
                    </Alert>
                    <Button variant="contained" color="primary" size="small" onClick={() => openActuals(est)}>
                      Submit Actual Expenses
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" gap={1} sx={{ mt: 3 }}>
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)} size="small">Previous</Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {page + 1} of {totalPages}</Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} size="small">Next</Button>
        </Stack>
      )}

      {/* New estimate dialog */}
      <Dialog open={newFormOpen} onClose={() => setNewFormOpen(false)} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>New Expense Estimate</DialogTitle>
        <DialogContent dividers>
          <EstimateForm
            userInfo={user}
            onSuccess={() => { setNewFormOpen(false); fetchData(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Actuals dialog */}
      <Dialog open={actualsOpen} onClose={() => setActualsOpen(false)} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>Submit Actual Expenses</DialogTitle>
        <DialogContent dividers>
          {actualsEstimate && (
            <ActualsForm
              estimate={actualsEstimate}
              onSuccess={() => { setActualsOpen(false); fetchData(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <EstimateDetailDrawer
        open={drawerOpen}
        estimate={selectedEstimate}
        onClose={() => setDrawerOpen(false)}
        onRefresh={fetchData}
        isAdmin={false}
      />
    </Box>
  );
}
