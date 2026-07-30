import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddLink,
  Autorenew,
  ContentCopy,
  DeleteOutline,
  Edit,
  OpenInNew,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

/**
 * Distributor registration invites (/admin/distributor_invites).
 *
 * Distributor onboarding is invite-only — there is no public form. An invite
 * created here mints an unguessable token; the link built from it is the only
 * way into pages/distributor_registration/[token].tsx.
 *
 * A link stays live until it is revoked, so a brand can come back and correct
 * what they submitted. Revoke closes it; regenerate replaces the token when the
 * old link has gone to the wrong person.
 */

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'revoked', label: 'Revoked' },
];

// Mirrors _STAGE_QUERIES in routes/admin_distributor_invites.py.
const STAGE_FILTERS = [
  { value: '', label: 'All invites' },
  { value: 'not_opened', label: 'Not opened' },
  { value: 'opened', label: 'Opened, not started' },
  { value: 'verified', label: 'Mobile verified' },
  { value: 'in_progress', label: 'Part-way through' },
  { value: 'submitted', label: 'Filled in' },
];

type Progress = {
  stage: 'not_opened' | 'opened' | 'verified' | 'in_progress' | 'submitted';
  step: number | null;
  step_label: string;
  total_steps: number;
  opened_at?: string;
  last_opened_at?: string;
  phone_verified_at?: string;
  draft_updated_at?: string;
};

const emptyForm = {
  brand_name: '',
  company_name: '',
  contact_person_name: '',
  email: '',
  phone: '',
  note: '',
};

type Invite = {
  _id: string;
  token: string;
  brand_name: string;
  company_name?: string;
  contact_person_name?: string;
  email?: string;
  phone?: string;
  note?: string;
  status: string;
  submitted: boolean;
  submission_count: number;
  created_at?: string;
  last_submitted_at?: string;
  progress: Progress;
};

const formatIST = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * How far the brand got. The form autosaves after every step, so this is a live
 * read of an unfinished application rather than a done/not-done flag — which is
 * the difference between "chase them, they stalled on addresses" and silence.
 */
const ProgressCell = ({ invite }: { invite: Invite }) => {
  const progress = invite.progress || ({} as Progress);
  const { stage, step, step_label: stepLabel, total_steps: totalSteps } = progress;

  const chip = (() => {
    switch (stage) {
      case 'submitted':
        return { label: 'Filled in', color: 'success' as const, variant: 'filled' as const };
      case 'in_progress':
        return {
          label:
            typeof step === 'number'
              ? `Step ${step + 1} of ${totalSteps} — ${stepLabel}`
              : 'In progress',
          color: 'warning' as const,
          variant: 'filled' as const,
        };
      case 'verified':
        return { label: 'Mobile verified', color: 'info' as const, variant: 'outlined' as const };
      case 'opened':
        return { label: 'Opened', color: 'default' as const, variant: 'outlined' as const };
      default:
        return { label: 'Not opened', color: 'default' as const, variant: 'outlined' as const };
    }
  })();

  // One line of "when", picked to match whatever the chip is claiming.
  const caption = (() => {
    if (stage === 'submitted') {
      // A draft alongside a submission means they are back editing it.
      if (typeof step === 'number') {
        return `Editing — step ${step + 1} of ${totalSteps}, saved ${formatIST(progress.draft_updated_at)}`;
      }
      return formatIST(invite.last_submitted_at);
    }
    if (stage === 'in_progress') return `Last saved ${formatIST(progress.draft_updated_at)}`;
    if (stage === 'verified') return formatIST(progress.phone_verified_at);
    if (stage === 'opened') return `Opened ${formatIST(progress.opened_at)}`;
    return 'Link not visited yet';
  })();

  return (
    <Box>
      <Chip size='small' label={chip.label} color={chip.color} variant={chip.variant} />
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.25 }}>
        {caption}
      </Typography>
    </Box>
  );
};

