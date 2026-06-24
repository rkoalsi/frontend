import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Switch,
} from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import axiosInstance from '../../src/util/axios';

const formatIST = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const withZ = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  return new Date(withZ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const ChatbotCustomersPage = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');
  const [reviewedFilter, setReviewedFilter] = useState(''); // '', 'true', 'false'
  const [b2bFilter, setB2bFilter] = useState(''); // '', 'true', 'false'

  useEffect(() => {
    const h = setTimeout(() => setDebouncedPhone(phoneFilter), 500);
    return () => clearTimeout(h);
  }, [phoneFilter]);

  const buildParams = (overrides: Record<string, unknown> = {}) => {
    const params: Record<string, unknown> = { ...overrides };
    if (debouncedPhone.trim()) params.phone = debouncedPhone.trim();
    if (reviewedFilter) params.reviewed = reviewedFilter;
    if (b2bFilter) params.is_b2b = b2bFilter;
    return params;
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/chatbot_customers', {
        params: buildParams({ skip: page * rowsPerPage, limit: rowsPerPage }),
      });
      setContacts(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to fetch contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, debouncedPhone, reviewedFilter, b2bFilter]); // eslint-disable-line

  const patchContact = async (id: string, changes: Record<string, unknown>) => {
    try {
      const res = await axiosInstance.patch(`/admin/chatbot_customers/${id}`, changes);
      const updated = res.data.data;
      setContacts((prev) => prev.map((c) => (c._id === id ? updated : c)));
    } catch {
      toast.error('Failed to update contact.');
      fetchContacts(); // resync on failure
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get('/admin/chatbot_customers', {
        params: buildParams({ skip: 0, limit: 100000 }),
      });
      const all: any[] = res.data.data;
      if (!all.length) { toast.info('No data to download.'); return; }

      const rows = all.map((c, i) => ({
        '#': i + 1,
        Phone: c.phone || '-',
        Name: c.name || '-',
        Type: c.is_b2b ? 'B2B' : 'B2C',
        Messages: c.message_count ?? 0,
        'Last Message': c.last_message || '-',
        Reviewed: c.reviewed ? 'Yes' : 'No',
        Notes: c.notes || '-',
        'First Seen (IST)': formatIST(c.first_seen),
        'Last Seen (IST)': formatIST(c.last_seen),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Chatbot Customers');
      XLSX.writeFile(wb, `chatbot_customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Downloaded successfully.');
    } catch {
      toast.error('Failed to download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            Chatbot Customers
          </Typography>
          <Tooltip title='Download as XLSX' placement='left'>
            <span>
              <IconButton onClick={handleDownload} disabled={downloading} sx={{ color: '#344d69' }}>
                {downloading ? <CircularProgress size={22} /> : <FileDownloadOutlined />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          B2C consumers who have messaged us on WhatsApp. Review their questions to build chatbot answers later.
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label='Filter by phone'
            size='small'
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 220 }}
          />
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Reviewed</InputLabel>
            <Select
              label='Reviewed'
              value={reviewedFilter}
              onChange={(e) => { setReviewedFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='false'>Not reviewed</MenuItem>
              <MenuItem value='true'>Reviewed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Segment</InputLabel>
            <Select
              label='Segment'
              value={b2bFilter}
              onChange={(e) => { setB2bFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='false'>B2C only</MenuItem>
              <MenuItem value='true'>B2B match</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>No contacts found.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 1000 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Segment</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Msgs</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Message</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Seen (IST)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reviewed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((c, index) => (
                      <TableRow key={c._id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.phone || '-'}</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <TextField
                            variant='standard'
                            size='small'
                            placeholder='Add name'
                            defaultValue={c.name || ''}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== (c.name || '')) patchContact(c._id, { name: v || null });
                            }}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.is_b2b ? 'B2B' : 'B2C'}
                            size='small'
                            color={c.is_b2b ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{c.message_count ?? 0}</TableCell>
                        <TableCell sx={{ maxWidth: 360, minWidth: 200 }}>
                          <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                            {c.last_message || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatIST(c.last_seen)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!c.reviewed}
                            onChange={(e) => patchContact(c._id, { reviewed: e.target.checked })}
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mt={2} flexWrap='wrap'>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100, 200]}
                component='div'
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
              <Typography variant='subtitle2' color='text.secondary'>
                Total: {total}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChatbotCustomersPage;
