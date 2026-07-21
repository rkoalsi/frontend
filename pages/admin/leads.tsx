import { useEffect, useState, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  TablePagination,
  TextField,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
} from '@mui/material';
import { FileDownloadOutlined, CheckOutlined, CloseOutlined, EditOutlined, FilterAlt } from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import axiosInstance from '../../src/util/axios';
import { formatHumanDateTime } from '../../src/util/date';
import { useRouter } from 'next/router';

// ─── XLSX helpers ─────────────────────────────────────────────────────────────

const DATE_KEYS = new Set(['created_at', 'verified_at']);

function buildXLSXRow(record: any, columns: { key: string; header: string }[]) {
  const row: Record<string, string> = {};
  for (const col of columns) {
    const val = record[col.key];
    if (val === null || val === undefined) row[col.header] = '-';
    else if (DATE_KEYS.has(col.key)) row[col.header] = formatIST(val);
    else if (Array.isArray(val)) row[col.header] = val.join(', ');
    else if (typeof val === 'boolean') row[col.header] = val ? 'Yes' : 'No';
    else row[col.header] = String(val);
  }
  return row;
}

function triggerXLSXDownload(data: any[], columns: { key: string; header: string }[], filename: string) {
  const rows = data.map((r) => buildXLSXRow(r, columns));
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns.map((c) => c.header) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}

const REPORT_CONFIGS = [
  {
    label: 'Brand Leads',
    fetch: async () => {
      const res = await axiosInstance.get('/admin/brand_leads', { params: { page: 0, limit: 100000 } });
      return res.data.brand_leads;
    },
    columns: [
      { key: 'phone', header: 'Phone' },
      { key: 'brand_name', header: 'Brand Name' },
      { key: 'verified', header: 'Verified' },
      { key: 'verified_at', header: 'Verified At (IST)' },
      { key: 'created_at', header: 'Created At (IST)' },
      { key: 'notes', header: 'Notes' },
    ],
  },
  {
    label: 'Catalogue Leads',
    fetch: async () => {
      const res = await axiosInstance.get('/admin/catalogue_leads', { params: { page: 0, limit: 100000 } });
      return res.data.catalogue_leads;
    },
    columns: [
      { key: 'phone', header: 'Phone' },
      { key: 'verified', header: 'Verified' },
      { key: 'verified_at', header: 'Verified At (IST)' },
      { key: 'created_at', header: 'Created At (IST)' },
      { key: 'notes', header: 'Notes' },
    ],
  },
  {
    label: 'Contact Form Leads',
    fetch: async () => {
      const res = await axiosInstance.get('/admin/contact_submissions', { params: { page: 0, limit: 100000 } });
      return res.data.contact_submissions;
    },
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'company_name', header: 'Company' },
      { key: 'business_type', header: 'Business Type' },
      { key: 'city', header: 'City' },
      { key: 'message', header: 'Message' },
      { key: 'status', header: 'Status' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Created At (IST)' },
    ],
  },
];

const formatIST = (dateStr: string | null | undefined) =>
  formatHumanDateTime(dateStr, { assumeUTC: true, tz: 'Asia/Kolkata' });

// ─── Inline Notes Cell ────────────────────────────────────────────────────────

interface NotesCellProps {
  value: string | null | undefined;
  onSave: (notes: string) => Promise<void>;
}

const NotesCell = ({ value, onSave }: NotesCellProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) textRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      // error already toasted by caller
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 220 }}>
        <TextField
          inputRef={textRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          multiline
          minRows={2}
          maxRows={6}
          size='small'
          fullWidth
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
          }}
          sx={{ fontSize: 13 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton size='small' onClick={handleSave} disabled={saving} color='primary'>
            {saving ? <CircularProgress size={14} /> : <CheckOutlined fontSize='small' />}
          </IconButton>
          <IconButton size='small' onClick={handleCancel} disabled={saving}>
            <CloseOutlined fontSize='small' />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, cursor: 'pointer', minWidth: 140 }}
      onClick={() => setEditing(true)}
    >
      <Typography
        variant='body2'
        sx={{
          color: value ? 'text.primary' : 'text.disabled',
          fontStyle: value ? 'normal' : 'italic',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxWidth: 220,
          flex: 1,
        }}
      >
        {value || 'Add note…'}
      </Typography>
      <EditOutlined sx={{ fontSize: 14, color: 'text.disabled', mt: 0.2, flexShrink: 0 }} />
    </Box>
  );
};

