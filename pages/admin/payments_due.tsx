import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Checkbox,
  Input,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import axios from 'axios';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const PaymentsDue = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0); // 0-based current page
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0); // total number of data from backend
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [salesPeople, setSalesPeople] = useState<any[]>([]);
  const [appliedSalesPersonFilter, setAppliedSalesPersonFilter] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [popupImageSrc, setPopupImageSrc] = useState<string>('');

  // New sort state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Fetch data from the server
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/admin/payments_due?page=${page}&limit=${rowsPerPage}`;
      if (appliedSalesPersonFilter) {
        url += `&sales_person=${encodeURIComponent(appliedSalesPersonFilter)}`;
      }
      if (invoiceNumber) {
        url += `&invoice_number=${encodeURIComponent(invoiceNumber)}`;
      }
      const response = await axiosInstance.get(url);
      // The backend returns { invoices, total_count, total_pages }
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

  // Re-fetch data whenever page, rowsPerPage, or filters change
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, appliedSalesPersonFilter, invoiceNumber]);

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
    setSkipPage('');
  };

  const downloadAsPDF = async (invoice: any) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/invoices/download_pdf/${invoice._id}`,
        {
          responseType: 'blob', // Receive the response as binary data
        }
      );

      if (resp.data.type !== 'application/pdf') {
        toast.error('Invoice Not Created');
        return;
      }

      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${invoice.invoice_number}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  // Drawer logic
  const handleViewDetails = (order: any) => {
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
      let url = `/admin/payments_due/download_csv?sales_person=${encodeURIComponent(
        appliedSalesPersonFilter
      )}`;
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });
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

  const onClickImage = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);

  // Handler for sorting when a column header is clicked.
  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === columnKey &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  // Memoized sorted data with support for nested values
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const sorted = [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      // Check for nested fields first
      if (sortConfig.key === 'additional_info') {
        aVal = a.invoice_notes?.additional_info || '';
        bVal = b.invoice_notes?.additional_info || '';
      } else if (sortConfig.key === 'images') {
        // Sort based on number of images uploaded
        aVal = a.invoice_notes?.images?.length || 0;
        bVal = b.invoice_notes?.images?.length || 0;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];

        // Handle dates if applicable
        if (sortConfig.key === 'created_at' || sortConfig.key === 'due_date') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  // A helper function to show sort indicator
  const renderSortIndicator = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
          backgroundColor: 'white',
        }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
          mb={2}
        >
          <Typography
            variant='h4'
            gutterBottom
            sx={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            All Payments Due
          </Typography>
          <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} width={{ xs: '100%', sm: '50%' }} gap={2}>
            <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
              <InputLabel id='invoice-number-filter-label'>
                Search By Invoice Number
              </InputLabel>
              <Input onChange={(e: any) => setInvoiceNumber(e.target.value)} />
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
              <InputLabel id='sales-person-filter-label'>
                Sales Person
              </InputLabel>
              <Select
                labelId='sales-person-filter-label'
                id='sales-person-filter'
                value={appliedSalesPersonFilter}
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
                {/* Data Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {/* Sortable Headers */}
                        <TableCell
                          onClick={() => handleSort('created_at')}
                          style={{ cursor: 'pointer' }}
                        >
                          Created At{renderSortIndicator('created_at')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('due_date')}
                          style={{ cursor: 'pointer' }}
                        >
                          Due Date{renderSortIndicator('due_date')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('invoice_number')}
                          style={{ cursor: 'pointer' }}
                        >
                          Invoice Number{renderSortIndicator('invoice_number')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('overdue_by_days')}
                          style={{ cursor: 'pointer' }}
                        >
                          Overdue By{renderSortIndicator('overdue_by_days')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('customer_name')}
                          style={{ cursor: 'pointer' }}
                        >
                          Customer Name{renderSortIndicator('customer_name')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('status')}
                          style={{ cursor: 'pointer' }}
                        >
                          Status{renderSortIndicator('status')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('cf_sales_person')}
                          style={{ cursor: 'pointer' }}
                        >
                          Sales Person{renderSortIndicator('cf_sales_person')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('created_by_name')}
                          style={{ cursor: 'pointer' }}
                        >
                          Created By{renderSortIndicator('created_by_name')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('total')}
                          style={{ cursor: 'pointer' }}
                        >
                          Total Amount{renderSortIndicator('total')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('balance')}
                          style={{ cursor: 'pointer' }}
                        >
                          Balance{renderSortIndicator('balance')}
                        </TableCell>
                        {/* Now sortable additional columns */}
                        <TableCell
                          onClick={() => handleSort('additional_info')}
                          style={{ cursor: 'pointer' }}
                        >
                          Additional Information
                          {renderSortIndicator('additional_info')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('images')}
                          style={{ cursor: 'pointer' }}
                        >
                          Image Uploaded{renderSortIndicator('images')}
                        </TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedData.map((invoice: any) => {
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
                        const invoiceNotes = invoice.invoice_notes || {};
                        const { additional_info = '', images = [] } =
                          invoiceNotes;
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
                              <Checkbox
                                checked={additional_info !== ''}
                                disabled
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox checked={images.length > 0} disabled />
                            </TableCell>
                            <TableCell>
                              <Box
                                display={'flex'}
                                flexDirection={'row'}
                                gap={'8px'}
                              >
                                <Button
                                  variant='contained'
                                  onClick={() => handleViewDetails(invoice)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  color={'secondary'}
                                  variant='contained'
                                  onClick={() => downloadAsPDF(invoice)}
                                >
                                  Download Invoice
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
                {selectedOrder?.invoice_notes && (
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography>
                      <strong>Invoice Notes:</strong>
                      <br />
                      Additional Information:{' '}
                      {selectedOrder?.invoice_notes?.additional_info}
                      <br />
                      {selectedOrder?.invoice_notes?.images?.length > 0
                        ? selectedOrder?.invoice_notes?.images?.map(
                            (img: string, index: number) => (
                              <Box
                                onClick={() => onClickImage(img)}
                                key={index}
                                position='relative'
                                mr={1}
                                mb={1}
                                width={100}
                                height={100}
                              >
                                <img
                                  src={img}
                                  alt={`existing-${index}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                  }}
                                />
                              </Box>
                            )
                          )
                        : 'No Image(s) Uploaded'}
                      <br />
                      Invoice Note Created By:{' '}
                      {selectedOrder?.note_created_by_name}
                    </Typography>
                  </Box>
                )}
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
      <SingleImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default PaymentsDue;
