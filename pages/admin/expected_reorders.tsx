import React, { useEffect, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import formatAddress from '../../src/util/formatAddress';

const ExpectedReorders = () => {
  // State for expectedReorders data and pagination
  const [expectedReorders, setExpectedReorders] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer]: any = useState(null);
  const [editedCustomer, setEditedCustomer]: any = useState({});

  // Loading states
  const [loading, setLoading] = useState(true);

  // Fetch expectedReorders from the server
  const fetchExpectedReorders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/expected_reorders`, {
        params,
      });
      // The backend returns: { expectedReorders, total_count, total_pages }
      const {
        expected_reorders = [],
        total_count,
        total_pages,
      } = response.data;
      setExpectedReorders(expected_reorders);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching expected reorders.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch expectedReorders when page or rowsPerPage changes
  useEffect(() => {
    fetchExpectedReorders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // Pagination handlers
  const handleChangePage = (event: any, newPage: any) => {
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
    setPage(requestedPage - 1); // convert to 0-based index
    setSkipPage('');
  };

  // Opens dialog for adding a new catalogue.
  const handleDownloadExpectedReorders = async () => {
    try {
      const params = {};

      const response = await axiosInstance.get(
        '/admin/expected_reorders/report',
        {
          params,
          responseType: 'blob', // important for binary data!
        }
      );

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expected_reorders_report.xlsx');
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
        sx={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: 'white',
        }}
      >
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Expected Reorders
          </Typography>
          <Button variant='contained' onClick={handleDownloadExpectedReorders}>
            Download Expected Reorders Report
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all expected reorders below.
        </Typography>
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
            {expectedReorders.length > 0 ? (
              <>
                {/* Expected Reorders Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Created By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expectedReorders.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>
                            {new Date(customer?.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{customer.customer_name}</TableCell>
                          <TableCell>
                            {formatAddress(customer.address)}
                          </TableCell>
                          <TableCell>
                            {customer?.created_by_info?.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination and "Go to page" */}
                <Box
                  display='flex'
                  flexDirection='row'
                  alignItems='end'
                  justifyContent='space-between'
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2,
                      gap: '8px',
                    }}
                  >
                    <TablePagination
                      rowsPerPageOptions={[25, 50, 100, 200]}
                      component='div'
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                    {/* "Go to page" UI */}
                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
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
                  No Expected Reorders
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ExpectedReorders;
