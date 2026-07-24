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
  DialogActions,
  Tooltip,
  Stack,
  alpha,
  Drawer,
  Avatar,
  Badge,
} from '@mui/material';
import Header from '../../src/components/common/Header';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import dayjs from 'dayjs';

interface UploadedImage {
  url: string;
  s3_key: string;
  localPreview?: string;
}

const AdminCheques = () => {
  // Customer search
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Derived display values
  const customerName = selectedCustomer?.contact_name || '';

  const salespersonCodesRaw =
    selectedCustomer?.cf_sales_person || selectedCustomer?.salesperson_name || '';

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

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Cheques list
  const [cheques, setCheques] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [listLoading, setListLoading] = useState(false);

  // Image carousel preview
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewOpen = previewImages.length > 0;
  const touchStartX = useRef<number | null>(null);

  const openPreview = (imgs: string[], index: number) => {
    setPreviewImages(imgs);
    setPreviewIndex(index);
  };
  const closePreview = () => setPreviewImages([]);
  const showPrev = () =>
    setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length);
  const showNext = () => setPreviewIndex((i) => (i + 1) % previewImages.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50 && previewImages.length > 1) {
      if (dx > 0) showPrev();
      else showNext();
    }
    touchStartX.current = null;
  };

  // Inline notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Comments drawer
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [drawerCheque, setDrawerCheque] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Comment editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

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
        customer_id: selectedCustomer?.contact_id || '',
        invoice_number: '',
        invoice_id: '',
        salesperson_codes: salespersonCodes,
        images: images.map(({ url, s3_key }) => ({ url, s3_key })),
        notes,
      };
      await axiosInstance.post('/cheques', payload);
      toast.success('Cheque uploaded successfully');
      setSelectedCustomer(null);
      setCustomerQuery('');
      setImages([]);
      setNotes('');
      setUploadModalOpen(false);
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

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, previewImages.length]);

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
    setEditingCommentId(null);
  };

  const refreshDrawerCheque = async () => {
    const { data } = await axiosInstance.get('/cheques', { params: { page, limit: rowsPerPage } });
    const updated = (data.cheques || []).find((c: any) => c._id === drawerCheque._id);
    if (updated) {
      setDrawerCheque(updated);
      setCheques((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    }
  };

  const startEditComment = (cmt: any) => {
    setEditingCommentId(String(cmt._id));
    setEditingCommentText(cmt.text || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !drawerCheque) return;
    setSavingComment(true);
    try {
      await axiosInstance.patch(`/cheques/${drawerCheque._id}/comments/${commentId}`, {
        text: editingCommentText.trim(),
      });
      await refreshDrawerCheque();
      cancelEditComment();
      toast.success('Comment updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update comment');
    } finally {
      setSavingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!drawerCheque || !confirm('Delete this comment?')) return;
    try {
      await axiosInstance.delete(`/cheques/${drawerCheque._id}/comments/${commentId}`);
      await refreshDrawerCheque();
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete comment');
    }
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ position: 'relative' }}>
        <Header title='Cheques' />
        <Button
          variant='contained'
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => setUploadModalOpen(true)}
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            textTransform: 'none',
            fontWeight: 700,
            '& .MuiButton-startIcon': { m: { xs: 0, sm: undefined } },
          }}
        >
          <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>Upload Cheque</Box>
        </Button>
      </Box>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          Upload Cheque
          <IconButton onClick={() => setUploadModalOpen(false)} size='small'><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
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
                onClick={() => openPreview(images.map((im) => im.url), images.indexOf(img))}
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
          sx={{ mt: 1 }}
        />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setUploadModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={submitting || !customerName || !images.length}
            sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
          >
            {submitting ? <CircularProgress size={20} color='inherit' /> : 'Upload Cheque'}
          </Button>
        </DialogActions>
      </Dialog>

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
                    <TableCell colSpan={7} align='center' sx={{ py: 4, color: 'text.secondary' }}>
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
                              onClick={() => openPreview((c.images || []).map((im: any) => im.url), i)}
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

      {/* Image carousel preview */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component='span'>
            Cheque Image
            {previewImages.length > 1 && (
              <Typography component='span' variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                {previewIndex + 1} / {previewImages.length}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closePreview} size='small'><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ position: 'relative' }}>
          <Box
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}
          >
            {previewImages[previewIndex]?.endsWith('.pdf') ? (
              <iframe src={previewImages[previewIndex]} width='100%' height={600} style={{ border: 'none' }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImages[previewIndex]} alt='cheque' style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }} />
            )}
          </Box>

          {previewImages.length > 1 && (
            <>
              <IconButton
                onClick={showPrev}
                sx={{
                  position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={showNext}
                sx={{
                  position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <ChevronRightIcon />
              </IconButton>

              {/* Dot indicators */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1.5 }}>
                {previewImages.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => setPreviewIndex(i)}
                    sx={{
                      width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                      bgcolor: i === previewIndex ? 'primary.main' : 'action.disabled',
                      transition: 'background-color 0.2s',
                    }}
                  />
                ))}
              </Box>
            </>
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
                {drawerCheque.comments.map((cmt: any) => {
                  const isEditing = editingCommentId === String(cmt._id);
                  return (
                    <Box key={cmt._id} sx={{ display: 'flex', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                        {(cmt.created_by_name || '?')[0].toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant='caption' fontWeight={700}>{cmt.created_by_name}</Typography>
                          <Chip label={cmt.role} size='small' variant='outlined' sx={{ height: 16, fontSize: '0.6rem' }} />
                          <Typography variant='caption' color='text.secondary'>
                            {cmt.created_at ? dayjs(cmt.created_at).format('DD MMM, HH:mm') : ''}
                            {cmt.edited_at ? ' (edited)' : ''}
                          </Typography>
                          {!isEditing && (
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
                              <IconButton size='small' onClick={() => startEditComment(cmt)} sx={{ p: 0.3 }}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                              <IconButton size='small' color='error' onClick={() => deleteComment(String(cmt._id))} sx={{ p: 0.3 }}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                            <TextField
                              size='small'
                              multiline
                              fullWidth
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              autoFocus
                            />
                            <IconButton size='small' color='success' onClick={() => saveComment(String(cmt._id))} disabled={savingComment}>
                              {savingComment ? <CircularProgress size={16} /> : <CheckIcon fontSize='small' />}
                            </IconButton>
                            <IconButton size='small' onClick={cancelEditComment}>
                              <CloseIcon fontSize='small' />
                            </IconButton>
                          </Box>
                        ) : (
                          <Paper variant='outlined' sx={{ p: 1.25, borderRadius: 2 }}>
                            <Typography variant='body2'>{cmt.text}</Typography>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                  );
                })}
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
