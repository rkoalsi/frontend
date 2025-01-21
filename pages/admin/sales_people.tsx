import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const SalesPeople = () => {
  const [salesPeople, setSalesPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // For "Add Customers" dialog
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

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
  const handleViewDetails = (person: any) => {
    setSelectedPerson(person);
    setDrawerOpen(true);
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

  // Actually saving the updated "cf_sales_person" to backend
  const handleUpdateCustomer = async (
    customerId: string,
    cfSalesPerson: string
  ) => {
    try {
      // Convert to array and remove empty spaces
      const sanitizedSalesPeople = cfSalesPerson
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      // Put to server
      await axios.put(`${baseApiUrl}/customers/${customerId}`, {
        cf_sales_person: sanitizedSalesPeople.join(', '),
      });

      toast.success('Customer updated successfully');

      // Immediately refetch so changes appear without refresh
      if (selectedPerson) {
        await refetchSelectedPerson(selectedPerson._id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer');
    }
  };

  // ------------------------------------------------------------------
  // 7) "Add Customers" flow: listing unassigned customers, selecting them
  // ------------------------------------------------------------------
  const fetchAvailableCustomers = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/customers/salespersons`, {
        params: { code: selectedPerson.code },
      });
      setAvailableCustomers(response.data.customers);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching available customers.');
    }
  };

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
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all sales people below.
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
                          <TableCell>Action</TableCell>
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
                                  <Select
                                    variant='outlined'
                                    size='small'
                                    multiple
                                    value={arrayOfCodes}
                                    onChange={(e) => {
                                      const newVal = e.target.value as string[];
                                      // Convert array -> comma separated
                                      handleCustomerFieldChange(
                                        customer._id,
                                        'cf_sales_person',
                                        newVal.join(', ')
                                      );
                                    }}
                                    fullWidth
                                    // RENDER TAG-LIKE CHIPS:
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
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant='contained'
                                    color='primary'
                                    size='small'
                                    onClick={() =>
                                      handleUpdateCustomer(
                                        customer._id,
                                        customer.cf_sales_person
                                      )
                                    }
                                  >
                                    Save
                                  </Button>
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
            <DialogContent>
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
                    <ListItemText primary={customer.contact_name} />
                    <Checkbox
                      checked={selectedCustomers.includes(customer._id)}
                    />
                  </ListItem>
                ))}
              </List>
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
          </Dialog>
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesPeople;
