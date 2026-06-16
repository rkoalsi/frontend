import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  alpha,
  Drawer,
  Avatar,
  Badge,
} from '@mui/material';
import Header from '../../src/components/common/Header';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import dayjs from 'dayjs';

type SearchMode = 'customer' | 'invoice';

interface UploadedImage {
  url: string;
  s3_key: string;
  localPreview?: string;
}

const AdminCheques = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('customer');

  // Customer search
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Invoice search
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
  const [resolvedInvoice, setResolvedInvoice] = useState<any>(null);

  // Derived display values
  const customerName =
    searchMode === 'customer'
      ? selectedCustomer?.contact_name || ''
      : resolvedInvoice?.customer_name || '';

  const salespersonCodesRaw =
    searchMode === 'customer'
      ? selectedCustomer?.cf_sales_person || selectedCustomer?.salesperson_name || ''
      : resolvedInvoice?.salesperson_name || resolvedInvoice?.cf_sales_person || '';

  const salespersonCodes: string[] = (() => {
    if (!salespersonCodesRaw) return [];
    if (Array.isArray(salespersonCodesRaw)) {
      return salespersonCodesRaw
        .flatMap((v: string) => v.split(',').map((s: string) => s.trim()))
        .filter(Boolean);
    }
    return String(salespersonCodesRaw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  // Images
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notes
  const [notes, setNotes] = useState('');

  // Submit
  const [submitting, setSubmitting] = useState(false);

  // Cheques list
  const [cheques, setCheques] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [listLoading, setListLoading] = useState(false);

  // Image preview dialog
  const [previewUrl, setPreviewUrl] = useState('');

  // Inline notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Comments drawer
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [drawerCheque, setDrawerCheque] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Customer autocomplete debounce
  const searchTimeout = useRef<any>(null);

  const fetchCustomers = useCallback(async (q: string) => {
    setCustomerSearchLoading(true);
    try {
      const { data } = await axiosInstance.get('/cheques/search/customers', {
        params: { name: q },
      });
      setCustomerOptions(data.customers || []);
    } catch {
      setCustomerOptions([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchCustomers(customerQuery);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [customerQuery, fetchCustomers]);

  const handleInvoiceLookup = async () => {
    if (!invoiceNumber.trim()) return;
    setInvoiceSearchLoading(true);
    try {
      const { data } = await axiosInstance.get('/cheques/search/invoices', {
        params: { invoice_number: invoiceNumber.trim() },
      });
      setResolvedInvoice(data);
      toast.success(`Found: ${data.customer_name}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invoice not found');
      setResolvedInvoice(null);
    } finally {
      setInvoiceSearchLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axiosInstance.post('/cheques/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push({
          url: data.url,
          s3_key: data.s3_key,
          localPreview: URL.createObjectURL(file),
        });
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (s3Key: string) => {
    setImages((prev) => prev.filter((img) => img.s3_key !== s3Key));
  };

  const handleSubmit = async () => {
    if (!customerName) {
      toast.error('Please select a customer or look up an invoice first');
      return;
    }
    if (!images.length) {
      toast.error('Please upload at least one cheque image');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_id:
          searchMode === 'customer'
            ? selectedCustomer?.contact_id || ''
            : resolvedInvoice?.customer_id || '',
        invoice_number: searchMode === 'invoice' ? invoiceNumber.trim() : '',
        invoice_id: searchMode === 'invoice' ? resolvedInvoice?.invoice_id || '' : '',
        salesperson_codes: salespersonCodes,
        images: images.map(({ url, s3_key }) => ({ url, s3_key })),
        notes,
      };
      await axiosInstance.post('/cheques', payload);
      toast.success('Cheque uploaded successfully');
      setSelectedCustomer(null);
      setCustomerQuery('');
      setInvoiceNumber('');
      setResolvedInvoice(null);
      setImages([]);
      setNotes('');
      setPage(0);
      fetchCheques(0);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save cheque');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCheques = useCallback(
    async (p: number) => {
      setListLoading(true);
      try {
        const { data } = await axiosInstance.get('/cheques', {
          params: { page: p, limit: rowsPerPage },
        });
        setCheques(data.cheques || []);
        setTotalCount(data.total || 0);
      } catch {
        toast.error('Failed to load cheques');
      } finally {
        setListLoading(false);
      }
    },
    [rowsPerPage]
  );

  useEffect(() => {
    fetchCheques(page);
  }, [page, fetchCheques]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cheque entry?')) return;
    try {
      await axiosInstance.delete(`/cheques/${id}`);
      toast.success('Deleted');
      fetchCheques(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed');
    }
  };

  const startEditNotes = (cheque: any) => {
    setEditingNotesId(cheque._id);
    setEditingNotesText(cheque.notes || '');
  };

  const cancelEditNotes = () => {
    setEditingNotesId(null);
    setEditingNotesText('');
  };

  const saveNotes = async (chequeId: string) => {
    setSavingNotes(true);
    try {
      await axiosInstance.patch(`/cheques/${chequeId}/notes`, { notes: editingNotesText });
      setCheques((prev) =>
        prev.map((c) => (c._id === chequeId ? { ...c, notes: editingNotesText } : c))
      );
      toast.success('Notes saved');
      cancelEditNotes();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const openComments = (cheque: any) => {
    setDrawerCheque(cheque);
    setCommentsDrawerOpen(true);
    setNewComment('');
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !drawerCheque) return;
    setPostingComment(true);
    try {
      await axiosInstance.post(`/cheques/${drawerCheque._id}/comments`, { text: newComment.trim() });
      // Refresh the specific cheque to get latest comments
      const { data } = await axiosInstance.get('/cheques', { params: { page, limit: rowsPerPage } });
      const updated = (data.cheques || []).find((c: any) => c._id === drawerCheque._id);
      if (updated) {
        setDrawerCheque(updated);
        setCheques((prev) => prev.map((c) => (c._id === drawerCheque._id ? updated : c)));
      }
      setNewComment('');
      toast.success('Comment added');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const resetCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setResolvedInvoice(null);
    setInvoiceNumber('');
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Header title='Cheques' />

      {/* Upload Form */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' fontWeight={700} mb={2.5}>
          Upload Cheque
        </Typography>

        <ToggleButtonGroup
          value={searchMode}
          exclusive
          onChange={(_, val) => {
            if (val) { setSearchMode(val); resetCustomer(); }
          }}
          size='small'
          sx={{ mb: 3 }}
        >
          <ToggleButton value='customer' sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>
            Search by Customer
          </ToggleButton>
          <ToggleButton value='invoice' sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>
            Search by Invoice
          </ToggleButton>
        </ToggleButtonGroup>

        {searchMode === 'customer' && (
          <Autocomplete
            options={customerOptions}
            getOptionLabel={(o) => o.contact_name || ''}
            loading={customerSearchLoading}
            value={selectedCustomer}
            onChange={(_, val) => setSelectedCustomer(val)}
            inputValue={customerQuery}
            onInputChange={(_, val) => setCustomerQuery(val)}
            filterOptions={(x) => x}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Customer Name'
                placeholder='Type to search customers…'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {customerSearchLoading && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 2 }}
          />
        )}

        {searchMode === 'invoice' && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label='Invoice Number'
              placeholder='e.g. INV/26-27/0335'
              value={invoiceNumber}
              onChange={(e) => { setInvoiceNumber(e.target.value); setResolvedInvoice(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleInvoiceLookup()}
              sx={{ flex: 1 }}
            />
            <Button
              variant='contained'
              onClick={handleInvoiceLookup}
              disabled={!invoiceNumber.trim() || invoiceSearchLoading}
              startIcon={invoiceSearchLoading ? <CircularProgress size={16} color='inherit' /> : <SearchIcon />}
              sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}
            >
              Look Up
            </Button>
          </Box>
        )}

        {customerName && (
          <Paper
            variant='outlined'
            sx={{
              p: 1.5, mb: 2, borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.success.main, 0.06),
              borderColor: 'success.light',
            }}
          >
            <Typography variant='body2' fontWeight={600} color='success.main' mb={0.5}>
              Customer: {customerName}
            </Typography>
            {salespersonCodes.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant='caption' color='text.secondary' alignSelf='center'>
                  Salesperson(s):
                </Typography>
                {salespersonCodes.map((code) => (
                  <Chip key={code} label={code} size='small' variant='outlined' />
                ))}
              </Box>
            )}
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant='subtitle2' fontWeight={600} mb={1}>
          Cheque Images
        </Typography>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*,.pdf'
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button
          variant='outlined'
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          sx={{ mb: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {uploading ? 'Uploading…' : 'Add Images / PDF'}
        </Button>

        {images.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            {images.map((img) => (
              <Box
                key={img.s3_key}
                sx={{
                  position: 'relative', width: 96, height: 96,
                  borderRadius: 2, overflow: 'hidden',
                  border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                }}
                onClick={() => setPreviewUrl(img.url)}
              >
                {img.url.endsWith('.pdf') ? (
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                    <ImageIcon color='action' />
                  </Box>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.localPreview || img.url} alt='cheque' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <IconButton
                  size='small'
                  onClick={(e) => { e.stopPropagation(); removeImage(img.s3_key); }}
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.3, '&:hover': { bgcolor: 'error.main' } }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <TextField
          label='Notes (optional)'
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          sx={{ mb: 2.5 }}
        />

        <Button
          variant='contained'
          size='large'
          onClick={handleSubmit}
          disabled={submitting || !customerName || !images.length}
          sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
        >
          {submitting ? <CircularProgress size={20} color='inherit' /> : 'Upload Cheque'}
        </Button>
      </Paper>

      {/* Cheques List */}
      <Typography variant='h6' fontWeight={700} mb={2}>
        All Cheques
      </Typography>

      {listLoading ? (
        <Box display='flex' justifyContent='center' py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Salesperson(s)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Images</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {cheques.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      No cheques uploaded yet
                    </TableCell>
                  </TableRow>
                )}
                {cheques.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{c.customer_name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{c.uploaded_by_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>{c.invoice_number || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                        {(c.salesperson_codes || []).map((code: string) => (
                          <Chip key={code} label={code} size='small' variant='outlined' />
                        ))}
                        {(!c.salesperson_codes || c.salesperson_codes.length === 0) && (
                          <Typography variant='caption' color='text.secondary'>—</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {(c.images || []).map((img: any, i: number) => (
                          <Tooltip key={i} title='View image'>
                            <Box
                              sx={{
                                width: 48, height: 48, borderRadius: 1,
                                overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                                cursor: 'pointer', bgcolor: 'action.hover',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                              onClick={() => setPreviewUrl(img.url)}
                            >
                              {img.url && !img.url.endsWith('.pdf') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img.url} alt='cheque' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <ImageIcon fontSize='small' color='action' />
                              )}
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>

                    {/* Inline notes editing */}
                    <TableCell>
                      {editingNotesId === c._id ? (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                          <TextField
                            size='small'
                            multiline
                            value={editingNotesText}
                            onChange={(e) => setEditingNotesText(e.target.value)}
                            sx={{ flex: 1 }}
                            autoFocus
                          />
                          <IconButton size='small' color='success' onClick={() => saveNotes(c._id)} disabled={savingNotes}>
                            {savingNotes ? <CircularProgress size={16} /> : <CheckIcon fontSize='small' />}
                          </IconButton>
                          <IconButton size='small' onClick={cancelEditNotes}>
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 180, wordBreak: 'break-word' }}>
                            {c.notes || <span style={{ opacity: 0.4 }}>—</span>}
                          </Typography>
                          <IconButton size='small' onClick={() => startEditNotes(c)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>

                    {/* Comments */}
                    <TableCell>
                      <Tooltip title='View / add comments'>
                        <IconButton size='small' onClick={() => openComments(c)}>
                          <Badge badgeContent={(c.comments || []).length} color='primary' max={99}>
                            <CommentIcon fontSize='small' />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {c.created_at ? dayjs(c.created_at).format('DD MMM YYYY') : '—'}
                      </Typography>
                    </TableCell>

                    <TableCell align='right'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(c._id)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component='div'
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[20]}
          />
        </Paper>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onClose={() => setPreviewUrl('')} maxWidth='md'>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Cheque Image
          <IconButton onClick={() => setPreviewUrl('')} size='small'><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {previewUrl.endsWith('.pdf') ? (
            <iframe src={previewUrl} width='100%' height={600} style={{ border: 'none' }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt='cheque' style={{ maxWidth: '100%' }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Comments drawer */}
      <Drawer
        anchor='right'
        open={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 420 }, p: 0 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography fontWeight={700}>{drawerCheque?.customer_name}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {drawerCheque?.invoice_number ? `Invoice: ${drawerCheque.invoice_number}` : dayjs(drawerCheque?.created_at).format('DD MMM YYYY')}
              </Typography>
            </Box>
            <IconButton onClick={() => setCommentsDrawerOpen(false)} size='small'><CloseIcon /></IconButton>
          </Box>

          {/* Comments list */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            {(!drawerCheque?.comments || drawerCheque.comments.length === 0) ? (
              <Typography color='text.secondary' variant='body2' textAlign='center' mt={4}>
                No comments yet
              </Typography>
            ) : (
              <Stack spacing={2}>
                {drawerCheque.comments.map((cmt: any) => (
                  <Box key={cmt._id} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                      {(cmt.created_by_name || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant='caption' fontWeight={700}>{cmt.created_by_name}</Typography>
                        <Chip label={cmt.role} size='small' variant='outlined' sx={{ height: 16, fontSize: '0.6rem' }} />
                        <Typography variant='caption' color='text.secondary'>
                          {cmt.created_at ? dayjs(cmt.created_at).format('DD MMM, HH:mm') : ''}
                        </Typography>
                      </Box>
                      <Paper variant='outlined' sx={{ p: 1.25, borderRadius: 2 }}>
                        <Typography variant='body2'>{cmt.text}</Typography>
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Add comment */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder='Add a comment…'
              size='small'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
            />
            <IconButton
              color='primary'
              onClick={handlePostComment}
              disabled={!newComment.trim() || postingComment}
            >
              {postingComment ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AdminCheques;