const AdminDistributorInvites = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invite | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // The link shown right after creating an invite — the whole point of the
  // page, so it gets its own dialog rather than a toast that scrolls away.
  const [createdToken, setCreatedToken] = useState('');

  // Built from the browser rather than an env var so a link copied on UAT
  // points at UAT and one copied on prod points at prod.
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const linkFor = useCallback(
    (token: string) => `${origin}/distributor_registration/${token}`,
    [origin],
  );

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: rowsPerPage };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (stageFilter) params.stage = stageFilter;
      const res = await axiosInstance.get('/admin/distributor_invites', { params });
      setInvites(res.data?.invites || []);
      setTotalCount(res.data?.total_count || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching distributor invites.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, stageFilter]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(fetchInvites, 350);
    return () => clearTimeout(timer);
  }, [fetchInvites]);

  const setField = (key: keyof typeof emptyForm) => (e: any) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (invite: Invite) => {
    setEditing(invite);
    setForm({
      brand_name: invite.brand_name || '',
      company_name: invite.company_name || '',
      contact_person_name: invite.contact_person_name || '',
      email: invite.email || '',
      phone: invite.phone || '',
      note: invite.note || '',
    });
    setDialogOpen(true);
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      toast.success('Registration link copied');
    } catch {
      toast.error('Could not copy — select the link and copy it manually');
    }
  };

  const save = async () => {
    if (!form.brand_name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axiosInstance.put(`/admin/distributor_invites/${editing._id}`, form);
        toast.success('Invite updated');
      } else {
        const res = await axiosInstance.post('/admin/distributor_invites', form);
        setCreatedToken(res.data?.token || '');
      }
      setDialogOpen(false);
      fetchInvites();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not save the invite');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (invite: Invite, status: string) => {
    try {
      await axiosInstance.patch(`/admin/distributor_invites/${invite._id}/status`, { status });
      toast.success(status === 'revoked' ? 'Link revoked' : 'Link reactivated');
      fetchInvites();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not update the invite');
    }
  };

  const regenerate = async (invite: Invite) => {
    if (
      !window.confirm(
        `Generate a new link for ${invite.brand_name}? The link already sent will stop working.`,
      )
    )
      return;
    try {
      const res = await axiosInstance.post(
        `/admin/distributor_invites/${invite._id}/regenerate`,
      );
      setCreatedToken(res.data?.token || '');
      fetchInvites();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not regenerate the link');
    }
  };

  const remove = async (invite: Invite) => {
    if (!window.confirm(`Delete the invite for ${invite.brand_name}?`)) return;
    try {
      await axiosInstance.delete(`/admin/distributor_invites/${invite._id}`);
      toast.success('Invite deleted');
      fetchInvites();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not delete the invite');
    }
  };

  const totalPages = useMemo(
    () => (totalCount ? Math.ceil(totalCount / rowsPerPage) : 1),
    [totalCount, rowsPerPage],
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1,
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={700}>
            Distributor Invites
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Generate a private registration link for a brand. Only someone holding
            the link can open the form.
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<AddLink />}
          onClick={openCreate}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          New invite
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
          gap: 2,
          my: 3,
        }}
      >
        <TextField
          fullWidth
          size='small'
          label='Search'
          placeholder='Brand, company, contact, email or phone'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          select
          fullWidth
          size='small'
          label='Status'
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          {STATUS_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          size='small'
          label='Progress'
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value);
            setPage(0);
          }}
        >
          {STAGE_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : invites.length === 0 ? (
        <Alert severity='info'>
          No invites yet. Create one to generate a private registration link for a
          brand.
        </Alert>
      ) : (
        <>
          {/* Desktop table */}
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite._id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{invite.brand_name}</Typography>
                      {invite.company_name && (
                        <Typography variant='caption' color='text.secondary'>
                          {invite.company_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {invite.contact_person_name || '-'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[invite.phone, invite.email].filter(Boolean).join(' · ') || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={invite.status === 'revoked' ? 'Revoked' : 'Active'}
                        color={invite.status === 'revoked' ? 'default' : 'success'}
                        variant={invite.status === 'revoked' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <ProgressCell invite={invite} />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{formatIST(invite.created_at)}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <InviteActions
                        invite={invite}
                        link={linkFor(invite.token)}
                        onCopy={() => copyLink(invite.token)}
                        onEdit={() => openEdit(invite)}
                        onRegenerate={() => regenerate(invite)}
                        onToggleStatus={() =>
                          setStatus(invite, invite.status === 'revoked' ? 'active' : 'revoked')
                        }
                        onDelete={() => remove(invite)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile cards — the row has six columns, which no phone fits. */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {invites.map((invite) => (
              <Paper key={invite._id} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap>
                      {invite.brand_name}
                    </Typography>
                    {invite.company_name && (
                      <Typography variant='caption' color='text.secondary'>
                        {invite.company_name}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    size='small'
                    label={invite.status === 'revoked' ? 'Revoked' : 'Active'}
                    color={invite.status === 'revoked' ? 'default' : 'success'}
                    variant={invite.status === 'revoked' ? 'outlined' : 'filled'}
                  />
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  {invite.contact_person_name || '-'}
                  {invite.phone ? ` · ${invite.phone}` : ''}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <ProgressCell invite={invite} />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <InviteActions
                    invite={invite}
                    link={linkFor(invite.token)}
                    onCopy={() => copyLink(invite.token)}
                    onEdit={() => openEdit(invite)}
                    onRegenerate={() => regenerate(invite)}
                    onToggleStatus={() =>
                      setStatus(invite, invite.status === 'revoked' ? 'active' : 'revoked')
                    }
                    onDelete={() => remove(invite)}
                  />
                </Box>
              </Paper>
            ))}
          </Box>

          <TablePagination
            component='div'
            count={totalCount}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count} · page ${page + 1} of ${totalPages}`
            }
          />
        </>
      )}

      {/* Create / edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? 'Edit invite' : 'New distributor invite'}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Only the brand name is required — everything else pre-fills the form so
            the brand has less to type. {editing && 'The existing link keeps working.'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label='Brand name'
              fullWidth
              required
              value={form.brand_name}
              onChange={setField('brand_name')}
            />
            <TextField
              label='Company name'
              fullWidth
              value={form.company_name}
              onChange={setField('company_name')}
            />
            <TextField
              label='Contact person'
              fullWidth
              value={form.contact_person_name}
              onChange={setField('contact_person_name')}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label='Mobile number'
                fullWidth
                value={form.phone}
                onChange={setField('phone')}
                helperText='10 digits — the brand still verifies it on WhatsApp'
              />
              <TextField label='Email' fullWidth value={form.email} onChange={setField('email')} />
            </Box>
            <TextField
              label='Note for the brand (optional)'
              fullWidth
              multiline
              minRows={2}
              value={form.note}
              onChange={setField('note')}
              helperText='Shown at the top of their form.'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={save}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={20} color='inherit' /> : editing ? 'Save' : 'Create link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* The freshly minted link */}
      <Dialog
        open={Boolean(createdToken)}
        onClose={() => setCreatedToken('')}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Registration link ready</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Send this to the brand. Anyone with the link can fill in the form, so
            share it directly with your contact.
          </Typography>
          <TextField
            fullWidth
            value={linkFor(createdToken)}
            InputProps={{ readOnly: true }}
            onFocus={(e) => e.target.select()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatedToken('')} sx={{ textTransform: 'none' }}>
            Close
          </Button>
          <Button
            variant='contained'
            startIcon={<ContentCopy />}
            onClick={() => copyLink(createdToken)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Copy link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const InviteActions = ({
  invite,
  link,
  onCopy,
  onEdit,
  onRegenerate,
  onToggleStatus,
  onDelete,
}: {
  invite: Invite;
  link: string;
  onCopy: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, flexWrap: 'wrap' }}>
    <Tooltip title='Copy link'>
      <IconButton size='small' onClick={onCopy}>
        <ContentCopy fontSize='small' />
      </IconButton>
    </Tooltip>
    <Tooltip title='Open form'>
      <IconButton size='small' component='a' href={link} target='_blank' rel='noopener noreferrer'>
        <OpenInNew fontSize='small' />
      </IconButton>
    </Tooltip>
    <Tooltip title='Edit pre-filled details'>
      <IconButton size='small' onClick={onEdit}>
        <Edit fontSize='small' />
      </IconButton>
    </Tooltip>
    <Tooltip title='Generate a new link (kills the old one)'>
      <IconButton size='small' onClick={onRegenerate}>
        <Autorenew fontSize='small' />
      </IconButton>
    </Tooltip>
    <Button size='small' onClick={onToggleStatus} sx={{ textTransform: 'none' }}>
      {invite.status === 'revoked' ? 'Reactivate' : 'Revoke'}
    </Button>
    {/* Deleting is refused server-side once an application has come through —
        the lead must outlive the link. */}
    {!invite.submitted && (
      <Tooltip title='Delete invite'>
        <IconButton size='small' onClick={onDelete}>
          <DeleteOutline fontSize='small' />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

export default AdminDistributorInvites;
