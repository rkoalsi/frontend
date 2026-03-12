import { useEffect, useState } from 'react';
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
  IconButton,
} from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import axiosInstance from '../../src/util/axios';
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
      { key: 'created_at', header: 'Created At (IST)' },
    ],
  },
];

const formatIST = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const withZ = dateStr + (dateStr.endsWith('Z') ? '' : 'Z');
  return new Date(withZ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
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
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Brand Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified At (IST)</TableCell>
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
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At (IST)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified At (IST)</TableCell>
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
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Business Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
}

const ContactRow = ({ contact, index, saving, onStatusChange }: ContactRowProps) => {
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
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {formatIST(contact.created_at)}
      </TableCell>
    </TableRow>
  );
};

// ─── Main Leads Page ──────────────────────────────────────────────────────────

const TAB_LABELS = ['Pupscribe.in Brand Leads', 'Pupscribe.in Catalogue Leads', 'Pupscribe.in Contact Form Leads'];

const LeadsPage = () => {
  const router = useRouter();
  const { tab: tabParam } = router.query;
  const [downloading, setDownloading] = useState(false);

  const tabIndex = tabParam === 'catalogue' ? 1 : tabParam === 'contact' ? 2 : 0;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabMap = ['brand', 'catalogue', 'contact'];
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
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            Leads
          </Typography>
          <Tooltip title={`Download ${REPORT_CONFIGS[tabIndex].label} as XLSX`} placement='left'>
            <span>
              <IconButton onClick={handleDownload} disabled={downloading} sx={{ color: '#344d69' }}>
                {downloading ? <CircularProgress size={22} /> : <FileDownloadOutlined />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', mb: 3 }}>
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
      </Paper>
    </Box>
  );
};

export default LeadsPage;