// ─── Shared Pagination Footer ─────────────────────────────────────────────────

interface PaginationFooterProps {
  totalCount: number;
  totalPages: number;
  page: number;
  rowsPerPage: number;
  skipPage: string;
  setSkipPage: (v: string) => void;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSkipPage: () => void;
}

const PaginationFooter = ({
  totalCount, totalPages, page, rowsPerPage, skipPage,
  setSkipPage, onPageChange, onRowsPerPageChange, onSkipPage,
}: PaginationFooterProps) => (
  <Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mt={2} flexWrap='wrap' gap={1}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TablePagination
        rowsPerPageOptions={[25, 50, 100, 200]}
        component='div'
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label='Go to page'
          type='number'
          variant='outlined'
          size='small'
          sx={{ width: 100 }}
          value={skipPage !== '' ? skipPage : page + 1}
          onChange={(e) =>
            parseInt(e.target.value) <= totalPages
              ? setSkipPage(e.target.value)
              : toast.error('Invalid page number')
          }
          onKeyDown={(e) => { if (e.key === 'Enter') onSkipPage(); }}
        />
        <Button variant='contained' onClick={onSkipPage} size='small'>Go</Button>
      </Box>
    </Box>
    <Typography variant='subtitle2' color='text.secondary'>
      Total Pages: {totalPages}
    </Typography>
  </Box>
);

// ─── Brand Leads Tab ──────────────────────────────────────────────────────────

const BrandLeadsTab = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/brand_leads', {
        params: { page, limit: rowsPerPage },
      });
      const { brand_leads, total_count, total_pages } = response.data;
      setLeads(brand_leads);
      setTotalCount(total_count);
      setTotalPages(total_pages);
    } catch {
      toast.error('Error fetching brand leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [page, rowsPerPage]); // eslint-disable-line

  const handleSkipPage = () => {
    const p = parseInt(skipPage, 10);
    if (isNaN(p) || p < 1) { toast.error('Invalid page number'); return; }
    setPage(p - 1); setSkipPage('');
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      await axiosInstance.patch(`/admin/brand_leads/${id}`, { notes });
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, notes } : l));
    } catch {
      toast.error('Failed to save notes.');
      throw new Error('save failed');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <>
      {leads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>No brand leads found.</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Brand Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.brand_name || '-'}</TableCell>
                    <TableCell>{formatIST(lead.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.verified ? 'Verified' : 'Pending'}
                        color={lead.verified ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{formatIST(lead.verified_at)}</TableCell>
                    <TableCell>
                      <NotesCell
                        value={lead.notes}
                        onSave={(notes) => handleSaveNotes(lead._id, notes)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <PaginationFooter
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            rowsPerPage={rowsPerPage}
            skipPage={skipPage}
            setSkipPage={setSkipPage}
            onPageChange={(_, p) => { setPage(p); setSkipPage(''); }}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); setSkipPage(''); }}
            onSkipPage={handleSkipPage}
          />
        </>
      )}
    </>
  );
};

// ─── Catalogue Leads Tab ──────────────────────────────────────────────────────

const CatalogueLeadsTab = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/catalogue_leads', {
        params: { page, limit: rowsPerPage },
      });
      const { catalogue_leads, total_count, total_pages } = response.data;
      setLeads(catalogue_leads);
      setTotalCount(total_count);
      setTotalPages(total_pages);
    } catch {
      toast.error('Error fetching catalogue leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [page, rowsPerPage]); // eslint-disable-line

  const handleSkipPage = () => {
    const p = parseInt(skipPage, 10);
    if (isNaN(p) || p < 1) { toast.error('Invalid page number'); return; }
    setPage(p - 1); setSkipPage('');
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      await axiosInstance.patch(`/admin/catalogue_leads/${id}`, { notes });
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, notes } : l));
    } catch {
      toast.error('Failed to save notes.');
      throw new Error('save failed');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <>
      {leads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>No catalogue leads found.</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{formatIST(lead.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.verified ? 'Verified' : 'Pending'}
                        color={lead.verified ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{formatIST(lead.verified_at)}</TableCell>
                    <TableCell>
                      <NotesCell
                        value={lead.notes}
                        onSave={(notes) => handleSaveNotes(lead._id, notes)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <PaginationFooter
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            rowsPerPage={rowsPerPage}
            skipPage={skipPage}
            setSkipPage={setSkipPage}
            onPageChange={(_, p) => { setPage(p); setSkipPage(''); }}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); setSkipPage(''); }}
            onSkipPage={handleSkipPage}
          />
        </>
      )}
    </>
  );
};

