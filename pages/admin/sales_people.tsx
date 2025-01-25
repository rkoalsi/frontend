import { useEffect, useState } from 'react';
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
import axios from 'axios';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import { green, red } from '@mui/material/colors';

const SalesPeople = () => {
  const [salesPeople, setSalesPeople]: any = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [originalCustomersString, setOriginalCustomersString] = useState('');

  // For "Add Customers" dialog
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<{ [customerId: string]: string }>(
    {}
  );
  // State for "Add Salesperson" dialog
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

  const handleAddFieldChange = (field: string, value: any) => {
    setNewSalesPerson((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSalesPerson = async () => {
    try {
      const response = await axios.post(
        `${baseApiUrl}/admin/salespeople`,
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
    } catch (error) {
      console.error(error);
      toast.error('Failed to add salesperson');
    }
  };

  const handleChange = (
    event: React.ChangeEvent<{ value: unknown }>,
    customer: any
  ) => {
    const newValues = event.target.value as string[];

    // Validate that there is at least one non-empty code
    const hasAtLeastOneNonEmpty = newValues.some(
      (code) => code.trim().length > 0
    );

    setRowErrors((prev) => {
      // Make a copy of the current error object
      const updatedErrors = { ...prev };

      if (!hasAtLeastOneNonEmpty) {
        updatedErrors[customer._id] =
          'Please select at least one non-empty code.';
      } else {
        // Clear the error for this row if it exists
        delete updatedErrors[customer._id];
        // Then actually do your update logic
        handleCustomerFieldChange(
          customer._id,
          'cf_sales_person',
          newValues.join(', ')
        );
      }

      return updatedErrors;
    });
  };

  const baseApiUrl = process.env.api_url;

  // ------------------------------------------------------------------
  // 1) Fetch all salespeople
  // ------------------------------------------------------------------
  const fetchSalesPeople = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/admin/salespeople`);
      setSalesPeople(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching Sales People.');
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 2) Refetch the currently selected person
  //    + Refresh the entire list (to keep table in sync).
  // ------------------------------------------------------------------
  const refetchSelectedPerson = async (personId: string) => {
    try {
      // 2A) Fetch single
      const { data } = await axios.get(
        `${baseApiUrl}/admin/salespeople/${personId}`
      );
      // Depending on your API response shape:
      const updatedSalesPerson = data.sales_person || data;
      console.log(updatedSalesPerson);
      // 2B) Also re-fetch the entire list
      const fullListResp = await axios.get(`${baseApiUrl}/admin/salespeople`);
      setSalesPeople(fullListResp.data.users);

      // 2C) Now update "selectedPerson"
      setSelectedPerson(updatedSalesPerson);
    } catch (err) {
      console.error(err);
      toast.error('Failed to refresh selected person.');
    }
  };

  // ------------------------------------------------------------------
  // 3) Lifecycle: on mount, fetch the list
  // ------------------------------------------------------------------
  useEffect(() => {
    fetchSalesPeople();
  }, []);

  // ------------------------------------------------------------------
  // 4) Opening & Closing the Drawer
  // ------------------------------------------------------------------
  const handleViewDetails = async (rowPerson: any) => {
    try {
      // 1) Make an API call to get the *fresh* updated person data from the server
      const { data } = await axios.get(
        `${baseApiUrl}/admin/salespeople/${rowPerson._id}`
      );
      // 2) The API might return { sales_person: {...} } or just {...}
      const updatedSalesPerson = data.sales_person || data;

      // 3) Now set that as the selected person
      setSelectedPerson(updatedSalesPerson);
      const stringified = JSON.stringify(updatedSalesPerson.customers || []);
      setOriginalCustomersString(stringified);
      // 4) Finally open the drawer
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load person details.');
    }
  };
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPerson(null);
  };

  // ------------------------------------------------------------------
  // 5) Updating the sales person’s info (name, status, etc.)
  // ------------------------------------------------------------------
  const handleSaveChanges = async () => {
    if (!selectedPerson) return;

    try {
      await axios.put(
        `${baseApiUrl}/admin/salespeople/${selectedPerson._id}`,
        selectedPerson
      );
      // Locally update the table row
      setSalesPeople((prev: any) =>
        prev.map((p: any) =>
          p._id === selectedPerson._id ? selectedPerson : p
        )
      );
      toast.success('Sales person details updated successfully.');
      handleCloseDrawer();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update sales person details.');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setSelectedPerson((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle status from active to inactive
  const toggleStatus = async (person: any) => {
    const newStatus = person.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${baseApiUrl}/admin/salespeople/${person._id}`, {
        status: newStatus,
      });
      // Update local state
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
  };

  // ------------------------------------------------------------------
  // 6) Editing each customer's assigned salesperson(s)
  // ------------------------------------------------------------------
  const handleCustomerFieldChange = (
    customerId: string,
    field: string,
    updatedValue: string
  ) => {
    // We update the local "selectedPerson.customers" array
    setSelectedPerson((prev: any) => ({
      ...prev,
      customers: prev.customers.map((c: any) =>
        c._id === customerId ? { ...c, [field]: updatedValue } : c
      ),
    }));
  };

  const handleRemoveCustomer = async (customer: any) => {
    if (!selectedPerson) return;

    try {
      let updatedSalesPersons: string[] = [];

      // Determine the current format of cf_sales_person and normalize it to an array
      if (typeof customer.cf_sales_person === 'string') {
        // Split the string by comma and trim whitespace
        updatedSalesPersons = customer.cf_sales_person
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean); // Remove any empty strings
      } else if (Array.isArray(customer.cf_sales_person)) {
        // If it's already an array, use it directly
        updatedSalesPersons = customer.cf_sales_person;
      } else {
        // Handle unexpected formats gracefully
        console.warn(
          `Unexpected cf_sales_person format for customer ID ${customer._id}:`,
          customer.cf_sales_person
        );
      }

      // Remove the selected salesperson's code
      updatedSalesPersons = updatedSalesPersons.filter(
        (code) => code !== selectedPerson.code
      );
      // Determine the new value for cf_sales_person
      const newCfSalesPerson =
        updatedSalesPersons.length > 0 ? updatedSalesPersons.join(', ') : '';

      // If no change is needed, exit early
      if (
        (typeof customer.cf_sales_person === 'string' &&
          customer.cf_sales_person.trim() === newCfSalesPerson.trim()) ||
        (Array.isArray(customer.cf_sales_person) &&
          customer.cf_sales_person.length === updatedSalesPersons.length &&
          customer.cf_sales_person.every((code: string) =>
            updatedSalesPersons.includes(code)
          ))
      ) {
        toast.info('No changes detected.');
        return;
      }

      // Construct the "updates" payload
      const updates = [
        {
          _id: customer._id,
          cf_sales_person: newCfSalesPerson, // Updated value
        },
      ];

      // Send the bulk-update request to the backend
      await axios.put(`${process.env.api_url}/admin/customers/bulk-update`, {
        updates,
      });

      // Provide user feedback
      toast.success('Customer unassigned successfully.');

      // Re-fetch the selected person's data to update the UI
      await refetchSelectedPerson(selectedPerson._id);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove customer.');
    }
  };

  // ------------------------------------------------------------------
  // 7) "Add Customers" flow: listing unassigned customers, selecting them
  // ------------------------------------------------------------------
  const fetchAvailableCustomers = async () => {
    // setCustomerLoading(true);
    try {
      const response = await axios.get(
        `${process.env.api_url}/customers/salesperson`,
        {
          params: {
            code: selectedPerson?.code, // the salesperson code
            page,
            limit,
            search: customerSearch,
          },
        }
      );
      setAvailableCustomers(response.data.customers);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching available customers.');
    }
    setCustomerLoading(false);
  };

  useEffect(() => {
    if (addCustomerDialogOpen) {
      fetchAvailableCustomers();
    }
  }, [page, limit, addCustomerDialogOpen, customerSearch]);

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleAddCustomers = async () => {
    if (!selectedPerson) return;

    try {
      // 1) Update each selected customer on the server, but in parallel:
      await Promise.all(
        selectedCustomers.map((customerId) =>
          axios.put(`${baseApiUrl}/customers/${customerId}`, {
            cf_sales_person: selectedPerson.code.trim(),
          })
        )
      );

      // 2) Now re-fetch the selectedPerson data from the backend
      //    to get the new assigned customers *immediately* in state.
      await refetchSelectedPerson(selectedPerson._id);

      toast.success('Customers assigned successfully.');
      setAddCustomerDialogOpen(false);
      setSelectedCustomers([]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign customers.');
    }
  };

  const handleBulkSaveCustomers = async () => {
    if (!selectedPerson) return;
    try {
      // Build the array of updates
      const updates = selectedPerson.customers.map((c: any) => ({
        _id: c._id,
        cf_sales_person: c.cf_sales_person,
      }));
      const { data } = await axios.put(
        `${baseApiUrl}/admin/customers/bulk-update`,
        {
          updates,
        }
      );

      console.log(data.results); // see who was updated vs. skipped
      toast.success('All customers updated successfully.');
      // Optionally refetch
      await refetchSelectedPerson(selectedPerson._id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to bulk update customers');
    }
  };

  // ------------------------------------------------------------------
  // 8) Render
  // ------------------------------------------------------------------
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
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography
            variant='h4'
            gutterBottom
            sx={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
            }}
          >
            All Sales People
          </Typography>
          <Box textAlign='right' marginBottom={2}>
            {/* <Button
              variant='contained'
              color='primary'
              onClick={() => setAddDialogOpen(true)}
            >
              Add Salesperson
            </Button> */}
          </Box>

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
                  <TableRow
                    key={person._id}
                    onClick={() => handleViewDetails(person)}
                  >
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
                        variant='outlined'
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
        <Box sx={{ padding: 3 }}>
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
                {/* Cancel Button at the Top Left */}
                <Button
                  color='secondary'
                  onClick={handleCloseDrawer}
                  sx={{ position: 'absolute', top: 16, left: 16 }}
                >
                  Cancel
                </Button>

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

                {/* Basic info form */}
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
                    onChange={(e) =>
                      handleFieldChange('status', e.target.value)
                    }
                    fullWidth
                  >
                    <MenuItem value='active'>Active</MenuItem>
                    <MenuItem value='inactive'>Inactive</MenuItem>
                  </TextField>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}
                  >
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={handleCloseDrawer}
                      size='small'
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleSaveChanges}
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
                    onClick={() => {
                      setSelectedCustomers([]);
                      fetchAvailableCustomers();
                      setAddCustomerDialogOpen(true);
                    }}
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
                          (customer: any, idx: number) => {
                            // For the multi select value, parse the comma string -> array
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
                                      onChange={(e: any) =>
                                        handleChange(e, customer)
                                      }
                                      renderValue={(selected: string[]) => (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 0.5,
                                          }}
                                        >
                                          {selected.map((value) => (
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
                                      !arrayOfCodes.includes(
                                        selectedPerson.code
                                      )
                                    }
                                    color='error'
                                    onClick={() =>
                                      handleRemoveCustomer(customer)
                                    }
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

          {/* Dialog: Add Customers */}
          <Dialog
            open={addCustomerDialogOpen}
            onClose={() => setAddCustomerDialogOpen(false)}
            fullWidth
            maxWidth='sm'
          >
            <DialogTitle>Add Customers</DialogTitle>
            {customerLoading ? (
              <Box
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <CircularProgress />
              </Box>
            ) : (
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
                        component='div' // changed from 'button' to 'div' to avoid conflicts
                        onClick={() => toggleCustomerSelection(customer._id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {/* Status Indicator */}
                          <Tooltip
                            title={
                              customer.status === 'active'
                                ? 'Active'
                                : 'Inactive'
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
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => toggleCustomerSelection(customer._id)}
                          onClick={(e) => e.stopPropagation()} // Prevents triggering the ListItem onClick
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Button
                      variant='outlined'
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>

                    <Typography variant='body2'>
                      Page {page} of {totalPages}
                    </Typography>

                    <Button
                      variant='outlined'
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
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
                  >
                    Add Selected
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesPeople;
