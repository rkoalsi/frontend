import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Switch,
  Button,
  Drawer,
  capitalize,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Customers = () => {
  // Data and loading
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  // "Skip to page" typed by the user; if empty, show actual page
  const [skipPage, setSkipPage] = useState('');

  // Optional client-side search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customer, setSelectedCustomer] = useState<any>(null);

  // Editable fields in the drawer
  const [editMargin, setEditMargin] = useState('');
  const [editInEx, setEditInEx] = useState('');

  // Special margin products
  const [specialMarginProducts, setSpecialMarginProducts] = useState<any[]>([]);

  // Add Special Margin Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // -------------- States for the "Add Special Margin" Product List --------------
  const [dialogLoading, setDialogLoading] = useState(true);
  const [dialogProducts, setDialogProducts] = useState<any[]>([]); // current page
  const [dialogTotalCount, setDialogTotalCount] = useState(0);
  const [dialogPage, setDialogPage] = useState(0);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState(5);
  const [dialogSkipPage, setDialogSkipPage] = useState('');
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

  /**
   * A global dictionary to store product selections across pages:
   *   { [productId]: { selected: boolean, margin: string, name: string } }
   */
  const [globalSelections, setGlobalSelections] = useState<Record<string, any>>(
    {}
  );

  const baseApiUrl = process.env.api_url;

  // ------------------- Fetch All Customers (Main) -------------------
  const getData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseApiUrl}/admin/customers?name=${searchQuery}&page=${page}&limit=${rowsPerPage}`
      );
      const { customers, total_count } = response.data;
      setCustomers(customers);
      console.log(customers);
      setTotalCount(total_count);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Customers');
    } finally {
      setLoading(false);
    }
  };

  // On mount & whenever page or rowsPerPage changes, fetch again
  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, rowsPerPage]);

  // Local filtering by name (client-side)
  const handleSearch = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setPage(0);
  };

  // MUI next/previous page (main table)
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    setSkipPage('');
  };

  // MUI rows-per-page (main table)
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // "Go to page" logic (main table)
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  // ------------------- Drawer (Customer Details) -------------------
  const handleViewDetails = (selectedCust: any) => {
    setSelectedCustomer(selectedCust);
    setEditMargin(selectedCust.cf_margin || '40%');
    setEditInEx(selectedCust.cf_in_ex || 'Exclusive');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomer(null);
    setSpecialMarginProducts([]); // Clear old data
  };

  // Toggle active/inactive
  const handleToggleActive = async (cust: any) => {
    try {
      const updatedFields = {
        status: cust.status === 'active' ? 'inactive' : 'active',
      };

      await axios.put(`${baseApiUrl}/customers/${cust._id}`, updatedFields);

      setCustomers((prev: any) =>
        prev.map((p: any) =>
          p._id === cust._id ? { ...p, ...updatedFields } : p
        )
      );
      setFilteredCustomers((prev: any) =>
        prev.map((p: any) =>
          p._id === cust._id ? { ...p, ...updatedFields } : p
        )
      );

      toast.success(
        `Customer ${cust.contact_name} marked as ${
          updatedFields.status === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer status.');
    }
  };

  // Save changes to margin and inclusive/exclusive
  const handleSaveDrawer = async () => {
    if (!customer) return;

    try {
      const updatedFields = {
        cf_margin: editMargin,
        cf_in_ex: editInEx,
      };

      await axios.put(`${baseApiUrl}/customers/${customer._id}`, updatedFields);

      // Update local states so main table also reflects changes
      setCustomers((prev: any) =>
        prev.map((c: any) =>
          c._id === customer._id ? { ...c, ...updatedFields } : c
        )
      );
      setFilteredCustomers((prev: any) =>
        prev.map((c: any) =>
          c._id === customer._id ? { ...c, ...updatedFields } : c
        )
      );

      toast.success('Customer details updated successfully');
      handleCloseDrawer();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer details.');
    }
  };

  // ------------------- Fetch Special Margins (in Drawer) -------------------
  useEffect(() => {
    if (drawerOpen && customer?._id) {
      (async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${baseApiUrl}/admin/customer/special_margins/${customer._id}`
          );
          const { products = [] } = response.data;
          setSpecialMarginProducts(products);
          const updatedSelections = { ...globalSelections };
          for (const item of products) {
            updatedSelections[item.product_id] = {
              selected: true,
              name: item.name,
              margin: item.margin,
            };
          }
          setGlobalSelections(updatedSelections);
        } catch (err) {
          console.error(err);
          toast.error('Error Fetching Products With Special Margin');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [drawerOpen, customer, baseApiUrl]);

  // Delete a special margin product
  const handleDeleteSpecialMargin = async (prod: any) => {
    if (!customer?._id) return;
    try {
      await axios.delete(
        `${baseApiUrl}/admin/customer/special_margins/${customer._id}/${prod._id}`
      );
      setSpecialMarginProducts((prev) =>
        prev.filter((p) => p._id !== prod._id)
      );
      toast.success('Special margin deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete special margin product');
    }
  };

  // -------------- "Add Special Margin" Dialog Logic --------------
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setDialogPage(0);
    setDialogRowsPerPage(5);
    setDialogSkipPage('');
    setDialogSearchQuery('');
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setDialogProducts([]);
    setDialogLoading(true);
  };

  // -------------- Fetch Products for Dialog (Paginated) --------------
  const fetchDialogProducts = async () => {
    setDialogLoading(true);
    try {
      // server does actual searching & paging
      const response = await axios.get(
        `${baseApiUrl}/admin/products?search=${dialogSearchQuery}&page=${dialogPage}&limit=${dialogRowsPerPage}`
      );

      const { products: prodList, total_count } = response.data;
      setDialogTotalCount(total_count);

      const mapped = prodList.map((p: any) => {
        const selectionInfo = globalSelections[p._id] || {
          selected: false,
          margin: '',
          name: p.name,
        };
        return {
          ...p,
          selected: selectionInfo.selected,
          customMargin: selectionInfo.margin,
        };
      });

      setDialogProducts(mapped);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Products');
    } finally {
      setDialogLoading(false);
    }
  };

  // On page/rowsPerPage change in the dialog, re-fetch
  useEffect(() => {
    if (addDialogOpen) {
      fetchDialogProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addDialogOpen, dialogPage, dialogRowsPerPage]);

  // Dialog search logic (client-side)
  const handleDialogSearch = (e: any) => {
    setDialogSearchQuery(e.target.value.toLowerCase());
    setDialogPage(0);
  };

  // Filter the displayed products by search (only on the current page’s products)
  const getFilteredDialogProducts = () => {
    if (!dialogSearchQuery.trim()) return dialogProducts;
    return dialogProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(dialogSearchQuery) ||
        p.cf_sku_code?.toLowerCase().includes(dialogSearchQuery)
    );
  };

  // Pagination (dialog) handlers
  const handleDialogChangePage = (event: any, newPage: number) => {
    setDialogPage(newPage);
    setDialogSkipPage('');
  };

  const handleDialogChangeRowsPerPage = (event: any) => {
    setDialogRowsPerPage(parseInt(event.target.value, 10));
    setDialogPage(0);
    setDialogSkipPage('');
  };

  const handleDialogSkipPage = () => {
    const requestedPage = parseInt(dialogSkipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setDialogPage(requestedPage - 1);
    setDialogSkipPage('');
  };

  // -------------- Selection & Margin Handlers (Dialog) --------------
  const handleSelectProduct = (prodId: string, newSelected: boolean) => {
    // Find the product in our current page's dialogProducts
    const product = dialogProducts.find((p) => p._id === prodId);

    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        // Use any existing data, or default to empty object
        ...(prev[prodId] || {}),
        // Always store the product name
        name: product ? product.name : '',
        // Update selection
        selected: newSelected,
      },
    }));

    // Also update local dialogProducts array to reflect selection state
    setDialogProducts((prev) =>
      prev.map((p) => (p._id === prodId ? { ...p, selected: newSelected } : p))
    );
  };

  const handleMarginChange = (prodId: string, rawValue: string) => {
    // Ensure the product is found so we can store the name
    const product = dialogProducts.find((p) => p._id === prodId);

    // Strip out an existing '%' and append it back
    const stripped = rawValue.replace('%', '').trim();
    const withPercent = stripped ? stripped + '%' : '';

    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        // Preserve existing fields
        ...(prev[prodId] || {}),
        // Always store the name
        name: product ? product.name : '',
        // Whenever margin changes, auto-select the product
        selected: true,
        margin: withPercent,
      },
    }));

    // Update local state so user sees the changes in the UI
    setDialogProducts((prev) =>
      prev.map((p) =>
        p._id === prodId
          ? { ...p, selected: true, customMargin: withPercent }
          : p
      )
    );
  };

  // -------------- Bulk Save --------------
  const handleBulkSaveMargins = async () => {
    if (!customer?._id) return;

    // Gather from globalSelections any item that is .selected === true
    const selectedItems = Object.entries(globalSelections).filter(
      ([, val]) => val.selected
    );
    console.log(selectedItems);

    if (!selectedItems.length) {
      toast.error('No products selected');
      return;
    }

    // Validate margins
    for (const [prodId, info] of selectedItems) {
      if (!info.margin || !info.margin.replace('%', '').trim()) {
        toast.error(`Please enter margin for product: ${info.name}`);
        return;
      }
    }

    let successCount = 0;
    // One request per product or use your /bulk endpoint
    for (const [prodId, info] of selectedItems) {
      try {
        const payload = {
          product_id: prodId,
          name: info.name,
          margin: info.margin,
        };
        await axios.post(
          `${baseApiUrl}/admin/customer/special_margins/${customer._id}`,
          payload
        );
        successCount++;
      } catch (err) {
        console.error(err);
        toast.error(`Failed to add margin for product: ${info.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(
        `Successfully added special margin for ${successCount} product(s)`
      );
      // Refresh the special margins in the drawer
      try {
        const response = await axios.get(
          `${baseApiUrl}/admin/customer/special_margins/${customer._id}`
        );
        const { products = [] } = response.data;
        setSpecialMarginProducts(products);
      } catch (error) {
        console.error(error);
      }
    }

    // Close the dialog
    handleCloseAddDialog();
  };

  // --------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------
  const filteredDialog = getFilteredDialogProducts();

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
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          All Customers
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all customers.
        </Typography>

        {/* Search Bar (client-side) */}
        <TextField
          label='Search by Name'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: 3 }}
        />

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
            {/* Table */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflowX: 'auto',
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Sales Person</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Margin</TableCell>
                    <TableCell>Inclusive/Exclusive</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((cust: any) => (
                    <TableRow key={cust._id}>
                      <TableCell>{cust.contact_name}</TableCell>
                      <TableCell>{cust.cf_sales_person || 'N/A'}</TableCell>
                      <TableCell>
                        {cust.customer_sub_type
                          ? capitalize(cust.customer_sub_type)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{cust.cf_margin || '40%'}</TableCell>
                      <TableCell>{cust.cf_in_ex || 'Exclusive'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={cust.status === 'active'}
                          onChange={() => handleToggleActive(cust)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='outlined'
                          onClick={() => handleViewDetails(cust)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination + "Go to page" */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                count={searchQuery ? filteredCustomers.length : totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />

              {/* "Go to page" field + button */}
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label='Go to page'
                  type='number'
                  variant='outlined'
                  size='small'
                  sx={{ width: 100, mr: 1 }}
                  value={skipPage !== '' ? skipPage : page + 1}
                  onChange={(e) => setSkipPage(e.target.value)}
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
          </>
        )}

        {/* Drawer for Customer Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 400,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{ fontWeight: 'bold', marginBottom: 2 }}
            >
              Customer Details
            </Typography>

            {customer && (
              <>
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Customer Name:</strong> {customer.contact_name}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {capitalize(customer.status)}
                  </Typography>
                  <Typography>
                    <strong>GST Number:</strong> {customer.gst_no || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong>{' '}
                    {customer.customer_sub_type
                      ? capitalize(customer.customer_sub_type)
                      : 'N/A'}
                  </Typography>

                  {/* Editable Margin */}
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label='Margin'
                      variant='outlined'
                      value={editMargin}
                      onChange={(e) => setEditMargin(e.target.value)}
                    />
                  </Box>

                  {/* Editable In/Ex */}
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id='cf-in-ex-label'>GST Treatment</InputLabel>
                      <Select
                        labelId='cf-in-ex-label'
                        value={editInEx}
                        label='GST Treatment'
                        onChange={(e) => setEditInEx(e.target.value)}
                      >
                        <MenuItem value='Inclusive'>Inclusive</MenuItem>
                        <MenuItem value='Exclusive'>Exclusive</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Typography sx={{ mt: 2 }}>
                    <strong>Sales Person:</strong>{' '}
                    {customer.cf_sales_person || 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleString()
                      : new Date(customer.created_time).toLocaleString()}
                  </Typography>
                </Box>

                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', marginBottom: 2 }}
                >
                  Special Margin Products
                </Typography>

                {/* "Add Special Margin" button -> opens product-list dialog */}
                <Button
                  variant='contained'
                  sx={{ mb: 2 }}
                  onClick={handleOpenAddDialog}
                >
                  Add Special Margin
                </Button>

                <TableContainer component={Paper}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Custom Margin</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {specialMarginProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>No products found</TableCell>
                        </TableRow>
                      ) : (
                        specialMarginProducts.map((prod: any) => (
                          <TableRow key={prod._id}>
                            <TableCell>{prod.name}</TableCell>
                            <TableCell>{prod.margin}</TableCell>
                            <TableCell>
                              <Button
                                variant='outlined'
                                color='error'
                                onClick={() => handleDeleteSpecialMargin(prod)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Save changes */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant='contained' onClick={handleSaveDrawer}>
                    Save Changes
                  </Button>
                  <Button variant='outlined' onClick={handleCloseDrawer}>
                    Cancel
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Drawer>
      </Paper>

      {/* Dialog: Add Special Margin (shows list of all products w/pagination) */}
      <Dialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>Add Special Margin to Products</DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          <TextField
            label='Search by Name or SKU'
            variant='outlined'
            fullWidth
            value={dialogSearchQuery}
            onChange={handleDialogSearch}
            sx={{ marginBottom: 3, marginTop: 1 }}
          />

          {dialogLoading ? (
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
              {/* Products Table */}
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  overflowX: 'auto',
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Select</TableCell>
                      <TableCell>Image</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Custom Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDialog.map((prod: any) => (
                      <TableRow key={prod._id}>
                        <TableCell>
                          <Checkbox
                            checked={prod.selected}
                            onChange={() =>
                              handleSelectProduct(prod._id, !prod.selected)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={prod.image_url || '/placeholder.png'}
                            alt={prod.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                            }}
                          />
                        </TableCell>
                        <TableCell>{prod.name}</TableCell>
                        <TableCell>{prod.cf_sku_code}</TableCell>
                        <TableCell>₹{prod.rate}</TableCell>
                        <TableCell>
                          <TextField
                            placeholder='e.g. 45%'
                            value={prod.customMargin}
                            onChange={(e) =>
                              handleMarginChange(prod._id, e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component='div'
                  // We only know total_count for the entire dataset, so if the user is searching,
                  // we can do client-side filtering of this page's results. For a large dataset,
                  // you might do server-side searching instead.
                  count={
                    dialogSearchQuery ? filteredDialog.length : dialogTotalCount
                  }
                  rowsPerPage={dialogRowsPerPage}
                  page={dialogPage}
                  onPageChange={handleDialogChangePage}
                  onRowsPerPageChange={handleDialogChangeRowsPerPage}
                />

                {/* "Go to page" field + button */}
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  <TextField
                    label='Go to page'
                    type='number'
                    variant='outlined'
                    size='small'
                    sx={{ width: 100, mr: 1 }}
                    value={
                      dialogSkipPage !== '' ? dialogSkipPage : dialogPage + 1
                    }
                    onChange={(e) => setDialogSkipPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDialogSkipPage();
                      }
                    }}
                  />
                  <Button variant='contained' onClick={handleDialogSkipPage}>
                    Go
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button variant='contained' onClick={handleBulkSaveMargins}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
