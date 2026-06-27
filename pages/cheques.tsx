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
  ToggleButtonGroup,
  ToggleButton,
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
  onImageClick: (url: string) => void;
  onCommentPosted: (updated: any) => void;
}) => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commentCount = (cheque.comments || []).length;

  const handlePost = async () => {
    const text = newComment.trim();
    if (!text) return;
    setPosting(true);
    try {
      await axiosInstance.post(`/cheques/${cheque._id}/comments`, { text });
      const { data } = await axiosInstance.get('/cheques', { params: { page: 0, limit: 100 } });
      const updated = (data.cheques || []).find((c: any) => c._id === cheque._id);
      if (updated) onCommentPosted(updated);
      setNewComment('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post comment');
    } finally {
      setPosting(false);
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
              {cheque.invoice_number && (
                <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {cheque.invoice_number}
                </Typography>
              )}
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
              <Thumb key={i} onClick={() => onImageClick(img.url)}>
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
                      </Typography>
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
  const [previewUrl, setPreviewUrl] = useState('');

  // Search state
  const [searchMode, setSearchMode] = useState<'customer' | 'invoice'>('customer');
  const [searchText, setSearchText] = useState('');
  const searchTimeout = useRef<any>(null);

  const fetchCheques = useCallback(async (p: number, append = false, customerQ = '', invoiceQ = '') => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: LIMIT };
      if (customerQ.trim()) params.customer_name = customerQ.trim();
      if (invoiceQ.trim()) params.invoice_number = invoiceQ.trim();
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
      if (searchMode === 'customer') {
        fetchCheques(0, false, searchText, '');
      } else {
        fetchCheques(0, false, '', searchText);
      }
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, searchMode]);

  const handleCommentPosted = useCallback((updated: any) => {
    setCheques((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  }, []);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      <Header title='Cheques' showBackButton useBack />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, maxWidth: 640, mx: 'auto' }}>
        {/* Search bar */}
        <Box sx={{ mb: 2.5 }}>
          <ToggleButtonGroup
            value={searchMode}
            exclusive
            onChange={(_, val) => { if (val) { setSearchMode(val); setSearchText(''); } }}
            size='small'
            sx={{ mb: 1.5, width: { xs: '100%', sm: 'auto' } }}
          >
            <ToggleButton value='customer' sx={{ flex: { xs: 1, sm: 'none' }, px: 2.5, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
              Customer
            </ToggleButton>
            <ToggleButton value='invoice' sx={{ flex: { xs: 1, sm: 'none' }, px: 2.5, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
              Invoice #
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            fullWidth
            size='small'
            placeholder={searchMode === 'customer' ? 'Search by customer name…' : 'Search by invoice number…'}
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
                onImageClick={setPreviewUrl}
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
                    const customerQ = searchMode === 'customer' ? searchText : '';
                    const invoiceQ = searchMode === 'invoice' ? searchText : '';
                    fetchCheques(next, true, customerQ, invoiceQ);
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

      {/* Image / PDF preview */}
      <Dialog open={!!previewUrl} onClose={() => setPreviewUrl('')} maxWidth='md' fullWidth fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 2,
          }}
        >
          <Typography fontWeight={600}>Cheque Image</Typography>
          <IconButton onClick={() => setPreviewUrl('')} size='small'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          {previewUrl.endsWith('.pdf') ? (
            <iframe src={previewUrl} width='100%' height={isMobile ? '100%' : 560} style={{ border: 'none', minHeight: isMobile ? '75vh' : undefined }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt='cheque'
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChequesPage;