// ─── Contact Form Leads Tab ───────────────────────────────────────────────────

const ContactFormLeadsTab = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(h);
  }, [searchQuery]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: rowsPerPage };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await axiosInstance.get('/admin/contact_submissions', { params });
      setContacts(response.data.contact_submissions);
      setTotalCount(response.data.total_count);
      setTotalPages(response.data.total_pages);
    } catch {
      toast.error('Error fetching contact submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, [page, rowsPerPage, debouncedSearch]); // eslint-disable-line

  const handleSkipPage = () => {
    const p = parseInt(skipPage, 10);
    if (isNaN(p) || p < 1) { toast.error('Invalid page number'); return; }
    setPage(p - 1); setSkipPage('');
  };

  const handleStatusChange = async (id: string, status: string) => {
    setContacts((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
    setSavingId(id);
    try {
      await axiosInstance.patch(`/admin/contact_submissions/${id}`, { status });
    } catch {
      toast.error('Failed to update status.');
      fetchContacts();
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      await axiosInstance.patch(`/admin/contact_submissions/${id}`, { notes });
      setContacts((prev) => prev.map((c) => c._id === id ? { ...c, notes } : c));
    } catch {
      toast.error('Failed to save notes.');
      throw new Error('save failed');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <>
      <TextField
        label='Search by name, email, or phone'
        variant='outlined'
        fullWidth
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
        sx={{ mb: 3 }}
        size='small'
      />
      {contacts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>No contact submissions found.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 900 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Business Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.map((contact, index) => (
                    <ContactRow
                      key={contact._id}
                      contact={contact}
                      index={page * rowsPerPage + index + 1}
                      saving={savingId === contact._id}
                      onStatusChange={handleStatusChange}
                      onSaveNotes={handleSaveNotes}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <PaginationFooter
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            rowsPerPage={rowsPerPage}
            skipPage={skipPage}
            setSkipPage={setSkipPage}
            onPageChange={(_, p) => { setPage(p); setSkipPage(''); }}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); setSkipPage(''); }}
            onSkipPage={handleSkipPage}
          />
        </>
      )}
    </>
  );
};

// ─── Contact Row ──────────────────────────────────────────────────────────────

const MESSAGE_PREVIEW_LENGTH = 60;

const statusColor: Record<string, 'success' | 'warning' | 'default'> = {
  contacted: 'success',
  not_contacted: 'warning',
};

const statusLabel: Record<string, string> = {
  contacted: 'Contacted',
  not_contacted: 'Not Contacted',
};

interface ContactRowProps {
  contact: any;
  index: number;
  saving: boolean;
  onStatusChange: (id: string, status: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

const ContactRow = ({ contact, index, saving, onStatusChange, onSaveNotes }: ContactRowProps) => {
  const message: string = contact.message || '';
  const isLong = message.length > MESSAGE_PREVIEW_LENGTH;
  const preview = isLong ? `${message.slice(0, MESSAGE_PREVIEW_LENGTH)}…` : message;

  return (
    <TableRow hover>
      <TableCell>{index}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.name}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.phone || '-'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.email}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.company_name || '-'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {contact.business_type?.join(', ') || '-'}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.city || '-'}</TableCell>
      <TableCell sx={{ maxWidth: 220 }}>
        {message ? (
          <Tooltip title={isLong ? message : ''} placement='top' arrow>
            <Typography variant='body2' sx={{ cursor: isLong ? 'help' : 'default' }}>
              {preview}
            </Typography>
          </Tooltip>
        ) : '-'}
      </TableCell>
      <TableCell>
        <FormControl size='small' sx={{ minWidth: 150 }}>
          <Select
            value={contact.status || 'not_contacted'}
            onChange={(e) => onStatusChange(contact._id, e.target.value)}
            disabled={saving}
            renderValue={(val: string) => (
              <Chip
                label={statusLabel[val] ?? val}
                color={statusColor[val] ?? 'default'}
                size='small'
                sx={{ cursor: 'pointer' }}
              />
            )}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
          >
            <MenuItem value='not_contacted'>Not Contacted</MenuItem>
            <MenuItem value='contacted'>Contacted</MenuItem>
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>
        <NotesCell
          value={contact.notes}
          onSave={(notes) => onSaveNotes(contact._id, notes)}
        />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {formatIST(contact.created_at)}
      </TableCell>
    </TableRow>
  );
};

// ─── Potential Customers Tab ──────────────────────────────────────────────────

const PotentialCustomersTab = () => {
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('');
  const [potentialCustomers, setPotentialCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editedCustomer, setEditedCustomer] = useState<any>({});
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/sales-people')
      .then((res) => setSalesPeople(res.data.sales_people))
      .catch(() => toast.error('Error fetching sales people.'));
  }, []);

  const fetchPotentialCustomers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage, code: filterSalesPerson };
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      const response = await axiosInstance.get('/admin/potential_customers', { params });
      const { potential_customers = [], total_count, total_pages } = response.data;
      setPotentialCustomers(potential_customers);
      setTotalCount(total_count);
      setTotalPagesCount(total_pages);
    } catch {
      toast.error('Error fetching potential customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPotentialCustomers(); }, [page, rowsPerPage]); // eslint-disable-line

  const applyFilters = () => { setPage(0); setOpenFilterModal(false); fetchPotentialCustomers(); };

  const handleSkipPage = () => {
    const p = parseInt(skipPage, 10);
    if (isNaN(p) || p < 1) { toast.error('Invalid page number'); return; }
    setPage(p - 1); setSkipPage('');
  };

  const handleDownload = async () => {
    try {
      const params: any = { code: filterSalesPerson };
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      const response = await axiosInstance.get('/admin/potential_customers/report', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'potential_customers_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Error downloading report.');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axiosInstance.delete(`/admin/potential_customers/${customerId}`);
      toast.success('Customer deleted successfully.');
      fetchPotentialCustomers();
    } catch {
      toast.error('Error deleting customer.');
    }
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setEditedCustomer({ ...customer });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axiosInstance.put(`/admin/potential_customers/${selectedCustomer._id}`, editedCustomer);
      toast.success('Customer updated successfully.');
      setEditDialogOpen(false);
      fetchPotentialCustomers();
    } catch {
      toast.error('Error updating customer.');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button variant='contained' onClick={handleDownload}>
          Download Report
        </Button>
        <IconButton onClick={() => setOpenFilterModal(true)}>
          <FilterAlt />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : potentialCustomers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>No potential customers found.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Store Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>State/City</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created By/SP</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Follow Up Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Comments</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Onboard Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {potentialCustomers.map((customer: any) => (
                    <TableRow key={customer._id} hover>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>{customer.state_city || '-'}</TableCell>
                      <TableCell>{customer.tier}</TableCell>
                      <TableCell>{customer.customer_name || '-'}</TableCell>
                      <TableCell>{customer.mobile || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatIST(customer.created_at)}</TableCell>
                      <TableCell>{customer.created_by_info?.name}</TableCell>
                      <TableCell>{customer.follow_up_date || '-'}</TableCell>
                      <TableCell>{customer.comments || '-'}</TableCell>
                      <TableCell>{customer.status || '-'}</TableCell>
                      <TableCell>{customer.onboard_date || '-'}</TableCell>
                      <TableCell>
                        <Box display='flex' flexDirection='row' gap={1}>
                          <Button variant='outlined' color='info' onClick={() => handleEdit(customer)}>Edit</Button>
                          <Button variant='outlined' color='error' onClick={() => handleDelete(customer._id)}>Delete</Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <PaginationFooter
            totalCount={totalCount}
            totalPages={totalPagesCount}
            page={page}
            rowsPerPage={rowsPerPage}
            skipPage={skipPage}
            setSkipPage={setSkipPage}
            onPageChange={(_, p) => { setPage(p); setSkipPage(''); }}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); setSkipPage(''); }}
            onSkipPage={handleSkipPage}
          />
        </>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Edit Potential Customer</DialogTitle>
        <DialogContent>
          <TextField label='Store Name' fullWidth margin='dense' value={editedCustomer.name || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })} />
          <TextField label='Address' fullWidth margin='dense' value={editedCustomer.address || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })} />
          <TextField label='State/City' fullWidth margin='dense' value={editedCustomer.state_city || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, state_city: e.target.value })} />
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Tier</InputLabel>
            <Select value={editedCustomer.tier || ''} label='Tier'
              onChange={(e) => setEditedCustomer({ ...editedCustomer, tier: e.target.value })}>
              <MenuItem value='A'>A</MenuItem>
              <MenuItem value='B'>B</MenuItem>
              <MenuItem value='C'>C</MenuItem>
              <MenuItem value='D'>D</MenuItem>
            </Select>
          </FormControl>
          <TextField label='Customer Name' fullWidth margin='dense' value={editedCustomer.customer_name || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, customer_name: e.target.value })} />
          <TextField label='Mobile' fullWidth margin='dense' value={editedCustomer.mobile || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, mobile: e.target.value })} />
          <TextField label='Follow Up Date' type='date' fullWidth margin='dense' value={editedCustomer.follow_up_date || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, follow_up_date: e.target.value })}
            InputLabelProps={{ shrink: true }} />
          <TextField label='Comments' fullWidth margin='dense' multiline rows={3} value={editedCustomer.comments || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, comments: e.target.value })} />
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select value={editedCustomer.status || ''} label='Status'
              onChange={(e) => setEditedCustomer({ ...editedCustomer, status: e.target.value })}>
              <MenuItem value='Onboard'>Onboard</MenuItem>
              <MenuItem value='Decline'>Decline</MenuItem>
              <MenuItem value='Intalks'>Intalks</MenuItem>
              <MenuItem value='Issue'>Issue</MenuItem>
            </Select>
          </FormControl>
          <TextField label='Onboard Date' type='date' fullWidth margin='dense' value={editedCustomer.onboard_date || ''}
            onChange={(e) => setEditedCustomer({ ...editedCustomer, onboard_date: e.target.value })}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor='right' open={openFilterModal} onClose={() => setOpenFilterModal(false)}
        sx={{ '& .MuiDrawer-paper': { width: 300, padding: 3 } }}>
        <Box>
          <Typography variant='h6' gutterBottom>Filter</Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id='pc-sp-filter-label'>Sales Person</InputLabel>
            <Select labelId='pc-sp-filter-label' value={filterSalesPerson} label='Sales Person'
              onChange={(e) => setFilterSalesPerson(e.target.value)}>
              <MenuItem value=''>All</MenuItem>
              {salesPeople.map((person: any) => (
                <MenuItem key={person} value={person}>{person}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label='Start Date' type='date' fullWidth value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)} sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }} />
          <TextField label='End Date' type='date' fullWidth value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)} sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }} />
          <Box sx={{ mt: 3 }}>
            <Button variant='contained' fullWidth onClick={applyFilters}>Apply Filters</Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button variant='contained' fullWidth onClick={() => {
              setFilterSalesPerson(''); setFilterStartDate(''); setFilterEndDate('');
            }}>Reset Filters</Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

