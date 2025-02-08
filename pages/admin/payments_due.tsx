import { useEffect, useState } from 'react';
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
  Drawer,
  capitalize,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const PaymentsDue = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0); // 0-based current page
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0); // total number of data from backend
  const [totalPagesCount, setTotalPagesCount] = useState(0); // total number of data from backend
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [salesPeople, setSalesPeople] = useState([]);
  const [appliedSalesPersonFilter, setAppliedSalesPersonFilter] = useState('');
  // Fetch data from the server
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/admin/payments_due?page=${page}&limit=${rowsPerPage}`;
      if (appliedSalesPersonFilter) {
        url += `&sales_person=${encodeURIComponent(appliedSalesPersonFilter)}`;
      }
      const response = await axiosInstance.get(url);

      // The backend returns { data, total_count }
      const { invoices, total_count, total_pages } = response.data;

      setData(invoices);
      setTotalCount(total_count);
      setTotalPagesCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await axiosInstance.get(`/admin/sales-people`);
        setSalesPeople(response.data.sales_people);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching sales people.');
      }
    };

    fetchSalesPeople();
  }, []);
  // Re-fetch data whenever page or rowsPerPage changes
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, appliedSalesPersonFilter]);

  // MUI Pagination: next/previous
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    setSkipPage(''); // reset skipPage so text field shows the new page
  };

  // MUI Pagination: rows per page
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // "Go to page" button or Enter
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    // Our internal page is 0-based; user typed 1-based
    setPage(requestedPage - 1);
    setSkipPage(''); // clear input so it displays the new page on next render
  };

  // Drawer logic
  const handleViewDetails = (order: any) => {
    console.log(order);
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  // Handler to download CSV of all payments due
  const handleDownloadCSV = async () => {
    try {
      let url = '/admin/payments_due/download_csv';
      if (appliedSalesPersonFilter) {
        url += `?sales_person=${encodeURIComponent(appliedSalesPersonFilter)}`;
      }
      const response = await axiosInstance.get(url, {
        responseType: 'blob', // important for binary responses
      });
      // Create a URL for the blob and simulate a link click to download
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'payments_due.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading CSV');
    }
  };
  // Handler to apply the sales person filter
  const handleApplyFilter = (value: string) => {
    setAppliedSalesPersonFilter(value);
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
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h4'
            gutterBottom
            sx={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
            }}
          >
            All Payments Due
          </Typography>
          <Box display='flex' width={'30%'} gap={2}>
            <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
              <InputLabel id='sales-person-filter-label'>
                Sales Person
              </InputLabel>
              <Select
                labelId='sales-person-filter-label'
                id='sales-person-filter'
                value={appliedSalesPersonFilter}
                // disabled={filterUnassigned}
                label='Sales Person'
                onChange={(e) => {
                  handleApplyFilter(e.target.value);
                }}
              >
                <MenuItem value=''>All</MenuItem>
                {salesPeople.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant='contained' onClick={handleDownloadCSV}>
              Download CSV
            </Button>
          </Box>
        </Box>

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
            {data.length > 0 ? (
              <>
                {/* data Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Overdue By</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sales Person</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map((invoice: any) => {
                        const {
                          _id = '',
                          created_at = new Date(),
                          due_date = new Date(),
                          invoice_number = '',
                          customer_name = '',
                          status = '',
                          cf_sales_person = '',
                          salesperson_name = '',
                          created_by_name = '',
                          total = 0,
                          balance = 0,
                          overdue_by_days = 0,
                        } = invoice;
                        const invoiceDueDate = new Date(due_date);
                        invoiceDueDate.setHours(0, 0, 0, 0);

                        return (
                          <TableRow key={_id}>
                            <TableCell>
                              {new Date(created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {invoiceDueDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>{invoice_number}</TableCell>
                            <TableCell>
                              {parseInt(overdue_by_days) === 1
                                ? `${overdue_by_days} day`
                                : `${overdue_by_days} days`}
                            </TableCell>
                            <TableCell>{customer_name}</TableCell>
                            <TableCell>{capitalize(status)}</TableCell>
                            <TableCell>
                              {cf_sales_person || salesperson_name || '-'}
                            </TableCell>
                            <TableCell>{created_by_name}</TableCell>
                            <TableCell>₹{total || 0}</TableCell>
                            <TableCell>₹{balance || 0}</TableCell>
                            <TableCell>
                              <Box
                                display={'flex'}
                                flexDirection={'row'}
                                gap={'8px'}
                              >
                                <Button
                                  variant='outlined'
                                  onClick={() => handleViewDetails(invoice)}
                                >
                                  View Details
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination + "Go to page" */}
                <Box
                  display={'flex'}
                  flexDirection={'row'}
                  alignItems={'end'}
                  justifyContent={'space-between'}
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
                      // totalCount from server
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />

                    {/* "Go to page" UI */}
                    <Box
                      sx={{
                        ml: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 100, mr: 1 }}
                        // If user typed something, show that; otherwise, current page + 1
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) =>
                          parseInt(e.target.value) <= totalPagesCount
                            ? setSkipPage(e.target.value)
                            : toast.error('Page is out of index')
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
              <Box
                display={'flex'}
                justifyContent={'center'}
                alignItems={'center'}
              >
                <Typography variant='h5' fontWeight={'bold'}>
                  No data Created
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Drawer for Order Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 500,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{
                fontWeight: 'bold',
                marginBottom: 2,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              Order Details
            </Typography>
            {selectedOrder && (
              <>
                {/* Order Info */}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Invoice Number:</strong>{' '}
                    {selectedOrder.invoice_number}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong>{' '}
                    {selectedOrder.status
                      ? capitalize(selectedOrder.status)
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Created By:</strong>{' '}
                    {selectedOrder.created_by_name || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Total Amount:</strong> ₹
                    {selectedOrder.total || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Balance:</strong> ₹{selectedOrder.balance || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>Due Date:</strong>{' '}
                    {new Date(selectedOrder.due_date).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Products Section */}
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 2,
                    fontFamily: 'Roboto, sans-serif',
                  }}
                >
                  Products
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.line_items?.map((product: any) => (
                        <TableRow key={product.item_id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>₹{product.rate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Drawer>
      </Paper>
    </Box>
  );
};

export default PaymentsDue;
