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
  Stack,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import axios from 'axios';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Colour for a credit note status chip
const creditNoteStatusColor = (
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch ((status || '').toLowerCase()) {
    case 'open':
      return 'warning';
    case 'closed':
      return 'success';
    case 'void':
      return 'error';
    case 'draft':
      return 'info';
    default:
      return 'default';
  }
};

const PaymentsDue = () => {
  const theme = useTheme();
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

  // Follow-up fields edited in the drawer
  const [spRemarks, setSpRemarks] = useState('');
  const [paymentClearedDetails, setPaymentClearedDetails] = useState('');
  const [expectedPaymentDate, setExpectedPaymentDate]: any = useState(null);
  const [officeTeamRemarks, setOfficeTeamRemarks] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [agingStats, setAgingStats] = useState<{
    current: { count: number; balance: number };
    overdue30: { count: number; balance: number };
    overdue60: { count: number; balance: number };
  }>({
    current: { count: 0, balance: 0 },
    overdue30: { count: 0, balance: 0 },
    overdue60: { count: 0, balance: 0 },
  });

  // New sort state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const fetchAgingStats = async (salesPerson: string) => {
    try {
      let url = '/admin/payments_due/aging_stats';
      if (salesPerson) url += `?sales_person=${encodeURIComponent(salesPerson)}`;
      const { data: stats } = await axiosInstance.get(url);
      setAgingStats(stats);
    } catch {
      // non-critical, leave at 0
    }
  };

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
    if (page === 0) fetchAgingStats(appliedSalesPersonFilter);
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
    const notes = order.invoice_notes || {};
    setSpRemarks(notes.sp_remarks || '');
    setPaymentClearedDetails(notes.payment_cleared_details || '');
    setExpectedPaymentDate(
      notes.expected_payment_date ? new Date(notes.expected_payment_date) : null
    );
    setOfficeTeamRemarks(notes.office_team_remarks || '');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedOrder) return;
    try {
      setSavingFollowUp(true);
      await axiosInstance.patch('/invoices/notes/fields', {
        invoice_number: selectedOrder.invoice_number,
        sp_remarks: spRemarks,
        payment_cleared_details: paymentClearedDetails,
        expected_payment_date: expectedPaymentDate
          ? expectedPaymentDate.toISOString()
          : '',
        office_team_remarks: officeTeamRemarks,
      });
      toast.success('Follow-up details saved');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Error saving follow-up details');
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Handler to download XLSX of all payments due
  const handleDownloadXLSX = async () => {
    try {
      let url = `/admin/payments_due/download_xlsx?sales_person=${encodeURIComponent(
        appliedSalesPersonFilter
      )}`;
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'payments_due.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading XLSX');
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


  const getRowStyle = (overdueDays: number) => {
    if (overdueDays > 60) return { backgroundColor: alpha('#d32f2f', 0.08) };
    if (overdueDays > 30) return { backgroundColor: alpha('#f57c00', 0.08) };
    return {};
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
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
                {salesPeople.map((person: any) => {
                  const label = person?.name ?? person;
                  const value = person?.code ?? person;
                  const key = person?._id ?? person;
                  return (
                    <MenuItem key={key} value={value}>
                      {label}{person?.code ? ` (${person.code})` : ''}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Button variant='contained' onClick={handleDownloadXLSX}>
              Download XLSX
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
                {/* Aging Buckets Summary */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: '0 – 30 days', count: agingStats.current.count, balance: agingStats.current.balance, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.08) },
                    { label: '31 – 60 days', count: agingStats.overdue30.count, balance: agingStats.overdue30.balance, color: theme.palette.error.light, bg: alpha('#f57c00', 0.08) },
                    { label: '60+ days', count: agingStats.overdue60.count, balance: agingStats.overdue60.balance, color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.08) },
                  ].map(({ label, count, balance, color, bg }) => (
                    <Paper key={label} elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, border: `1px solid ${color}40`, backgroundColor: bg }}>
                      <Typography variant='caption' fontWeight={600} sx={{ color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                      <Typography variant='h5' fontWeight={700} sx={{ color, my: 0.5 }}>{count}</Typography>
                      <Typography variant='body2' color='text.secondary'>₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                    </Paper>
                  ))}
                </Stack>

                {/* Legend */}
                <Stack direction='row' spacing={1.5} sx={{ mb: 1.5 }} alignItems='center'>
                  <Typography variant='caption' color='text.secondary'>Row colour:</Typography>
                  <Chip size='small' label='0–30 days' sx={{ backgroundColor: alpha('#f57c00', 0.12), color: '#e65100', fontWeight: 600, fontSize: '0.65rem' }} />
                  <Chip size='small' label='60+ days' sx={{ backgroundColor: alpha('#d32f2f', 0.12), color: '#c62828', fontWeight: 600, fontSize: '0.65rem' }} />
                </Stack>

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
                        <TableCell>Follow-up</TableCell>
                        <TableCell
                          onClick={() => handleSort('open_credit_note_amt')}
                          style={{ cursor: 'pointer' }}
                        >
                          Open Credit Note Amt.
                          {renderSortIndicator('open_credit_note_amt')}
                        </TableCell>
                        <TableCell>Credit Notes</TableCell>
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
                          open_credit_note_amt = 0,
                          associated_credit_notes = [],
                        } = invoice;
                        const invoiceDueDate = new Date(due_date);
                        invoiceDueDate.setHours(0, 0, 0, 0);
                        const invoiceNotes = invoice.invoice_notes || {};
                        const {
                          additional_info = '',
                          images = [],
                          sp_remarks = '',
                          expected_payment_date = '',
                          office_team_remarks = '',
                        } = invoiceNotes;
                        return (
                          <TableRow key={_id} sx={getRowStyle(parseInt(overdue_by_days) || 0)}>
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
                              {sp_remarks || expected_payment_date ? (
                                <Chip
                                  size='small'
                                  label={
                                    expected_payment_date
                                      ? new Date(
                                          expected_payment_date
                                        ).toLocaleDateString()
                                      : 'Added'
                                  }
                                  color='info'
                                  variant='outlined'
                                />
                              ) : (
                                '-'
                              )}
                              {office_team_remarks && (
                                <Chip
                                  size='small'
                                  label='Office note'
                                  sx={{ ml: 0.5 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {open_credit_note_amt > 0
                                ? `₹${Number(open_credit_note_amt).toLocaleString(
                                    'en-IN',
                                    { maximumFractionDigits: 0 }
                                  )}`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {associated_credit_notes.length > 0 ? (
                                <Box
                                  display='flex'
                                  flexDirection='column'
                                  gap={0.5}
                                  sx={{ minWidth: 140 }}
                                >
                                  {associated_credit_notes.map((cn: any) => (
                                    <Chip
                                      key={cn.creditnote_id}
                                      size='small'
                                      color={creditNoteStatusColor(cn.status)}
                                      variant='outlined'
                                      label={`${cn.creditnote_number} · ₹${Number(
                                        cn.balance ?? cn.total ?? 0
                                      ).toLocaleString('en-IN', {
                                        maximumFractionDigits: 0,
                                      })} · ${cn.status}`}
                                      sx={{ fontSize: '0.68rem', justifyContent: 'flex-start' }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                '-'
                              )}
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
                {selectedOrder?.associated_credit_notes?.length > 0 && (
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography
                      variant='h6'
                      sx={{
                        fontWeight: 'bold',
                        marginBottom: 1,
                        fontFamily: 'Roboto, sans-serif',
                      }}
                    >
                      Associated Credit Notes
                    </Typography>
                    <Box display='flex' flexDirection='column' gap={1}>
                      {selectedOrder.associated_credit_notes.map((cn: any) => (
                        <Box
                          key={cn.creditnote_id}
                          display='flex'
                          alignItems='center'
                          justifyContent='space-between'
                          gap={1}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {cn.creditnote_number}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {cn.date
                                ? new Date(cn.date).toLocaleDateString()
                                : ''}{' '}
                              · Open ₹
                              {Number(cn.balance ?? 0).toLocaleString('en-IN', {
                                maximumFractionDigits: 2,
                              })}{' '}
                              of ₹
                              {Number(cn.total ?? 0).toLocaleString('en-IN', {
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Box>
                          <Chip
                            size='small'
                            color={creditNoteStatusColor(cn.status)}
                            label={capitalize(cn.status || '')}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 'bold',
                      marginBottom: 1,
                      fontFamily: 'Roboto, sans-serif',
                    }}
                  >
                    Payment Follow-up
                  </Typography>
                  {selectedOrder?.open_credit_note_amt > 0 && (
                    <Chip
                      size='small'
                      color='success'
                      variant='outlined'
                      sx={{ mb: 2, fontWeight: 600 }}
                      label={`Open Credit Note Amt.: ₹${Number(
                        selectedOrder.open_credit_note_amt
                      ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    />
                  )}
                  <Box display='flex' flexDirection='column' gap={2}>
                    <TextField
                      label='SP Remarks'
                      multiline
                      minRows={2}
                      fullWidth
                      value={spRemarks}
                      onChange={(e) => setSpRemarks(e.target.value)}
                    />
                    <TextField
                      label='Payment Cleared - Details'
                      multiline
                      minRows={2}
                      fullWidth
                      value={paymentClearedDetails}
                      onChange={(e) => setPaymentClearedDetails(e.target.value)}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label='Expected Payment Date'
                        format='dd-MM-yyyy'
                        value={expectedPaymentDate}
                        onChange={(date) => setExpectedPaymentDate(date)}
                        enableAccessibleFieldDOMStructure={false}
                        slots={{ textField: TextField }}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                    <TextField
                      label='Office Team Remarks'
                      multiline
                      minRows={2}
                      fullWidth
                      value={officeTeamRemarks}
                      onChange={(e) => setOfficeTeamRemarks(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      onClick={handleSaveFollowUp}
                      disabled={savingFollowUp}
                    >
                      {savingFollowUp ? 'Saving...' : 'Save Follow-up'}
                    </Button>
                  </Box>
                </Box>
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
