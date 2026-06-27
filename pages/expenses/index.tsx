import { useContext, useEffect, useState } from 'react';
import {
  Box, Button, Typography, CircularProgress, Stack, Card, CardContent,
  Chip, Dialog, DialogTitle, DialogContent, Tooltip, Alert, Divider,
  IconButton, useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Header from '../../src/components/common/Header';
import AuthContext from '../../src/components/Auth';
import axiosInstance from '../../src/util/axios';
import { toast } from 'react-toastify';
import EstimateForm from '../../src/components/expenses/EstimateForm';
import ActualsForm from '../../src/components/expenses/ActualsForm';
import EstimateDetailDrawer from '../../src/components/expenses/EstimateDetailDrawer';
import StatusChip from '../../src/components/expenses/statusChip';

const PAGE_SIZE = 10;

function getComments(est: any): { label: string; text: string }[] {
  const out = [];
  if (est.rahul_remarks) out.push({ label: 'Rahul', text: est.rahul_remarks });
  if (est.amit_remarks) out.push({ label: 'Amit', text: est.amit_remarks });
  if (est.yogesh_remarks) out.push({ label: 'Yogesh', text: est.yogesh_remarks });
  if (est.rejection_reason) out.push({ label: 'Rejected', text: est.rejection_reason });
  return out;
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (v: any) =>
  v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

export default function ExpensesPage() {
  const { user } = useContext(AuthContext) as any;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeEstimate, setActiveEstimate] = useState<any>(null);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editEstimate, setEditEstimate] = useState<any>(null);
  const [editVisitsOnly, setEditVisitsOnly] = useState(false);
  const [actualsOpen, setActualsOpen] = useState(false);
  const [actualsEstimate, setActualsEstimate] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [lastTripSummary, setLastTripSummary] = useState<any>(null);

  const fetchData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [listRes, activeRes, summaryRes] = await Promise.all([
        axiosInstance.get('/expense-estimates', { params: { page, limit: PAGE_SIZE } }),
        axiosInstance.get('/expense-estimates/active'),
        axiosInstance.get('/expense-estimates/last-trip-summary').catch(() => ({ data: null })),
      ]);
      setEstimates(listRes.data.estimates || []);
      setTotalPages(listRes.data.total_pages || 1);
      setActiveEstimate(activeRes.data);
      setLastTripSummary(summaryRes.data);
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

  const openDetail = async (est: any) => {
    setSelectedEstimate(est);
    setDrawerOpen(true);
    try {
      const { data } = await axiosInstance.get(`/expense-estimates/${est._id}`);
      setSelectedEstimate(data);
    } catch { /* keep stale data if refresh fails */ }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Header title="My Expense Estimates" showBackButton useBack />

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

      {lastTripSummary?.has_last_trip && (
        <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <PeopleOutlineIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700}>Last Trip — Potential Customer Summary</Typography>
              <Typography variant="caption" color="text.secondary">
                {fmt(lastTripSummary.trip_start)} → {fmt(lastTripSummary.trip_end)}
                {lastTripSummary.locations ? ` · ${lastTripSummary.locations}` : ''}
              </Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              {[
                ['Potential Customers Visited', lastTripSummary.potential_customers_visited],
                ['Onboarded', lastTripSummary.onboarded_count],
                ['Orders Received', lastTripSummary.orders_received_count],
              ].map(([label, val]) => (
                <Box key={String(label)} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>{val}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
            {lastTripSummary.onboarded_names?.length > 0 && (
              <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Onboarded:</Typography>
                {lastTripSummary.onboarded_names.map((n: string) => (
                  <Chip key={n} label={n} size="small" color="success" variant="outlined" />
                ))}
              </Stack>
            )}
            {lastTripSummary.orders_received_count > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Orders total: ₹{Number(lastTripSummary.orders_received_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            )}
          </CardContent>
        </Card>
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
                    {getComments(est).map(c => (
                      <Stack key={c.label} direction="row" gap={0.5} alignItems="flex-start" sx={{ mt: 0.25 }}>
                        <Typography variant="caption" color={c.label === 'Rejected' ? 'error' : 'text.secondary'}>
                          <strong>{c.label}:</strong> {c.text}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                  <Box sx={{ textAlign: { sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Estimated Total</Typography>
                    <Typography variant="h6" fontWeight={700}>{fmtMoney(est.estimated_total)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Advance: {fmtMoney(est.advance_requested)}
                    </Typography>
                  </Box>
                </Stack>
                {est.status === 'Pending Review' && (
                  <Box sx={{ mt: 1.5 }} onClick={e => e.stopPropagation()}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Button variant="outlined" size="small" startIcon={<EditIcon />}
                      onClick={() => { setEditEstimate(est); setEditVisitsOnly(false); setEditFormOpen(true); }}>
                      Edit Estimate
                    </Button>
                  </Box>
                )}
                {(est.status === 'Pending Second Review' || est.status === 'Pending Payment') && (
                  <Box sx={{ mt: 1.5 }} onClick={e => e.stopPropagation()}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Button variant="outlined" size="small" startIcon={<EditIcon />}
                      onClick={() => { setEditEstimate(est); setEditVisitsOnly(true); setEditFormOpen(true); }}>
                      Edit Visit Details
                    </Button>
                  </Box>
                )}
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
      <Dialog open={newFormOpen} onClose={() => setNewFormOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile} scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          New Expense Estimate
          <IconButton onClick={() => setNewFormOpen(false)} size="small" edge="end"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          <EstimateForm
            userInfo={user}
            onSuccess={() => { setNewFormOpen(false); fetchData(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit estimate dialog */}
      <Dialog open={editFormOpen} onClose={() => setEditFormOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile} scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          {editVisitsOnly ? 'Edit Visit Details' : 'Edit Expense Estimate'}
          <IconButton onClick={() => setEditFormOpen(false)} size="small" edge="end"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {editEstimate && (
            <EstimateForm
              userInfo={user}
              existingEstimate={editEstimate}
              visitsOnly={editVisitsOnly}
              onSuccess={() => { setEditFormOpen(false); fetchData(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Actuals dialog */}
      <Dialog open={actualsOpen} onClose={() => setActualsOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile} scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          Submit Actual Expenses
          <IconButton onClick={() => setActualsOpen(false)} size="small" edge="end"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
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