// ─── B2B Registrations Tab ────────────────────────────────────────────────────

const ACCOUNT_STATUS_META: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'error' },
};

const B2BRegistrationsTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRows = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: rowsPerPage };
      if (statusFilter) params.status = statusFilter;
      const response = await axiosInstance.get('/admin/b2b_registrations', { params });
      const { b2b_registrations, total_count, total_pages } = response.data;
      setRows(b2b_registrations);
      setTotalCount(total_count);
      setTotalPages(total_pages);
    } catch {
      toast.error('Error fetching B2B registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [page, rowsPerPage, statusFilter]); // eslint-disable-line

  const handleSkipPage = () => {
    const p = parseInt(skipPage, 10);
    if (isNaN(p) || p < 1) { toast.error('Invalid page number'); return; }
    setPage(p - 1); setSkipPage('');
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      await axiosInstance.patch(`/admin/b2b_registrations/${id}`, { notes });
      setRows((prev) => prev.map((r) => r._id === id ? { ...r, notes } : r));
    } catch {
      toast.error('Failed to save notes.');
      throw new Error('save failed');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant='body2' color='text.secondary'>
          Mobile numbers that started B2B self-registration on Marketplace. A row
          is captured the moment an OTP is requested; "Verified" means the account
          was created.
        </Typography>
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label='Status'
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='lead'>Not verified (drop-off)</MenuItem>
            <MenuItem value='verified'>Verified (account created)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>No B2B registrations found.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 900 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Shop / Business</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Profile</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Requested At (IST)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Verified At (IST)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const acct = ACCOUNT_STATUS_META[row.account_status as string];
                    return (
                      <TableRow key={row._id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.phone || '-'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.shop_name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.verified ? 'Verified' : 'Not verified'}
                            color={row.verified ? 'success' : 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          {acct ? (
                            <Chip label={acct.label} color={acct.color} size='small' />
                          ) : (
                            <Chip label='No account' color='default' variant='outlined' size='small' />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.profile_completed ? 'Complete' : 'Incomplete'}
                            color={row.profile_completed ? 'success' : 'warning'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatIST(row.created_at)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatIST(row.verified_at)}</TableCell>
                        <TableCell>
                          <NotesCell value={row.notes} onSave={(notes) => handleSaveNotes(row._id, notes)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <PaginationFooter
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            rowsPerPage={rowsPerPage}
            skipPage={skipPage}
            setSkipPage={setSkipPage}
            onPageChange={(_, p) => { setPage(p); setSkipPage(''); }}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); setSkipPage(''); }}
            onSkipPage={handleSkipPage}
          />
        </>
      )}
    </>
  );
};

