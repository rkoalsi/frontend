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

const typeColor: Record<string, 'success' | 'primary' | 'default'> = {
  incoming: 'success',
  outgoing: 'primary',
  callback: 'default',
};

const ChatsPage = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [typeFilter, setTypeFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');

  useEffect(() => {
    const h = setTimeout(() => setDebouncedPhone(phoneFilter), 500);
    return () => clearTimeout(h);
  }, [phoneFilter]);

  const buildParams = (overrides: Record<string, unknown> = {}) => {
    const params: Record<string, unknown> = { ...overrides };
    if (typeFilter) params.chat_type = typeFilter;
    if (debouncedPhone.trim()) params.phone = debouncedPhone.trim();
    return params;
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/chats', {
        params: buildParams({ skip: page * rowsPerPage, limit: rowsPerPage }),
      });
      setChats(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to fetch chats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [page, rowsPerPage, typeFilter, debouncedPhone]); // eslint-disable-line

  const getMessageBody = (chat: any): string => {
    if (chat.type === 'incoming') return chat.body || '-';
    if (chat.type === 'outgoing') return chat.resolved_body || '(template body unavailable)';
    return chat.body || '-';
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get('/admin/chats', {
        params: buildParams({ skip: 0, limit: 100000 }),
      });
      const all: any[] = res.data.data;
      if (!all.length) { toast.info('No data to download.'); return; }

      const rows = all.map((chat, i) => ({
        '#': i + 1,
        Type: chat.type || '-',
        From: chat.from || '-',
        To: chat.to || '-',
        Message: getMessageBody(chat),
        Template: chat.template_name || '-',
        'Template Header': chat.template_header || '-',
        Status: chat.status || '-',
        'Created At (IST)': formatIST(chat.created_at),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Chats');
      XLSX.writeFile(wb, `whatsapp_chats_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Downloaded successfully.');
    } catch {
      toast.error('Failed to download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            WhatsApp Chats
          </Typography>
          <Tooltip title='Download as XLSX' placement='left'>
            <span>
              <IconButton onClick={handleDownload} disabled={downloading} sx={{ color: '#344d69' }}>
                {downloading ? <CircularProgress size={22} /> : <FileDownloadOutlined />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', mb: 3 }}>
          View all incoming and outgoing WhatsApp messages.
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select
              label='Type'
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='incoming'>Incoming</MenuItem>
              <MenuItem value='outgoing'>Outgoing</MenuItem>
              <MenuItem value='callback'>Callback</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label='Filter by phone'
            size='small'
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 220 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>No chats found.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 900 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created At (IST)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chats.map((chat, index) => {
                      const body = getMessageBody(chat);
                      return (
                        <TableRow key={chat._id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={chat.type}
                              color={typeColor[chat.type] ?? 'default'}
                              size='small'
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{chat.from || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{chat.to || '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 400, minWidth: 200 }}>
                            <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                              {body}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {chat.template_name ? (
                              <Tooltip title={chat.template_header || ''} placement='top' arrow>
                                <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                  {chat.template_name}
                                </Typography>
                              </Tooltip>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {chat.status ? (
                              <Chip label={chat.status} size='small' />
                            ) : '-'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {formatIST(chat.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default ChatsPage;
