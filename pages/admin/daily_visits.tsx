// pages/admin/daily_visits.tsx
import { useCallback, useEffect, useState } from 'react';
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
  Grid,
  Drawer,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
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
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Date filter state
  const [startDate, setStartDate]: any = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate]: any = useState<dayjs.Dayjs | null>(null);

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

  // Fetch daily visits from server
  const fetchDailyVisits = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };

      // Add date filters if they exist
      if (startDate) {
        params.start_date = startDate.format('YYYY-MM-DD'); // Format: YYYY-MM-DD
      }
      if (endDate) {
        // Add one day to include the end date in results
        const nextDay = endDate.add(1, 'day');
        params.end_date = nextDay.format('YYYY-MM-DD');
      }

      const response = await axiosInstance.get('/admin/daily_visits', {
        params,
      });
      // Expected response: { daily_visits, total_count, total_pages }
      const { daily_visits, total_count, total_pages } = response.data;
      console.log(daily_visits);
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
    fetchDailyVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

  // Apply date filter when user clicks on filter button
  const handleApplyDateFilter = () => {
    setPage(0); // Reset to first page
    fetchDailyVisits();
  };

  // Clear date filters
  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    // Fetch data automatically after clearing
    setTimeout(() => {
      fetchDailyVisits();
    }, 0);
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

      const response = await axiosInstance.get('/admin/daily_visits/report', {
        params,
        responseType: 'blob', // important for binary data!
      });

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Add date range to filename if dates are selected
      let filename = 'daily_visits_report';
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
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Daily Visits
          </Typography>
          <Button onClick={handleDownload}>Download Daily Visits XLSX</Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View all daily visits from sales people below.
        </Typography>

        {/* Date Filter Section */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
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
            <Button
              variant='contained'
              color='primary'
              onClick={handleApplyDateFilter}
              disabled={!startDate && !endDate}
            >
              Apply Filter
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={handleClearDateFilter}
              disabled={!startDate && !endDate}
            >
              Clear Filter
            </Button>
          </Box>
        </LocalizationProvider>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {dailyVisits.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created By</TableCell>
                        <TableCell>Selfie</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell>Updated At</TableCell>
                        <TableCell>Updates</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailyVisits.map((visit) => (
                        <TableRow key={visit._id}>
                          <TableCell>
                            {visit.created_by && visit.created_by.name
                              ? visit.created_by.name
                              : visit.created_by || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {visit.selfie ? (
                              <img
                                onClick={() => handleImageClick(visit.selfie)}
                                src={visit.selfie}
                                alt='Selfie'
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '4px',
                                }}
                              />
                            ) : (
                              'No Selfie'
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(visit.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(visit.updated_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {visit.updates ? visit.updates.length : 0}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='outlined'
                              onClick={() => handleOpenDetails(visit)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box
                  display='flex'
                  flexDirection='row'
                  alignItems='end'
                  justifyContent='space-between'
                  mt={2}
                >
                  <Box display='flex' alignItems='center' gap='8px'>
                    <TablePagination
                      rowsPerPageOptions={[25, 50, 100, 200]}
                      component='div'
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                    <Box ml={2} display='flex' alignItems='center'>
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 100, mr: 1 }}
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) =>
                          parseInt(e.target.value) <= totalPagesCount
                            ? setSkipPage(e.target.value)
                            : toast.error('Invalid Page Number')
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSkipPage();
                          }
                        }}
                      />
                      <Button variant='contained' onClick={handleSkipPage}>
                        Go
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant='subtitle1'>
                    Total Pages: {totalPagesCount}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box display='flex' justifyContent='center' alignItems='center'>
                <Typography variant='h5' fontWeight='bold'>
                  No Daily Visits
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Drawer anchor='right' open={drawerOpen} onClose={handleCloseDrawer}>
        <Box sx={{ width: { xs: 200, lg: 400, xl: 500 }, p: 3 }}>
          {selectedVisit && (
            <>
              <Typography variant='h5' gutterBottom>
                Daily Visit Details
              </Typography>
              <Typography variant='subtitle1' gutterBottom>
                <strong>Created By:</strong>{' '}
                {selectedVisit.created_by && selectedVisit.created_by.name
                  ? selectedVisit.created_by.name
                  : selectedVisit.created_by || 'N/A'}
              </Typography>
              <Typography variant='subtitle1' gutterBottom>
                <strong>Created At:</strong>{' '}
                {new Date(selectedVisit.created_at).toLocaleString()}
              </Typography>
              <Typography variant='subtitle1' gutterBottom>
                <strong>Updated At:</strong>{' '}
                {new Date(selectedVisit.updated_at).toLocaleString()}
              </Typography>
              {selectedVisit.selfie && (
                <Box sx={{ my: 2 }}>
                  <img
                    onClick={() => handleImageClick(selectedVisit.selfie)}
                    src={selectedVisit.selfie}
                    alt='Selfie'
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </Box>
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
                      .map((comment: any) => (
                        <Paper key={comment._id} sx={{ p: 1.5, my: 1, backgroundColor: '#fff3e0' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                {comment.admin_name}
                              </Typography>
                              <Typography variant='body2'>{comment.text}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {new Date(comment.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                            <IconButton
                              size='small'
                              onClick={() => handleDeleteComment(comment._id)}
                              disabled={commentLoading}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Box>
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
                    const shopKey = shop.id || `shop-${index}`;
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
                            <Paper key={comment._id} sx={{ p: 1, my: 0.5, backgroundColor: '#e3f2fd' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant='caption' sx={{ fontWeight: 500 }}>
                                    {comment.admin_name}
                                  </Typography>
                                  <Typography variant='body2'>{comment.text}</Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {new Date(comment.created_at).toLocaleString()}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size='small'
                                  onClick={() => handleDeleteComment(comment._id)}
                                  disabled={commentLoading}
                                >
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                              </Box>
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
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {update.images.map((img: any, idx: number) => (
                            <Box key={idx}>
                              <img
                                onClick={() => handleImageClick(img.url)}
                                src={img.url}
                                alt={`Update Image ${idx + 1}`}
                                style={{ width: '100%', borderRadius: '8px' }}
                              />
                            </Box>
                          ))}
                        </Grid>
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
              <Box sx={{ mt: 3 }}>
                <Button variant='contained' onClick={handleCloseDrawer}>
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
    </Box>
  );
};

export default DailyVisits;
