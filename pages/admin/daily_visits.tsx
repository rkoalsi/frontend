// pages/admin/daily_visits.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
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
  Drawer,
  Chip,
  IconButton,
  Divider,
  Autocomplete,
  Avatar,
  Tooltip,
} from '@mui/material';
import Header from '../../src/components/common/Header';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import CommentIcon from '@mui/icons-material/Comment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import formatAddress from '../../src/util/formatAddress';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';

const DailyVisits = () => {
  // State for daily visits data and pagination
  const [dailyVisits, setDailyVisits] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Date filter state
  const [startDate, setStartDate]: any = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate]: any = useState<dayjs.Dayjs | null>(null);

  // Salesperson filter state
  const [salespersonFilter, setSalespersonFilter] = useState<string | null>(null);
  const [salespersonOptions, setSalespersonOptions] = useState<string[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Drawer state for showing details
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');

  // Admin comment state
  const [visitComment, setVisitComment] = useState('');
  const [shopComments, setShopComments] = useState<{ [key: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState(false);

  // Ref to scroll to latest comment after adding
  const latestCommentRef = useRef<HTMLDivElement | null>(null);

  // Edit/Reply dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogMode, setEditDialogMode] = useState<'edit' | 'reply' | 'editReply'>('edit');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Fetch salespeople options for the filter dropdown
  const fetchSalespeopleOptions = async () => {
    try {
      const response = await axiosInstance.get('/admin/daily_visits/salespeople');
      const names: string[] = response.data.salespeople.map((sp: any) => sp.name);
      setSalespersonOptions(names);
    } catch (error) {
      console.error('Error fetching salespeople:', error);
    }
  };

  // Fetch daily visits from server
  // Accepts optional overrides so callers (e.g. clear-filter) can bypass
  // stale closure values without waiting for state to settle.
  const fetchDailyVisits = async (overrides?: {
    salesperson?: string | null;
    start?: dayjs.Dayjs | null;
    end?: dayjs.Dayjs | null;
  }) => {
    const activeStart = overrides && 'start' in overrides ? overrides.start : startDate;
    const activeEnd = overrides && 'end' in overrides ? overrides.end : endDate;
    const activeSalesperson =
      overrides && 'salesperson' in overrides ? overrides.salesperson : salespersonFilter;

    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };

      // Add date filters if they exist
      if (activeStart) {
        params.start_date = activeStart.format('YYYY-MM-DD');
      }
      if (activeEnd) {
        // Add one day to include the end date in results
        const nextDay = activeEnd.add(1, 'day');
        params.end_date = nextDay.format('YYYY-MM-DD');
      }

      // Add salesperson filter if set
      if (activeSalesperson) {
        params.salesperson_name = activeSalesperson;
      }

      const response = await axiosInstance.get('/admin/daily_visits', {
        params,
      });
      // Expected response: { daily_visits, total_count, total_pages }
      const { daily_visits, total_count, total_pages } = response.data;
      setDailyVisits(daily_visits);
      setTotalCount(total_count);
      setTotalPagesCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching daily visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalespeopleOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDailyVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

  // Apply date filter when user clicks on filter button
  const handleApplyDateFilter = () => {
    setPage(0); // Reset to first page
    fetchDailyVisits();
  };

  // Clear all filters
  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setSalespersonFilter(null);
    setPage(0);
    // Pass cleared values explicitly so fetchDailyVisits doesn't read stale state
    fetchDailyVisits({ salesperson: null, start: null, end: null });
  };

  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);

  // Pagination handlers
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  // Open the drawer with details
  const handleOpenDetails = (visit: any) => {
    setSelectedVisit(visit);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedVisit(null);
    setVisitComment('');
    setShopComments({});
  };

  // Add admin comment (visit level or shop level)
  const handleAddComment = async (shopId?: string) => {
    const commentText = shopId ? shopComments[shopId] : visitComment;
    if (!commentText?.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await axiosInstance.post(
        `/admin/daily_visits/${selectedVisit._id}/admin_comments`,
        {
          comment: commentText,
          admin_name: 'Admin', // You can get this from auth context
          shop_id: shopId || null,
        }
      );

      if (response.status === 200) {
        toast.success('Comment added successfully');
        // Reset comment input
        if (shopId) {
          setShopComments((prev) => ({ ...prev, [shopId]: '' }));
        } else {
          setVisitComment('');
        }
        // Refresh data
        await fetchDailyVisits();
        // Update selected visit with new data
        const updatedVisits = await axiosInstance.get('/admin/daily_visits', {
          params: { page, limit: rowsPerPage },
        });
        const updatedVisit = updatedVisits.data.daily_visits.find(
          (v: any) => v._id === selectedVisit._id
        );
        if (updatedVisit) {
          setSelectedVisit(updatedVisit);
          // Scroll to the newly added comment
          setTimeout(() => {
            latestCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error adding comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete admin comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setCommentLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/admin/daily_visits/${selectedVisit._id}/admin_comments/${commentId}`
      );

      if (response.status === 200) {
        toast.success('Comment deleted successfully');
        // Refresh data
        await fetchDailyVisits();
        // Update selected visit
        const updatedVisits = await axiosInstance.get('/admin/daily_visits', {
          params: { page, limit: rowsPerPage },
        });
        const updatedVisit = updatedVisits.data.daily_visits.find(
          (v: any) => v._id === selectedVisit._id
        );
        if (updatedVisit) {
          setSelectedVisit(updatedVisit);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (commentId: string, currentText: string) => {
    setSelectedCommentId(commentId);
    setEditText(currentText);
    setEditDialogMode('edit');
    setEditDialogOpen(true);
  };

  // Open reply dialog
  const handleOpenReplyDialog = (commentId: string) => {
    setSelectedCommentId(commentId);
    setEditText('');
    setEditDialogMode('reply');
    setEditDialogOpen(true);
  };

  // Open edit reply dialog
  const handleOpenEditReplyDialog = (commentId: string, currentText: string) => {
    setSelectedCommentId(commentId);
    setEditText(currentText);
    setEditDialogMode('editReply');
    setEditDialogOpen(true);
  };

  // Handle dialog submit
  const handleDialogSubmit = async () => {
    if (!editText.trim()) {
      toast.error('Please enter text');
      return;
    }

    setCommentLoading(true);
    try {
      let response;
      if (editDialogMode === 'edit') {
        response = await axiosInstance.put(
          `/admin/daily_visits/${selectedVisit._id}/admin_comments/${selectedCommentId}`,
          { comment: editText }
        );
      } else if (editDialogMode === 'reply') {
        response = await axiosInstance.post(
          `/admin/daily_visits/${selectedVisit._id}/admin_comments/${selectedCommentId}/reply`,
          {
            reply: editText,
            user_name: 'Admin',
            user_role: 'admin',
          }
        );
      } else if (editDialogMode === 'editReply') {
        response = await axiosInstance.put(
          `/admin/daily_visits/${selectedVisit._id}/admin_comments/${selectedCommentId}/reply`,
          { reply: editText }
        );
      }

      if (response && response.status === 200) {
        toast.success(
          editDialogMode === 'edit'
            ? 'Comment updated successfully'
            : editDialogMode === 'reply'
            ? 'Reply added successfully'
            : 'Reply updated successfully'
        );
        setEditDialogOpen(false);
        setEditText('');
        setSelectedCommentId(null);

        // Refresh data
        await fetchDailyVisits();
        const updatedVisits = await axiosInstance.get('/admin/daily_visits', {
          params: { page, limit: rowsPerPage },
        });
        const updatedVisit = updatedVisits.data.daily_visits.find(
          (v: any) => v._id === selectedVisit._id
        );
        if (updatedVisit) {
          setSelectedVisit(updatedVisit);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error processing request');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete reply
  const handleDeleteReply = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    setCommentLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/admin/daily_visits/${selectedVisit._id}/admin_comments/${commentId}/reply`
      );

      if (response.status === 200) {
        toast.success('Reply deleted successfully');
        await fetchDailyVisits();
        const updatedVisits = await axiosInstance.get('/admin/daily_visits', {
          params: { page, limit: rowsPerPage },
        });
        const updatedVisit = updatedVisits.data.daily_visits.find(
          (v: any) => v._id === selectedVisit._id
        );
        if (updatedVisit) {
          setSelectedVisit(updatedVisit);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting reply');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const params: any = {};

      // Add date filters to the report download if they exist
      if (startDate) {
        params.start_date = startDate.format('YYYY-MM-DD');
      }
      if (endDate) {
        // Add one day to include the end date in results
        const nextDay = endDate.add(1, 'day');
        params.end_date = nextDay.format('YYYY-MM-DD');
      }

      // Add salesperson filter if set
      if (salespersonFilter) {
        params.salesperson_name = salespersonFilter;
      }

      const response = await axiosInstance.get('/admin/daily_visits/report', {
        params,
        responseType: 'blob', // important for binary data!
      });

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Add salesperson + date range to filename if filters are active
      let filename = 'daily_visits_report';
      if (salespersonFilter) {
        filename += `_${salespersonFilter.replace(/ /g, '_')}`;
      }
      if (startDate && endDate) {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        filename += `_${startDateStr}_to_${endDateStr}`;
      } else if (startDate) {
        const startDateStr = startDate.format('YYYY-MM-DD');
        filename += `_from_${startDateStr}`;
      } else if (endDate) {
        const endDateStr = endDate.format('YYYY-MM-DD');
        filename += `_until_${endDateStr}`;
      }
      filename += '.xlsx';

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading report.');
    }
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Header title='Daily Visits' showBackButton />

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mt: 2 }}>
        {/* Header row */}
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant='h5' fontWeight='bold'>
              All Daily Visits
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {totalCount > 0 ? `${totalCount} total records` : 'No visits found'}
            </Typography>
          </Box>
          <Button variant='outlined' onClick={handleDownload} size='small'>
            Download XLSX
          </Button>
        </Box>

        {/* Filter Section */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Paper
            variant='outlined'
            sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}
          >
            <DatePicker
              label='Start Date'
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
              disableFuture
            />
            <DatePicker
              label='End Date'
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
              minDate={startDate || undefined}
              disableFuture
            />
            <Autocomplete
              options={salespersonOptions}
              value={salespersonFilter}
              onChange={(_event, newValue) => setSalespersonFilter(newValue)}
              renderInput={(params) => (
                <TextField {...params} label='Salesperson' size='small' />
              )}
              clearOnEscape
              sx={{ minWidth: 200 }}
            />
            <Box display='flex' gap={1}>
              <Button
                variant='contained'
                color='primary'
                onClick={handleApplyDateFilter}
                disabled={!startDate && !endDate && !salespersonFilter}
                size='small'
              >
                Apply
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                onClick={handleClearDateFilter}
                disabled={!startDate && !endDate && !salespersonFilter}
                size='small'
              >
                Clear
              </Button>
            </Box>
          </Paper>
        </LocalizationProvider>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : dailyVisits.length > 0 ? (
          <>
            <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>Salesperson</TableCell>
                    <TableCell>Selfie</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align='center'>Shops</TableCell>
                    <TableCell align='center'>Updates</TableCell>
                    <TableCell align='center'>Comments</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyVisits.map((visit) => {
                    const pendingComments = (visit.admin_comments || []).filter(
                      (c: any) => !c.reply
                    ).length;
                    const totalComments = (visit.admin_comments || []).length;
                    const salespersonName =
                      visit.created_by?.name || visit.created_by || 'N/A';
                    const initials = salespersonName
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <TableRow
                        key={visit._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleOpenDetails(visit)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                              {initials}
                            </Avatar>
                            <Typography variant='body2'>{salespersonName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {visit.selfie ? (
                            <Box
                              component='img'
                              onClick={(e: any) => {
                                e.stopPropagation();
                                handleImageClick(visit.selfie);
                              }}
                              src={visit.selfie}
                              alt='Selfie'
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                objectFit: 'cover',
                                cursor: 'zoom-in',
                                '&:hover': { opacity: 0.85 },
                              }}
                            />
                          ) : (
                            <Typography variant='caption' color='text.disabled'>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {new Date(visit.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {new Date(visit.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={visit.shops?.length || 0}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={visit.updates?.length || 0}
                            size='small'
                            color={visit.updates?.length > 0 ? 'success' : 'default'}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          {totalComments > 0 ? (
                            <Tooltip
                              title={
                                pendingComments > 0
                                  ? `${pendingComments} awaiting reply`
                                  : 'All replied'
                              }
                            >
                              <Chip
                                label={totalComments}
                                size='small'
                                color={pendingComments > 0 ? 'warning' : 'default'}
                                variant={pendingComments > 0 ? 'filled' : 'outlined'}
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant='caption' color='text.disabled'>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(visit);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination row */}
            <Box
              display='flex'
              flexDirection={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent='space-between'
              mt={2}
              gap={1}
            >
              <TablePagination
                rowsPerPageOptions={[10]}
                component='div'
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} of ${count} (Page ${page + 1} of ${totalPagesCount})`
                }
              />
              <Box display='flex' alignItems='center' gap={1}>
                <Typography variant='body2' color='text.secondary'>
                  Jump to:
                </Typography>
                <TextField
                  type='number'
                  variant='outlined'
                  size='small'
                  sx={{ width: 80 }}
                  value={skipPage !== '' ? skipPage : page + 1}
                  onChange={(e) =>
                    parseInt(e.target.value) <= totalPagesCount
                      ? setSkipPage(e.target.value)
                      : toast.error('Invalid page number')
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSkipPage();
                  }}
                  inputProps={{ min: 1, max: totalPagesCount }}
                />
                <Button variant='contained' size='small' onClick={handleSkipPage}>
                  Go
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 1,
            }}
          >
            <Typography variant='h6' color='text.secondary'>
              No daily visits found
            </Typography>
            <Typography variant='body2' color='text.disabled'>
              Try adjusting your filters
            </Typography>
          </Box>
        )}
      </Paper>

      <Drawer anchor='right' open={drawerOpen} onClose={handleCloseDrawer}>
        <Box
          sx={{
            width: { xs: '95vw', sm: 480, md: 560 },
            maxWidth: '100vw',
            p: 3,
            overflowX: 'hidden',
          }}
        >
          {selectedVisit && (
            <>
              {/* Drawer header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant='h6' fontWeight='bold'>
                  Visit Details
                </Typography>
                <Button size='small' variant='outlined' onClick={handleCloseDrawer}>
                  Close
                </Button>
              </Box>

              {/* Meta info */}
              <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
                    {(selectedVisit.created_by?.name || selectedVisit.created_by || 'N/A')
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      {selectedVisit.created_by?.name || selectedVisit.created_by || 'N/A'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(selectedVisit.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                {selectedVisit.updated_at !== selectedVisit.created_at && (
                  <Typography variant='caption' color='text.secondary'>
                    Updated: {new Date(selectedVisit.updated_at).toLocaleString()}
                  </Typography>
                )}
              </Paper>

              {selectedVisit.selfie && (
                <Box
                  component='img'
                  onClick={() => handleImageClick(selectedVisit.selfie)}
                  src={selectedVisit.selfie}
                  alt='Selfie'
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    mb: 2,
                    cursor: 'zoom-in',
                    '&:hover': { opacity: 0.9 },
                  }}
                />
              )}
              {/* Admin Comments for Daily Visit */}
              <Box sx={{ mt: 3 }}>
                <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon /> Admin Comments (Visit Level)
                </Typography>

                {/* Existing visit-level comments */}
                {selectedVisit.admin_comments && selectedVisit.admin_comments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {selectedVisit.admin_comments
                      .filter((c: any) => !c.shop_id)
                      .map((comment: any, idx: number, arr: any[]) => (
                        <Paper
                          key={comment._id}
                          ref={idx === arr.length - 1 ? latestCommentRef : undefined}
                          sx={{ p: 1.5, my: 1, bgcolor: 'action.hover' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                {comment.admin_name}
                              </Typography>
                              <Typography variant='body2'>{comment.text}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {new Date(comment.created_at).toLocaleString()}
                                {comment.updated_at && ' (edited)'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size='small'
                                onClick={() => handleOpenEditDialog(comment._id, comment.text)}
                                disabled={commentLoading}
                              >
                                <EditIcon fontSize='small' />
                              </IconButton>
                              {!comment.reply && (
                                <IconButton
                                  size='small'
                                  onClick={() => handleOpenReplyDialog(comment._id)}
                                  disabled={commentLoading}
                                >
                                  <ReplyIcon fontSize='small' />
                                </IconButton>
                              )}
                              <IconButton
                                size='small'
                                onClick={() => handleDeleteComment(comment._id)}
                                disabled={commentLoading}
                              >
                                <DeleteIcon fontSize='small' />
                              </IconButton>
                            </Box>
                          </Box>
                          {/* Reply display */}
                          {comment.reply && (
                            <Paper sx={{ p: 1, mt: 1, ml: 2, bgcolor: 'action.selected' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant='caption' sx={{ fontWeight: 500 }}>
                                    {comment.reply.user_name} ({comment.reply.user_role})
                                  </Typography>
                                  <Typography variant='body2'>{comment.reply.text}</Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {new Date(comment.reply.created_at).toLocaleString()}
                                    {comment.reply.updated_at && ' (edited)'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleOpenEditReplyDialog(comment._id, comment.reply.text)}
                                    disabled={commentLoading}
                                  >
                                    <EditIcon fontSize='small' />
                                  </IconButton>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleDeleteReply(comment._id)}
                                    disabled={commentLoading}
                                  >
                                    <DeleteIcon fontSize='small' />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Paper>
                          )}
                        </Paper>
                      ))}
                  </Box>
                )}

                {/* Add new visit-level comment */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size='small'
                    fullWidth
                    placeholder='Add admin comment for this visit...'
                    value={visitComment}
                    onChange={(e) => setVisitComment(e.target.value)}
                    multiline
                    rows={2}
                  />
                  <Button
                    variant='contained'
                    onClick={() => handleAddComment()}
                    disabled={commentLoading || !visitComment.trim()}
                    sx={{ minWidth: '80px' }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3 }}>
                <Typography variant='h6'>Shops:</Typography>
                {selectedVisit.shops && selectedVisit.shops.length > 0 ? (
                  selectedVisit.shops.map((shop: any, index: number) => {
                    const shopKey = shop._id || shop.id || `shop-${index}`;
                    return (
                    <Paper key={shopKey} sx={{ p: 2, my: 1 }}>
                      <Typography
                        variant='subtitle1'
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        <strong>
                          {shop.potential_customer
                            ? 'Potential Customer:'
                            : 'Customer Name:'}
                        </strong>{' '}
                        {shop.potential_customer
                          ? shop.potential_customer_name
                          : shop.customer_name}
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        <strong>
                          {shop.potential_customer
                            ? 'Potential Customer Address:'
                            : 'Customer Address:'}
                        </strong>{' '}
                        {shop.potential_customer
                          ? shop.potential_customer_address
                          : formatAddress(shop.address)}
                      </Typography>
                      {shop.potential_customer && (
                        <Typography
                          variant='subtitle1'
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <strong>Potential Customer Number: </strong>{' '}
                          {shop.potential_customer_mobile}
                        </Typography>
                      )}
                      {shop.potential_customer && (
                        <Typography
                          variant='subtitle1'
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <strong>Potential Customer Tier: </strong>{' '}
                          {shop.potential_customer_tier}
                        </Typography>
                      )}
                      <Typography
                        variant='subtitle1'
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <strong>Reason: </strong> {shop.reason}
                      </Typography>

                      {/* Shop-level admin comments */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 500, mb: 1 }}>
                          Admin Comments for this Shop:
                        </Typography>

                        {/* Existing shop-level comments */}
                        {selectedVisit.admin_comments && selectedVisit.admin_comments
                          .filter((c: any) => c.shop_id === shopKey)
                          .map((comment: any) => (
                            <Paper key={comment._id} sx={{ p: 1, my: 0.5, bgcolor: 'action.hover' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant='caption' sx={{ fontWeight: 500 }}>
                                    {comment.admin_name}
                                  </Typography>
                                  <Typography variant='body2'>{comment.text}</Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {new Date(comment.created_at).toLocaleString()}
                                    {comment.updated_at && ' (edited)'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleOpenEditDialog(comment._id, comment.text)}
                                    disabled={commentLoading}
                                  >
                                    <EditIcon fontSize='small' />
                                  </IconButton>
                                  {!comment.reply && (
                                    <IconButton
                                      size='small'
                                      onClick={() => handleOpenReplyDialog(comment._id)}
                                      disabled={commentLoading}
                                    >
                                      <ReplyIcon fontSize='small' />
                                    </IconButton>
                                  )}
                                  <IconButton
                                    size='small'
                                    onClick={() => handleDeleteComment(comment._id)}
                                    disabled={commentLoading}
                                  >
                                    <DeleteIcon fontSize='small' />
                                  </IconButton>
                                </Box>
                              </Box>
                              {/* Reply display */}
                              {comment.reply && (
                                <Paper sx={{ p: 1, mt: 1, ml: 2, bgcolor: 'action.selected' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant='caption' sx={{ fontWeight: 500 }}>
                                        {comment.reply.user_name} ({comment.reply.user_role})
                                      </Typography>
                                      <Typography variant='body2'>{comment.reply.text}</Typography>
                                      <Typography variant='caption' color='text.secondary'>
                                        {new Date(comment.reply.created_at).toLocaleString()}
                                        {comment.reply.updated_at && ' (edited)'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <IconButton
                                        size='small'
                                        onClick={() => handleOpenEditReplyDialog(comment._id, comment.reply.text)}
                                        disabled={commentLoading}
                                      >
                                        <EditIcon fontSize='small' />
                                      </IconButton>
                                      <IconButton
                                        size='small'
                                        onClick={() => handleDeleteReply(comment._id)}
                                        disabled={commentLoading}
                                      >
                                        <DeleteIcon fontSize='small' />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </Paper>
                              )}
                            </Paper>
                          ))}

                        {/* Add new shop-level comment */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            placeholder='Add comment for this shop...'
                            value={shopComments[shopKey] || ''}
                            onChange={(e) =>
                              setShopComments((prev) => ({
                                ...prev,
                                [shopKey]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => handleAddComment(shopKey)}
                            disabled={commentLoading || !shopComments[shopKey]?.trim()}
                          >
                            Add
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  );
                  })
                ) : (
                  <Typography variant='body2'>No shops available.</Typography>
                )}
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant='h6'>Updates:</Typography>
                {selectedVisit.updates && selectedVisit.updates.length > 0 ? (
                  selectedVisit.updates.map((update: any) => (
                    <Paper key={update._id} sx={{ p: 2, my: 1 }}>
                      <Typography
                        variant='subtitle1'
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        <strong>
                          {update.potential_customer
                            ? 'Potential Customer:'
                            : 'Customer Name:'}
                        </strong>{' '}
                        {update.potential_customer
                          ? update.potential_customer_name
                          : update.customer_name}
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        <strong>Text:</strong> {update.text}
                      </Typography>
                      <Typography variant='subtitle2'>
                        <strong>Created At:</strong>{' '}
                        {new Date(update.created_at).toLocaleString()}
                      </Typography>
                      {update.images && update.images.length > 0 && (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          {update.images.map((img: any, idx: number) => (
                            <Box
                              key={idx}
                              component='img'
                              onClick={() => handleImageClick(img.url)}
                              src={img.url}
                              alt={`Update Image ${idx + 1}`}
                              sx={{
                                width: '100%',
                                aspectRatio: '4/3',
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'zoom-in',
                                '&:hover': { opacity: 0.85 },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      {update.shop_hooks && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <Typography
                            variant='h6'
                            sx={{
                              mb: 2,
                              fontWeight: 500,
                            }}
                          >
                            Shop Hooks
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1.5,
                            }}
                          >
                            {update.shop_hooks.map((h: any, index: number) => (
                              <Box
                                key={index}
                                sx={{
                                  p: 2,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  backgroundColor: 'background.paper',
                                }}
                              >
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                  }}
                                >
                                  {h.category_name}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 3 }}>
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                  >
                                    Available:{' '}
                                    <strong>{h.hooksAvailable}</strong>
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                  >
                                    Total: <strong>{h.totalHooks}</strong>
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography variant='body2'>No updates available.</Typography>
                )}
              </Box>
              <Box sx={{ mt: 3, pb: 2 }}>
                <Button variant='outlined' fullWidth onClick={handleCloseDrawer}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
      <SingleImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />

      {/* Edit/Reply Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editDialogMode === 'edit'
            ? 'Edit Comment'
            : editDialogMode === 'reply'
            ? 'Add Reply'
            : 'Edit Reply'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            fullWidth
            multiline
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder={
              editDialogMode === 'edit'
                ? 'Enter comment...'
                : 'Enter reply...'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDialogSubmit}
            variant='contained'
            disabled={commentLoading || !editText.trim()}
          >
            {editDialogMode === 'edit'
              ? 'Update'
              : editDialogMode === 'reply'
              ? 'Reply'
              : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyVisits;
