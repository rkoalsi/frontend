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
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const SalesPeople = () => {
  const [salesPeople, setSalesPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const baseApiUrl = process.env.api_url;

  const fetchSalesPeople = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/salespeoples`);
      setSalesPeople(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching Sales People.');
      setLoading(false);
    }
  };

  const handleViewDetails = (person: any) => {
    setSelectedPerson(person);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPerson(null);
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `${baseApiUrl}/salespeoples/${selectedPerson._id}`,
        selectedPerson
      );
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
  const handleCustomerFieldChange = (
    customerId: string,
    field: string,
    value: any
  ) => {
    setSelectedPerson((prev: any) => ({
      ...prev,
      customers: prev.customers.map((customer: any) =>
        customer._id === customerId ? { ...customer, [field]: value } : customer
      ),
    }));
  };
  const fetchAvailableCustomers = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/customers/salespersons`, {
        params: { code: selectedPerson.code }, // Fetch all customers
      });
      setAvailableCustomers(response.data.customers);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching available customers.');
    }
  };

  const handleAddCustomers = async () => {
    try {
      // Update all selected customers
      for (const customerId of selectedCustomers) {
        await axios.put(`${baseApiUrl}/customers/${customerId}`, {
          cf_sales_person: selectedPerson.code,
        });
      }

      toast.success('Customers assigned successfully.');
      setAddCustomerDialogOpen(false);
      setSelectedCustomers([]);
      fetchSalesPeople(); // Refresh salespeople data
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign customers.');
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };
  const handleUpdateCustomer = async (
    customerId: string,
    cfSalesPerson: string
  ) => {
    try {
      const sanitizedSalesPeople = cfSalesPerson
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s);

      await axios.put(`${baseApiUrl}/customers/${customerId}`, {
        cf_sales_person: sanitizedSalesPeople.join(', '),
      });

      toast.success('Customer updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer');
    }
  };

  useEffect(() => {
    fetchSalesPeople();
  }, []);

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
                {salesPeople.map((salesPerson: any) => (
                  <TableRow key={salesPerson._id}>
                    <TableCell>{salesPerson.name}</TableCell>
                    <TableCell>{salesPerson.code}</TableCell>
                    <TableCell>{salesPerson.designation}</TableCell>
                    <TableCell>{salesPerson.email}</TableCell>
                    <TableCell>{salesPerson.phone}</TableCell>
                    <TableCell>
                      <Switch
                        checked={salesPerson.status === 'active'}
                        onChange={async () => {
                          const newStatus =
                            salesPerson.status === 'active'
                              ? 'inactive'
                              : 'active';
                          try {
                            // Update status in the backend
                            await axios.put(
                              `${baseApiUrl}/salespeoples/${salesPerson._id}`,
                              {
                                status: newStatus,
                              }
                            );

                            // Update the local state
                            setSalesPeople((prev: any) =>
                              prev.map((p: any) =>
                                p._id === salesPerson._id
                                  ? { ...p, status: newStatus }
                                  : p
                              )
                            );

                            toast.success(`Status updated to ${newStatus}`);
                          } catch (error) {
                            console.error(error);
                            toast.error('Failed to update status');
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outlined'
                        onClick={() => handleViewDetails(salesPerson)}
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

        {/* Drawer for Editing Sales Person */}
        <Box sx={{ padding: 3 }}>
          {/* Drawer for Editing Sales Person */}
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
                <Box
                  display={'flex'}
                  flexDirection={'row'}
                  alignItems={'baseline'}
                  justifyContent={'space-between'}
                >
                  {/* Assigned Customers List */}
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
                    Add Customers
                  </Button>
                </Box>
                {/* Add Customers Button */}
                {selectedPerson.customers &&
                selectedPerson.customers.length > 0 ? (
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>No.</TableCell>
                          <TableCell>Customer Name</TableCell>
                          <TableCell>Sales People Assigned</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPerson.customers.map(
                          (customer: any, index: number) => (
                            <TableRow key={customer._id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{customer.contact_name}</TableCell>
                              <TableCell>
                                <Select
                                  variant='outlined'
                                  size='small'
                                  multiple
                                  value={
                                    customer.cf_sales_person !== ''
                                      ? customer?.cf_sales_person
                                          ?.split(',')
                                          .map((s: string) => s.trim())
                                      : []
                                  }
                                  onChange={(e) => {
                                    const updatedSalesPeople = e.target.value;
                                    handleCustomerFieldChange(
                                      customer._id,
                                      'cf_sales_person',
                                      updatedSalesPeople.join(', ')
                                    );
                                  }}
                                  fullWidth
                                >
                                  {salesPeople.map((salesPerson: any) => (
                                    <MenuItem
                                      key={salesPerson.code}
                                      value={salesPerson.code}
                                    >
                                      {salesPerson.code}
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
                          )
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

          {/* Add Customers Dialog */}
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
                    component={'button'}
                    onClick={() => toggleCustomerSelection(customer._id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
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
