import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
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
  Switch,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  Chip,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import { green, red } from '@mui/material/colors';
import axiosInstance from '../../src/util/axios';

const SalesPeople = () => {
  const [salesPeople, setSalesPeople]: any = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson]: any = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers]: any = useState([]);
  const [selectedCustomers, setSelectedCustomers]: any = useState([]);
  const [rowErrors, setRowErrors]: any = useState({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSalesPerson, setNewSalesPerson] = useState({
    name: '',
    code: '',
    designation: '',
    email: '',
    phone: '',
    status: 'active',
    role: 'sales_person',
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const baseApiUrl = process.env.api_url;

  // Fetch all salespeople on mount
  const fetchSalesPeople = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/salespeople`);
      setSalesPeople(response.data.users);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching Sales People.');
    } finally {
      setLoading(false);
    }
  }, [baseApiUrl]);

  useEffect(() => {
    fetchSalesPeople();
  }, [fetchSalesPeople]);

  // Fetch a single sales person and update state
  const refetchSelectedPerson = useCallback(
    async (personId: any) => {
      try {
        const { data } = await axiosInstance.get(
          `/admin/salespeople/${personId}`
        );
        const updatedSalesPerson = data.sales_person || data;
        setSelectedPerson(updatedSalesPerson);
        // Update salesPeople list locally
        setSalesPeople((prev: any) =>
          prev.map((p: any) =>
            p._id === updatedSalesPerson._id ? updatedSalesPerson : p
          )
        );
      } catch (err) {
        console.error(err);
        toast.error('Failed to refresh selected person.');
      }
    },
    [baseApiUrl]
  );

  // Handle opening the drawer with selected person's details
  const handleViewDetails = useCallback(
    async (person: any) => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(
          `/admin/salespeople/${person._id}`
        );
        const updatedSalesPerson = data.sales_person || data;
        setSelectedPerson(updatedSalesPerson);
        setDrawerOpen(true);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load person details.');
      } finally {
        setLoading(false);
      }
    },
    [baseApiUrl]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedPerson(null);
    setRowErrors({});
  }, []);

  // Handle creating a new salesperson
  const handleCreateSalesPerson = useCallback(async () => {
    try {
      const response = await axiosInstance.post(
        `/admin/salespeople`,
        newSalesPerson
      );
      setSalesPeople((prev: any) => [...prev, response.data]);
      toast.success('Salesperson added successfully');
      setAddDialogOpen(false);
      setNewSalesPerson({
        name: '',
        code: '',
        designation: '',
        email: '',
        phone: '',
        status: 'active',
        role: 'sales_person',
      });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.detail || 'Failed to add salesperson';
      toast.error(errorMessage);
    }
  }, [baseApiUrl, newSalesPerson]);

  // Handle field changes for new salesperson form
  const handleAddFieldChange = useCallback((field: any, value: any) => {
    setNewSalesPerson((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle field changes in selected person
  const handleFieldChange = useCallback((field: any, value: any) => {
    setSelectedPerson((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Toggle salesperson status
  const toggleStatus = useCallback(
    async (person: any) => {
      const newStatus = person.status === 'active' ? 'inactive' : 'active';
      try {
        await axiosInstance.put(`/admin/salespeople/${person._id}`, {
          status: newStatus,
        });
        setSalesPeople((prev: any) =>
          prev.map((p: any) =>
            p._id === person._id ? { ...p, status: newStatus } : p
          )
        );
        toast.success(`Status updated to ${newStatus}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to update status');
      }
    },
    [baseApiUrl]
  );
  const handleCustomerFieldChange = useCallback(
    (customerId: any, field: any, updatedValue: any) => {
      setSelectedPerson((prev: any) => ({
        ...prev,
        customers: prev.customers.map((c: any) =>
          c._id === customerId ? { ...c, [field]: updatedValue } : c
        ),
      }));
    },
    []
  );
  // Handle changes in customer's assigned salespeople
  const handleChange = useCallback(
    (event: any, customer: any) => {
      const newValues = event.target.value;

      const hasAtLeastOneNonEmpty = newValues.some(
        (code: any) => code.trim().length > 0
      );

      setRowErrors((prev: any) => {
        const updatedErrors: any = { ...prev };

        if (!hasAtLeastOneNonEmpty) {
          updatedErrors[customer._id] =
            'Please select at least one non-empty code.';
        } else {
          delete updatedErrors[customer._id];
          handleCustomerFieldChange(
            customer._id,
            'cf_sales_person',
            newValues.join(', ')
          );
        }

        return updatedErrors;
      });
    },
    [handleCustomerFieldChange]
  );

  // Handle customer field changes

  // Remove customer assignment
  const handleRemoveCustomer = useCallback(
    async (customer: any) => {
      if (!selectedPerson) return;

      try {
        let updatedSalesPersons = [];

        if (typeof customer.cf_sales_person === 'string') {
          updatedSalesPersons = customer.cf_sales_person
            .split(',')
            .map((s: any) => s.trim())
            .filter(Boolean);
        } else if (Array.isArray(customer.cf_sales_person)) {
          updatedSalesPersons = customer.cf_sales_person;
        }

        updatedSalesPersons = updatedSalesPersons.filter(
          (code: any) => code !== selectedPerson.code
        );
        const newCfSalesPerson = updatedSalesPersons.join(', ');

        if (
          (typeof customer.cf_sales_person === 'string' &&
            customer.cf_sales_person.trim() === newCfSalesPerson.trim()) ||
          (Array.isArray(customer.cf_sales_person) &&
            customer.cf_sales_person.length === updatedSalesPersons.length &&
            customer.cf_sales_person.every((code: any) =>
              updatedSalesPersons.includes(code)
            ))
        ) {
          toast.info('No changes detected.');
          return;
        }

        const updates = [
          {
            _id: customer._id,
            cf_sales_person: newCfSalesPerson,
          },
        ];

        await axiosInstance.put(`/admin/customers/bulk-update`, {
          updates,
        });

        toast.success('Customer unassigned successfully.');
        await refetchSelectedPerson(selectedPerson._id);
      } catch (error) {
        console.error(error);
        toast.error('Failed to remove customer.');
      }
    },
    [baseApiUrl, refetchSelectedPerson, selectedPerson]
  );

  // Fetch available customers for assignment
  const fetchAvailableCustomers = useCallback(async () => {
    if (!selectedPerson) return;

    setCustomerLoading(true);
    try {
      const response = await axiosInstance.get(`/customers/salesperson`, {
        params: {
          code: selectedPerson.code,
          page,
          limit,
          search: customerSearch,
        },
      });
      setAvailableCustomers(response.data.customers);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching available customers.');
    } finally {
      setCustomerLoading(false);
    }
  }, [baseApiUrl, selectedPerson, page, limit, customerSearch]);

  // Debounce customer search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (addCustomerDialogOpen) {
        fetchAvailableCustomers();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [fetchAvailableCustomers, addCustomerDialogOpen]);

  // Handle customer selection toggle
  const toggleCustomerSelection = useCallback((customerId: any) => {
    setSelectedCustomers((prev: any) =>
      prev.includes(customerId)
        ? prev.filter((id: any) => id !== customerId)
        : [...prev, customerId]
    );
  }, []);

  // Assign selected customers to the salesperson
  const handleAddCustomers = useCallback(async () => {
    if (!selectedPerson) return;

    try {
      await Promise.all(
        selectedCustomers.map((customerId: any) =>
          axiosInstance.put(`/customers/${customerId}`, {
            cf_sales_person: selectedPerson.code.trim(),
          })
        )
      );

      await refetchSelectedPerson(selectedPerson._id);

      toast.success('Customers assigned successfully.');
      setAddCustomerDialogOpen(false);
      setSelectedCustomers([]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign customers.');
    }
  }, [baseApiUrl, refetchSelectedPerson, selectedCustomers, selectedPerson]);

  // Bulk save customer changes
  const handleBulkSaveCustomers = useCallback(async () => {
    if (!selectedPerson) return;
    try {
      const updates = selectedPerson.customers.map((c: any) => ({
        _id: c._id,
        cf_sales_person: c.cf_sales_person,
      }));
      await axiosInstance.put(`/admin/customers/bulk-update`, { updates });

      toast.success('All customers updated successfully.');
      await refetchSelectedPerson(selectedPerson._id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to bulk update customers');
    }
  }, [baseApiUrl, refetchSelectedPerson, selectedPerson]);

  // Fetch available customers when dialog opens or pagination/search changes
  useEffect(() => {
    if (addCustomerDialogOpen) {
      fetchAvailableCustomers();
    }
  }, [addCustomerDialogOpen, fetchAvailableCustomers]);

  // Memoized salesPeople options for customer assignment
  const salesPeopleOptions = useMemo(
    () => salesPeople.map((sp: any) => sp.code),
    [salesPeople]
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}
      >
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography
            variant='h4'
            gutterBottom
            sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}
          >
            All Sales People
          </Typography>
          <Box textAlign='right' marginBottom={2}>
            <Button
              variant='contained'
              color='primary'
              onClick={() => setAddDialogOpen(true)}
            >
              Add Salesperson
            </Button>
          </Box>
        </Box>

        {/* Add Salesperson Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          fullWidth
          maxWidth='sm'
        >
          <DialogTitle>Add Salesperson</DialogTitle>
          <DialogContent>
            <TextField
              label='Name'
              variant='outlined'
              value={newSalesPerson.name}
              onChange={(e) => handleAddFieldChange('name', e.target.value)}
              fullWidth
              margin='normal'
            />
            <TextField
              label='Code'
              variant='outlined'
              value={newSalesPerson.code}
              onChange={(e) => handleAddFieldChange('code', e.target.value)}
              fullWidth
              margin='normal'
            />
            <TextField
              label='Designation'
              variant='outlined'
              value={newSalesPerson.designation}
              onChange={(e) =>
                handleAddFieldChange('designation', e.target.value)
              }
              fullWidth
              margin='normal'
            />
            <TextField
              label='Email'
              variant='outlined'
              value={newSalesPerson.email}
              onChange={(e) => handleAddFieldChange('email', e.target.value)}
              fullWidth
              margin='normal'
            />
            <TextField
              label='Phone'
              variant='outlined'
              value={newSalesPerson.phone}
              onChange={(e) => handleAddFieldChange('phone', e.target.value)}
              fullWidth
              margin='normal'
            />
            <TextField
              select
              label='Status'
              value={newSalesPerson.status}
              onChange={(e) => handleAddFieldChange('status', e.target.value)}
              fullWidth
              margin='normal'
            >
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)} color='secondary'>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSalesPerson}
              color='primary'
              variant='contained'
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading Indicator */}
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesPeople.map((person: any) => (
                  <TableRow key={person._id}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.code}</TableCell>
                    <TableCell>{person.designation}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell>
                      <Switch
                        checked={person.status === 'active'}
                        onChange={() => toggleStatus(person)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='contained'
                        onClick={() => handleViewDetails(person)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Drawer: Edit Sales Person */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 800,
              padding: 4,
            },
          }}
        >
          {selectedPerson && (
            <Box>
              {/* Header */}
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Typography
                  variant='h5'
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 2,
                    fontFamily: 'Roboto, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  Edit Sales Person
                </Typography>
                <Button
                  color='secondary'
                  onClick={handleCloseDrawer}
                  sx={{ marginBottom: 2 }}
                >
                  Cancel
                </Button>
              </Box>

              {/* Basic Info Form */}
              <Box
                component='form'
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginBottom: 3,
                }}
              >
                <TextField
                  label='Name'
                  variant='outlined'
                  value={selectedPerson.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  fullWidth
                />
                <TextField
                  label='Code'
                  variant='outlined'
                  value={selectedPerson.code || ''}
                  disabled
                  fullWidth
                />
                <TextField
                  select
                  label='Status'
                  value={selectedPerson.status || 'inactive'}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='inactive'>Inactive</MenuItem>
                </TextField>
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}
                >
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={handleCloseDrawer}
                    size='small'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleBulkSaveCustomers}
                    size='small'
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>

              {/* Assigned Customers Section */}
              <Box
                display='flex'
                flexDirection='row'
                alignItems='baseline'
                justifyContent='space-between'
              >
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 'bold',
                    marginTop: 4,
                    marginBottom: 2,
                    fontFamily: 'Roboto, sans-serif',
                  }}
                >
                  Assigned Customers
                </Typography>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => setAddCustomerDialogOpen(true)}
                  size='small'
                  sx={{ marginBottom: 2 }}
                >
                  Assign More Customers
                </Button>
              </Box>

              {selectedPerson.customers &&
              selectedPerson.customers.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Sales People Assigned</TableCell>
                        <TableCell>Remove</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPerson.customers.map(
                        (customer: any, idx: any) => {
                          const arrayOfCodes =
                            typeof customer.cf_sales_person === 'string'
                              ? customer.cf_sales_person
                                  .split(',')
                                  .map((s: any) => s.trim())
                              : Array.isArray(customer.cf_sales_person)
                              ? customer.cf_sales_person
                              : [];
                          return (
                            <TableRow key={customer._id}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{customer.contact_name}</TableCell>
                              <TableCell>
                                <FormControl
                                  variant='outlined'
                                  size='small'
                                  fullWidth
                                  error={Boolean(rowErrors[customer._id])}
                                >
                                  <InputLabel>Sales Person</InputLabel>
                                  <Select
                                    label='Sales Person'
                                    multiple
                                    value={arrayOfCodes}
                                    onChange={(e) => handleChange(e, customer)}
                                    renderValue={(selected) => (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 0.5,
                                        }}
                                      >
                                        {selected.map((value: any) => (
                                          <Chip key={value} label={value} />
                                        ))}
                                      </Box>
                                    )}
                                  >
                                    {salesPeople.map((sp: any) => (
                                      <MenuItem key={sp.code} value={sp.code}>
                                        {sp.code}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                  {rowErrors[customer._id] && (
                                    <FormHelperText>
                                      {rowErrors[customer._id]}
                                    </FormHelperText>
                                  )}
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  disabled={
                                    !arrayOfCodes.includes(selectedPerson.code)
                                  }
                                  color='error'
                                  onClick={() => handleRemoveCustomer(customer)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography variant='body2' color='textSecondary'>
                  No customers assigned to this salesperson.
                </Typography>
              )}

              {selectedPerson.customers &&
                selectedPerson.customers.length > 0 && (
                  <Box mt={2} textAlign='right'>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleBulkSaveCustomers}
                      size='small'
                    >
                      Save All Customer Changes
                    </Button>
                  </Box>
                )}
            </Box>
          )}
        </Drawer>

        {/* Add Customers Dialog */}
        <Dialog
          open={addCustomerDialogOpen}
          onClose={() => setAddCustomerDialogOpen(false)}
          fullWidth
          maxWidth='sm'
        >
          <DialogTitle>Add Customers</DialogTitle>

          <>
            <DialogContent>
              <TextField
                fullWidth
                label='Search Customers'
                variant='outlined'
                size='small'
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                sx={{ marginBottom: 2 }}
              />
              <List>
                {availableCustomers.map((customer: any) => (
                  <ListItem
                    key={customer._id}
                    component='div'
                    onClick={() => toggleCustomerSelection(customer._id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip
                        title={
                          customer.status === 'active' ? 'Active' : 'Inactive'
                        }
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor:
                              customer.status === 'active'
                                ? green[500]
                                : red[500],
                            marginRight: 2,
                          }}
                        />
                      </Tooltip>
                      <ListItemText
                        primary={customer.contact_name}
                        secondary={
                          customer.cf_sales_person
                            ? `Currently assigned: ${customer.cf_sales_person}`
                            : 'Currently unassigned'
                        }
                      />
                    </Box>
                    <Checkbox
                      checked={selectedCustomers.includes(customer?._id)}
                      onChange={() => toggleCustomerSelection(customer._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItem>
                ))}
              </List>
              {/* Pagination Controls */}
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mt={2}
              >
                <Button
                  variant='contained'
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>

                <Typography variant='body2'>
                  Page {page} of {totalPages}
                </Typography>

                <Button
                  variant='contained'
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setAddCustomerDialogOpen(false)}
                color='secondary'
                size='small'
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomers}
                color='primary'
                size='small'
                variant='contained'
                disabled={selectedCustomers.length === 0}
              >
                Add Selected
              </Button>
            </DialogActions>
          </>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default SalesPeople;
