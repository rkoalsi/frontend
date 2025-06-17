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
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import formatAddress from '../../src/util/formatAddress';

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
              <Box sx={{ mt: 3 }}>
                <Typography variant='h6'>Shops:</Typography>
                {selectedVisit.shops && selectedVisit.shops.length > 0 ? (
                  selectedVisit.shops.map((shop: any, index: number) => (
                    <Paper key={shop._id} sx={{ p: 2, my: 1 }}>
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
                    </Paper>
                  ))
                ) : (
                  <Typography variant='body2'>No updates available.</Typography>
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
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default DailyVisits;
