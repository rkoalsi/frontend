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

// Utility function to capitalize strings
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Customers = () => {
  // --------------------- Main Table States ---------------------
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states for main table
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  // "Skip to page" input for main table
  const [skipPage, setSkipPage] = useState('');

  // Client-side search for main table
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // --------------------- Drawer States ---------------------
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Editable fields in the drawer
  const [editMargin, setEditMargin] = useState('');
  const [editInEx, setEditInEx] = useState('');

  // Special margin products
  const [specialMarginProducts, setSpecialMarginProducts] = useState<any[]>([]);

  // --------------------- "Add Special Margin" Dialog States ---------------------
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // States for the "Add Special Margin" Product List
  const [dialogLoading, setDialogLoading] = useState(true);
  const [dialogProducts, setDialogProducts] = useState<any[]>([]); // Current page products
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

  // --------------------- Fetch All Customers (Main Table) ---------------------
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

  // On mount & whenever page, rowsPerPage, or searchQuery changes, fetch again
  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, rowsPerPage]);

  // Handle client-side search for main table
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setPage(0);
  };

  // Handle page change for main table
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSkipPage('');
  };

  // Handle rows per page change for main table
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // Handle "Go to page" for main table
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  // --------------------- Drawer (Customer Details) Functions ---------------------
  const handleViewDetails = (cust: any) => {
    setSelectedCustomer(cust);
    setEditMargin(cust.cf_margin || '40%');
    setEditInEx(cust.cf_in_ex || 'Exclusive');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomer(null);
    setSpecialMarginProducts([]); // Clear old data
    setGlobalSelections({}); // Reset globalSelections
  };

  // Toggle active/inactive status for a customer
  const handleToggleActive = async (cust: any) => {
    try {
      const updatedFields = {
        status: cust.status === 'active' ? 'inactive' : 'active',
      };

      await axios.put(`${baseApiUrl}/customers/${cust._id}`, updatedFields);

      // Update local customer list
      setCustomers((prev: any[]) =>
        prev.map((p: any) =>
          p._id === cust._id ? { ...p, ...updatedFields } : p
        )
      );
      setFilteredCustomers((prev: any[]) =>
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
    if (!selectedCustomer) return;

    try {
      const updatedFields = {
        cf_margin: editMargin,
        cf_in_ex: editInEx,
      };

      await axios.put(
        `${baseApiUrl}/customers/${selectedCustomer._id}`,
        updatedFields
      );

      // Update local customer list
      setCustomers((prev: any[]) =>
        prev.map((c: any) =>
          c._id === selectedCustomer._id ? { ...c, ...updatedFields } : c
        )
      );
      setFilteredCustomers((prev: any[]) =>
        prev.map((c: any) =>
          c._id === selectedCustomer._id ? { ...c, ...updatedFields } : c
        )
      );

      toast.success('Customer details updated successfully');
      handleCloseDrawer();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer details.');
    }
  };

  // --------------------- Fetch Special Margins (in Drawer) ---------------------
  useEffect(() => {
    if (drawerOpen && selectedCustomer?._id) {
      (async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${baseApiUrl}/admin/customer/special_margins/${selectedCustomer._id}`
          );
          const { products = [] } = response.data;
          setSpecialMarginProducts(products);

          // Initialize globalSelections using product_id
          const updatedSelections: Record<string, any> = {};
          products.forEach((p: any) => {
            updatedSelections[p.product_id] = {
              // Changed from p._id to p.product_id
              selected: true,
              name: p.name,
              margin: p.margin,
            };
          });
          setGlobalSelections(updatedSelections);
        } catch (err) {
          console.error(err);
          toast.error('Error Fetching Products With Special Margin');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [drawerOpen, selectedCustomer, baseApiUrl]);

  // --------------------- Handle Deletion of Special Margin Product ---------------------
  const handleDeleteSpecialMargin = async (prod: any) => {
    if (!selectedCustomer?._id) return;
    try {
      await axios.delete(
        `${baseApiUrl}/admin/customer/special_margins/${selectedCustomer._id}/${prod._id}`
      );
      setSpecialMarginProducts((prev) =>
        prev.filter((p) => p._id !== prod._id)
      );
      toast.success('Special margin deleted successfully');

      // **Remove the product from globalSelections using product_id**
      setGlobalSelections((prev) => {
        const updatedSelections = { ...prev };
        delete updatedSelections[prod.product_id]; // Changed from p._id to p.product_id
        return updatedSelections;
      });

      // **If the dialog is open, update dialogProducts to uncheck the deleted product**
      if (addDialogOpen) {
        setDialogProducts((prev) =>
          prev.map((p) =>
            p._id === prod.product_id // Changed comparison from p._id === prod._id
              ? { ...p, selected: false, customMargin: '' }
              : p
          )
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete special margin product');
    }
  };

  // --------------------- "Add Special Margin" Dialog Functions ---------------------
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

  // --------------------- Fetch Products for Dialog (Paginated) ---------------------
  const fetchDialogProducts = async () => {
    setDialogLoading(true);
    try {
      // Fetch paginated products based on search and pagination
      const response = await axios.get(
        `${baseApiUrl}/admin/products?search=${dialogSearchQuery}&page=${dialogPage}&limit=${dialogRowsPerPage}`
      );

      const { products: prodList, total_count } = response.data;
      setDialogTotalCount(total_count);

      // Get selected product_ids from globalSelections
      const selectedProductIds = Object.keys(globalSelections).filter(
        (id) => globalSelections[id].selected
      );

      // **Remove the addition of selectedProductsNotInList to prevent duplicates**
      /*
      const selectedProductsNotInList = specialMarginProducts
        .filter(
          (p) =>
            selectedProductIds.includes(p.product_id) && // Use product_id
            !prodList.some((fp: any) => fp._id === p.product_id) // Compare with prodList's _id
        )
        .map((p: any) => ({
          ...p,
          selected: true,
          customMargin: p.margin,
        }));
      */

      // Map fetched products with their selection status
      const mappedFetched = prodList.map((p: any) => {
        const selectionInfo = globalSelections[p._id] || {
          // Use p._id to match prodList
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

      console.log(
        selectedProductIds,
        /*selectedProductsNotInList,*/ mappedFetched
      );

      // **Remove the merging of selectedProductsNotInList to prevent duplicates**
      /*
      const productMap = new Map<string, any>();

      mappedFetched.forEach((p) => {
        productMap.set(p._id, p); // Use p._id as key
      });

      selectedProductsNotInList.forEach((p) => {
        if (!productMap.has(p.product_id)) { // Check using product_id
          productMap.set(p.product_id, p); // Add using product_id as key
        }
      });

      const mergedProducts = Array.from(productMap.values());

      setDialogProducts(mergedProducts);
      */

      // **Set dialogProducts to mappedFetched only**
      setDialogProducts(mappedFetched);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Products');
    } finally {
      setDialogLoading(false);
    }
  };

  // Re-fetch dialog products when dependencies change
  useEffect(() => {
    if (addDialogOpen) {
      fetchDialogProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addDialogOpen,
    dialogPage,
    dialogRowsPerPage,
    dialogSearchQuery,
    // specialMarginProducts, // Removed to prevent re-fetching unnecessarily
  ]);

  // Handle search in dialog
  const handleDialogSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDialogSearchQuery(e.target.value.toLowerCase());
    setDialogPage(0);
  };

  // Handle "Clear Margin" in dialog with deletion if exists
  const handleClearMarginInDialog = async (prodId: string) => {
    try {
      // Find if the product has a special margin
      const specialMarginEntry = specialMarginProducts.find(
        (p) => p.product_id === prodId
      );

      if (specialMarginEntry) {
        // Delete the special margin entry
        await axios.delete(
          `${baseApiUrl}/admin/customer/special_margins/${selectedCustomer._id}/${specialMarginEntry._id}`
        );

        // Remove from specialMarginProducts
        setSpecialMarginProducts((prev) =>
          prev.filter((p) => p._id !== specialMarginEntry._id)
        );

        // Remove from globalSelections
        setGlobalSelections((prev) => {
          const updatedSelections = { ...prev };
          delete updatedSelections[prodId];
          return updatedSelections;
        });

        // If dialog is open, uncheck the product in dialogProducts
        if (addDialogOpen) {
          setDialogProducts((prev) =>
            prev.map((p) =>
              p._id === prodId ? { ...p, selected: false, customMargin: '' } : p
            )
          );
        }

        toast.success(`Special margin for product has been deleted`);
      } else {
        // If no special margin exists, just clear the margin in the state
        const clearedMargin = ''; // Clear the margin

        // Update globalSelections: unselect the product and clear the margin
        setGlobalSelections((prev) => ({
          ...prev,
          [prodId]: {
            ...prev[prodId],
            margin: clearedMargin,
            selected: false, // Unselect the product
          },
        }));

        // Update dialogProducts to reflect the cleared margin and unselected state
        setDialogProducts((prev) =>
          prev.map((p) =>
            p._id === prodId
              ? { ...p, customMargin: clearedMargin, selected: false }
              : p
          )
        );

        toast.info(`Margin for product has been cleared`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear margin for the product');
    }
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

  // Pagination handlers for dialog
  const handleDialogChangePage = (event: unknown, newPage: number) => {
    setDialogPage(newPage);
    setDialogSkipPage('');
  };

  const handleDialogChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  // --------------------- Selection & Margin Handlers (Dialog) ---------------------
  const handleSelectProduct = (prodId: string, newSelected: boolean) => {
    // Find the product in the current page's dialogProducts
    const product = dialogProducts.find((p) => p._id === prodId);

    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        // Preserve existing data or initialize
        ...(prev[prodId] || {}),
        // Always store the product name
        name: product ? product.name : '',
        // Update selection
        selected: newSelected,
        // If unselected, remove the margin
        margin: newSelected ? prev[prodId]?.margin || '' : '',
      },
    }));

    // Update local dialogProducts to reflect selection state
    setDialogProducts((prev) =>
      prev.map((p) =>
        p._id === prodId
          ? {
              ...p,
              selected: newSelected,
              customMargin: newSelected ? p.customMargin : '',
            }
          : p
      )
    );
  };

  const handleMarginChange = (prodId: string, rawValue: string) => {
    // Find the product in the current page's dialogProducts
    const product = dialogProducts.find((p) => p._id === prodId);

    // Strip out an existing '%' and append it back
    const stripped = rawValue.replace('%', '').trim();
    const withPercent = stripped ? stripped + '%' : '';

    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        // Preserve existing fields
        ...(prev[prodId] || {}),
        // Always store the product name
        name: product ? product.name : '',
        // Whenever margin changes, auto-select the product
        selected: true,
        margin: withPercent,
      },
    }));

    // Update local dialogProducts array to reflect the margin change
    setDialogProducts((prev) =>
      prev.map((p) =>
        p._id === prodId
          ? { ...p, selected: true, customMargin: withPercent }
          : p
      )
    );
  };

  // --------------------- Bulk Save Margins Function ---------------------
  const handleBulkSaveMargins = async () => {
    if (!selectedCustomer?._id) return;

    // Gather from globalSelections any item that is selected
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
    // One request per product; consider using a bulk endpoint if available
    for (const [prodId, info] of selectedItems) {
      try {
        const payload = {
          product_id: prodId,
          name: info.name,
          margin: info.margin,
        };
        await axios.post(
          `${baseApiUrl}/admin/customer/special_margins/${selectedCustomer._id}`,
          payload
        );
        successCount++;
        setGlobalSelections((prev) => ({
          ...prev,
          [prodId]: {
            ...prev[prodId],
            selected: true,
            margin: info.margin,
          },
        }));
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
          `${baseApiUrl}/admin/customer/special_margins/${selectedCustomer._id}`
        );
        const { products = [] } = response.data;
        setSpecialMarginProducts(products);
        const updatedSelections: Record<string, any> = {};
        products.forEach((p: any) => {
          updatedSelections[p.product_id] = {
            // Changed from p._id to p.product_id
            selected: true,
            name: p.name,
            margin: p.margin,
          };
        });
        setGlobalSelections(updatedSelections);
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
                count={totalCount}
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

            {selectedCustomer && (
              <>
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Customer Name:</strong>{' '}
                    {selectedCustomer.contact_name}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong>{' '}
                    {capitalize(selectedCustomer.status)}
                  </Typography>
                  <Typography>
                    <strong>GST Number:</strong>{' '}
                    {selectedCustomer.gst_no || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong>{' '}
                    {selectedCustomer.customer_sub_type
                      ? capitalize(selectedCustomer.customer_sub_type)
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
                    {selectedCustomer.cf_sales_person || 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {selectedCustomer.created_at
                      ? new Date(selectedCustomer.created_at).toLocaleString()
                      : new Date(
                          selectedCustomer.created_time
                        ).toLocaleString()}
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
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant='outlined'
                                  color='error'
                                  onClick={() =>
                                    handleDeleteSpecialMargin(prod)
                                  }
                                >
                                  Delete
                                </Button>
                              </Box>
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

      {/* Dialog: Add Special Margin (shows list of all products with pagination) */}
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
                      <TableCell>Action</TableCell>
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
                            placeholder={selectedCustomer?.cf_margin || '40%'}
                            value={prod.customMargin}
                            onChange={(e) =>
                              handleMarginChange(prod._id, e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => handleClearMarginInDialog(prod._id)}
                          >
                            Clear
                          </Button>
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
                  count={dialogTotalCount}
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
