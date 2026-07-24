import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Stack,
  TextField,
  Avatar,
  Badge,
  Collapse,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from '../src/components/common/Header';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { toast } from 'react-toastify';
import axiosInstance from '../src/util/axios';
import dayjs from 'dayjs';
import AuthContext from '../src/components/Auth';

/* ─── styled helpers ──────────────────────────────────────────────────────── */

const ChequeCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const Thumb = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: 10,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.action.hover,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'scale(1.04)',
    boxShadow: theme.shadows[4],
  },
  [theme.breakpoints.down('sm')]: {
    width: 68,
    height: 68,
    borderRadius: 8,
  },
}));

const CommentBubble = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.05)
      : theme.palette.grey[50],
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '4px 12px 12px 12px',
  padding: theme.spacing(1, 1.5),
}));

const EmptyState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 10,
      gap: 2,
    }}
  >
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ReceiptIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
    </Box>
    <Typography variant='h6' fontWeight={600} color='text.secondary'>
      No cheques yet
    </Typography>
    <Typography variant='body2' color='text.disabled' textAlign='center' maxWidth={280}>
      Cheque images uploaded by admin for your customers will appear here.
    </Typography>
  </Box>
);

/* ─── ChequeItem ──────────────────────────────────────────────────────────── */

const ChequeItem = ({
  cheque,
  onImageClick,
  onCommentPosted,
}: {
  cheque: any;
  onImageClick: (images: string[], index: number) => void;
  onCommentPosted: (updated: any) => void;
}) => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commentCount = (cheque.comments || []).length;

  const refreshCheque = async () => {
    const { data } = await axiosInstance.get('/cheques', { params: { page: 0, limit: 100 } });
    const updated = (data.cheques || []).find((c: any) => c._id === cheque._id);
    if (updated) onCommentPosted(updated);
  };

  const handlePost = async () => {
    const text = newComment.trim();
    if (!text) return;
    setPosting(true);
    try {
      await axiosInstance.post(`/cheques/${cheque._id}/comments`, { text });
      await refreshCheque();
      setNewComment('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (cmt: any) => {
    setEditingId(String(cmt._id));
    setEditingText(cmt.text || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    setSavingEdit(true);
    try {
      await axiosInstance.patch(`/cheques/${cheque._id}/comments/${commentId}`, { text: editingText.trim() });
      await refreshCheque();
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update comment');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axiosInstance.delete(`/cheques/${cheque._id}/comments/${commentId}`);
      await refreshCheque();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete comment');
    }
  };

  return (
    <ChequeCard>
      {/* Top accent bar */}
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />

      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='subtitle1'
              fontWeight={700}
              sx={{ lineHeight: 1.25, mb: 0.3 }}
              noWrap
            >
              {cheque.customer_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant='caption' color='text.disabled'>
                {cheque.created_at ? dayjs(cheque.created_at).format('DD MMM YYYY') : ''}
              </Typography>
            </Box>
          </Box>

          {/* Comments toggle */}
          <IconButton
            size='small'
            onClick={() => {
              setCommentsOpen((v) => !v);
              if (!commentsOpen) setTimeout(() => inputRef.current?.focus(), 200);
            }}
            sx={{
              ml: 1,
              bgcolor: commentsOpen
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.action.active, 0.04),
              color: commentsOpen ? 'primary.main' : 'text.secondary',
              border: `1px solid ${commentsOpen ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider}`,
              borderRadius: 2,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <Badge badgeContent={commentCount} color='primary' max={99}>
              <CommentIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </Box>

        {/* Salesperson chips */}
        {cheque.salesperson_codes?.length > 0 && (
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap mb={1.5}>
            {cheque.salesperson_codes.map((code: string) => (
              <Chip
                key={code}
                label={code}
                size='small'
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: (t) => alpha(t.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                  border: 'none',
                }}
              />
            ))}
          </Stack>
        )}

        {/* Admin notes */}
        {cheque.notes && (
          <Box
            sx={{
              mb: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.warning.main, 0.07),
              borderLeft: '3px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography variant='caption' color='text.secondary' fontWeight={600} display='block' mb={0.2}>
              Note
            </Typography>
            <Typography variant='body2' color='text.primary'>
              {cheque.notes}
            </Typography>
          </Box>
        )}

        {/* Images */}
        {cheque.images?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {cheque.images.map((img: any, i: number) => (
              <Thumb
                key={i}
                onClick={() =>
                  onImageClick(
                    cheque.images.map((im: any) => im.url),
                    i
                  )
                }
              >
                {img.url && !img.url.endsWith('.pdf') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt='cheque'
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', p: 0.5 }}>
                    <ImageIcon color='action' sx={{ fontSize: 24 }} />
                    <Typography variant='caption' display='block' color='text.secondary'>PDF</Typography>
                  </Box>
                )}
              </Thumb>
            ))}
          </Box>
        )}

        {/* Comments section */}
        <Collapse in={commentsOpen} timeout={200}>
          <Divider sx={{ mt: 2, mb: 2 }} />

          {/* Existing comments */}
          {cheque.comments?.length > 0 ? (
            <Stack spacing={1.5} mb={2}>
              {cheque.comments.map((cmt: any) => {
                const isMe = cmt.created_by === user?._id || cmt.created_by_name === user?.name;
                return (
                  <Box
                    key={cmt._id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexDirection: isMe ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.72rem',
                        bgcolor: isMe ? 'primary.main' : 'secondary.main',
                        flexShrink: 0,
                      }}
                    >
                      {(cmt.created_by_name || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ maxWidth: '75%' }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontWeight={600}
                        sx={{ display: 'block', mb: 0.3, textAlign: isMe ? 'right' : 'left' }}
                      >
                        {isMe ? 'You' : cmt.created_by_name}
                        {' · '}
                        {cmt.created_at ? dayjs(cmt.created_at).format('DD MMM, HH:mm') : ''}
                        {cmt.edited_at ? ' (edited)' : ''}
                      </Typography>
                      {editingId === String(cmt._id) ? (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                          <TextField
                            size='small'
                            multiline
                            fullWidth
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoFocus
                          />
                          <IconButton size='small' color='primary' onClick={() => handleSaveEdit(String(cmt._id))} disabled={savingEdit}>
                            {savingEdit ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <IconButton size='small' onClick={cancelEdit}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <>
                          <CommentBubble
                            sx={
                              isMe
                                ? {
                                    borderRadius: '12px 4px 12px 12px',
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                                  }
                                : {}
                            }
                          >
                            <Typography variant='body2'>{cmt.text}</Typography>
                          </CommentBubble>
                          {isMe && (
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end', mt: 0.3 }}>
                              <IconButton size='small' onClick={() => startEdit(cmt)} sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton size='small' color='error' onClick={() => handleDeleteComment(String(cmt._id))} sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography variant='caption' color='text.disabled' display='block' textAlign='center' mb={2}>
              No comments yet — be the first to add one
            </Typography>
          )}

          {/* New comment input */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              bgcolor: (t) => alpha(t.palette.action.active, 0.03),
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: 1,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={3}
              placeholder='Add a comment…'
              variant='standard'
              InputProps={{ disableUnderline: true }}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              sx={{ px: 0.5 }}
            />
            <IconButton
              size='small'
              color='primary'
              onClick={handlePost}
              disabled={!newComment.trim() || posting}
              sx={{
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                flexShrink: 0,
              }}
            >
              {posting ? <CircularProgress size={16} color='inherit' /> : <SendIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Collapse>

        {/* Subtle expand hint when comments closed but exist */}
        {!commentsOpen && commentCount > 0 && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', mt: 1.5, cursor: 'pointer', width: 'fit-content' }}
            onClick={() => setCommentsOpen(true)}
          >
            <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5 }} />
            <Typography variant='caption' color='text.disabled'>
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </Typography>
          </Box>
        )}
      </Box>
    </ChequeCard>
  );
};

/* ─── Main page ───────────────────────────────────────────────────────────── */

const LIMIT = 20;

const ChequesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [cheques, setCheques] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Image carousel preview
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewOpen = previewImages.length > 0;
  const touchStartX = useRef<number | null>(null);

  const openPreview = useCallback((images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
  }, []);

  const closePreview = useCallback(() => setPreviewImages([]), []);

  const showPrev = useCallback(
    () => setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length),
    [previewImages.length]
  );
  const showNext = useCallback(
    () => setPreviewIndex((i) => (i + 1) % previewImages.length),
    [previewImages.length]
  );

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

  // Search state
  const [searchText, setSearchText] = useState('');
  const searchTimeout = useRef<any>(null);

  const fetchCheques = useCallback(async (p: number, append = false, customerQ = '') => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: LIMIT };
      if (customerQ.trim()) params.customer_name = customerQ.trim();
      const { data } = await axiosInstance.get('/cheques', { params });
      const items = data.cheques || [];
      setCheques((prev) => (append ? [...prev, ...items] : items));
      setTotalCount(data.total || 0);
      setHasMore((p + 1) * LIMIT < (data.total || 0));
    } catch {
      toast.error('Failed to load cheques');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCheques(0);
  }, [fetchCheques]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
      fetchCheques(0, false, searchText);
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const handleCommentPosted = useCallback((updated: any) => {
    setCheques((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  }, []);

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen, showPrev, showNext]);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      <Header title='Cheques' showBackButton useBack />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, maxWidth: 640, mx: 'auto' }}>
        {/* Search bar */}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Search by customer name…'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: searchText ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setSearchText('')}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {/* Count */}
        {!loading && totalCount > 0 && (
          <Typography variant='caption' color='text.secondary' mb={1.5} display='block'>
            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
            {searchText && ` for "${searchText}"`}
          </Typography>
        )}

        {/* Content */}
        {loading && cheques.length === 0 ? (
          <Box display='flex' justifyContent='center' pt={8}>
            <CircularProgress />
          </Box>
        ) : cheques.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack spacing={2}>
            {cheques.map((c) => (
              <ChequeItem
                key={c._id}
                cheque={c}
                onImageClick={openPreview}
                onCommentPosted={handleCommentPosted}
              />
            ))}

            {hasMore && (
              <Box textAlign='center' pt={1}>
                <Box
                  component='button'
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchCheques(next, true, searchText);
                  }}
                  disabled={loading}
                  sx={{
                    px: 4, py: 1.25, borderRadius: 50,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: 'transparent', color: 'text.secondary',
                    fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 1,
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
                >
                  {loading ? <CircularProgress size={14} /> : 'Load more'}
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Image / PDF carousel preview */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth='md' fullWidth fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 2,
          }}
        >
          <Typography fontWeight={600}>
            Cheque Image
            {previewImages.length > 1 && (
              <Typography component='span' variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                {previewIndex + 1} / {previewImages.length}
              </Typography>
            )}
          </Typography>
          <IconButton onClick={closePreview} size='small'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, textAlign: 'center', position: 'relative' }}>
          <Box
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? '75vh' : 300 }}
          >
            {previewImages[previewIndex]?.endsWith('.pdf') ? (
              <iframe src={previewImages[previewIndex]} width='100%' height={isMobile ? '100%' : 560} style={{ border: 'none', minHeight: isMobile ? '75vh' : undefined }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImages[previewIndex]}
                alt='cheque'
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }}
              />
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
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1 }}>
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
    </Box>
  );
};

export default ChequesPage;