// ─── Main Leads Page ──────────────────────────────────────────────────────────

const TAB_LABELS = ['Pupscribe.in Brand Leads', 'Pupscribe.in Catalogue Leads', 'Pupscribe.in Contact Form Leads', 'Potential Customers', 'B2B Registrations'];

const LeadsPage = () => {
  const router = useRouter();
  const { tab: tabParam } = router.query;
  const [downloading, setDownloading] = useState(false);

  const tabIndex = tabParam === 'catalogue' ? 1 : tabParam === 'contact' ? 2 : tabParam === 'potential' ? 3 : tabParam === 'b2b' ? 4 : 0;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabMap = ['brand', 'catalogue', 'contact', 'potential', 'b2b'];
    router.replace({ pathname: router.pathname, query: { tab: tabMap[newValue] } }, undefined, { shallow: true });
  };

  const handleDownload = async () => {
    const report = REPORT_CONFIGS[tabIndex];
    setDownloading(true);
    try {
      const data = await report.fetch();
      if (!data || data.length === 0) { toast.info('No data to download.'); return; }
      const filename = `${report.label.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      triggerXLSXDownload(data, report.columns, filename);
      toast.success(`${report.label} downloaded.`);
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            Leads
          </Typography>
          {tabIndex < 3 && (
            <Tooltip title={`Download ${REPORT_CONFIGS[tabIndex].label} as XLSX`} placement='left'>
              <span>
                <IconButton onClick={handleDownload} disabled={downloading} sx={{ color: '#344d69' }}>
                  {downloading ? <CircularProgress size={22} /> : <FileDownloadOutlined />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          View and manage all leads from brand signups, catalogue downloads, and contact form submissions.
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          textColor='primary'
          indicatorColor='primary'
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        {tabIndex === 0 && <BrandLeadsTab />}
        {tabIndex === 1 && <CatalogueLeadsTab />}
        {tabIndex === 2 && <ContactFormLeadsTab />}
        {tabIndex === 3 && <PotentialCustomersTab />}
        {tabIndex === 4 && <B2BRegistrationsTab />}
      </Paper>
    </Box>
  );
};

export default LeadsPage;
