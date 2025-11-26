import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Delete, ExpandMore } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../util/axios';
import capitalize from '../../../util/capitalize';

const TIERS = ['A+', 'A', 'B', 'C', 'D'];
export interface CustomerDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  specialMarginProducts: any[]; // Each object should include: product_id, margin, name, and brand (from the product)
  openAddDialog: () => void;
  handleDeleteAllSpecialMargins: () => void;
  onCustomerUpdate: (updatedCustomer: any) => void;
  onMarginsUpdated?: () => void;
}

const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  open,
  onClose,
  customer,
  specialMarginProducts,
  openAddDialog,
  onCustomerUpdate,
  handleDeleteAllSpecialMargins,
  onMarginsUpdated,
}) => {
  const [editMargin, setEditMargin] = useState('');
  const [editTier, setEditTier] = useState('');
  const [editInEx, setEditInEx] = useState('');
  const [status, setStatus] = useState('');
  const [assignedSalesPeople, setAssignedSalesPeople] = useState<string[]>([]);
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [showAddresses, setShowAddresses] = useState(false); // New state for toggling addresses

  // Local state for special margins (copied from prop)
  const [localSpecialMargins, setLocalSpecialMargins] = useState<any[]>(
    specialMarginProducts
  );

  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await axiosInstance.get(`/admin/sales-people`);
        setSalesPeople(response.data.sales_people);
      } catch (error) {
        toast.error('Error fetching sales people.');
      }
    };
    fetchSalesPeople();
  }, []);

  useEffect(() => {
    if (customer) {
      let margin = customer.cf_margin || '40';
      margin = margin.endsWith('%') ? margin.slice(0, -1) : margin;
      setEditMargin(margin);
      setEditInEx(customer.cf_in_ex || 'Exclusive');
      setEditTier(String(customer.cf_tier).toUpperCase() || '');

      setStatus(String(customer.status) || '');
      const arrayOfCodes =
        typeof customer.cf_sales_person === 'string'
          ? customer.cf_sales_person.split(',').map((s: string) => s.trim())
          : Array.isArray(customer.cf_sales_person)
          ? customer.cf_sales_person
          : [];
      setAssignedSalesPeople(arrayOfCodes);
    }
  }, [customer]);

  // When specialMarginProducts prop changes, update local state.
  useEffect(() => {
    setLocalSpecialMargins(specialMarginProducts);
  }, [specialMarginProducts]);

  const handleSave = async () => {
    if (!customer) return;

    const updatedFields: any = {};
    const originalMargin = (customer.cf_margin || '40%').trim();
    const newMargin = editMargin.trim();
    if (
      editTier &&
      editTier !== String(customer.cf_tier || '-').toUpperCase()
    ) {
      updatedFields.cf_tier = editTier;
    }
    if (status && status !== String(customer.status)) {
      updatedFields.status = status;
    }
    if (newMargin && `${newMargin}%` !== originalMargin) {
      updatedFields.cf_margin = `${newMargin}%`;
    }
    if (editInEx && editInEx !== customer.cf_in_ex) {
      updatedFields.cf_in_ex = editInEx;
    }
    const validSalesPeople = assignedSalesPeople.filter(
      (sp) => sp.trim() !== ''
    );
    const joinedSales = validSalesPeople.join(', ');
    const currentSales = (customer?.cf_sales_person?.toString() || '').trim();
    if (joinedSales !== currentSales) {
      updatedFields.cf_sales_person = joinedSales;
    }
    if (Object.keys(updatedFields).length === 0) {
      toast.info('No changes to update');
      return;
    }

    try {
      await axiosInstance.put(`/customers/${customer._id}`, updatedFields);
      toast.success('Customer details updated successfully');
      onCustomerUpdate({ ...customer, ...updatedFields });
      onClose();
    } catch (error) {
      toast.error('Failed to update customer details.');
    }
  };

  const handleDeleteSpecialMargin = async (prod: any) => {
    try {
      // Delete a single special margin by its document _id.
      await axiosInstance.delete(
        `/admin/customer/special_margins/${customer._id}/${prod._id}`
      );
      toast.success('Special margin deleted successfully.');
      setLocalSpecialMargins((prev) =>
        prev.filter((p) => p.product_id !== prod.product_id)
      );
      // Notify parent to refresh data
      if (onMarginsUpdated) {
        onMarginsUpdated();
      }
    } catch (error) {
      toast.error('Failed to delete special margin.');
    }
  };

  // New: Delete overall margin for a given brand.
  const handleDeleteBrandMargin = async (brand: string) => {
    try {
      // Call an endpoint to delete all special margins for this brand for the customer.
      // You'll need to implement this endpoint on the backend.
      await axiosInstance.delete(
        `/admin/customer/special_margins/brand/${customer._id}`,
        {
          params: { brand },
        }
      );
      toast.success(`Deleted overall margin for ${brand}.`);
      // Remove all items of that brand from local state.
      setLocalSpecialMargins((prev) =>
        prev.filter((item) => (item.brand || 'Other') !== brand)
      );
      // Notify parent to refresh data
      if (onMarginsUpdated) {
        onMarginsUpdated();
      }
    } catch (error) {
      toast.error(`Failed to delete overall margin for ${brand}.`);
    }
  };

  // Group special margins by brand.
  const groupByBrand = (items: any[]) => {
    return items.reduce((acc: Record<string, any[]>, curr) => {
      // Use curr.brand if available; otherwise, group under "Other"
      const brand = curr.brand || 'Other';
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(curr);
      return acc;
    }, {});
  };

  // Compute the mode margin (most frequent) in a group.
  const getModeMargin = (items: any[]) => {
    const freq: Record<string, number> = {};
    items.forEach((item) => {
      const m = item.margin;
      freq[m] = (freq[m] || 0) + 1;
    });
    let mode = null;
    let maxCount = 0;
    Object.entries(freq).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = m;
      }
    });
    return mode;
  };

  const groupedMargins = groupByBrand(localSpecialMargins);

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 600, padding: 3 } }}
    >
      {customer && (
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
            Customer Details
          </Typography>
          <Typography>
            <strong>Name:</strong> {customer.contact_name}
          </Typography>
          <Typography>
            <strong>Status:</strong> {capitalize(customer.status)}
          </Typography>
          <Typography>
            <strong>GST Number:</strong> {customer.gst_no || 'N/A'}
          </Typography>
          <Typography>
            <strong>Whatsapp Group:</strong> {customer.cf_whatsapp_group || '-'}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='status-filter-label'>Tier</InputLabel>
              <Select
                label='Tier'
                value={editTier}
                onChange={(e) => setEditTier(e.target.value)}
              >
                {TIERS.map((letter: string, index: number) => (
                  <MenuItem value={letter} defaultValue={editTier}>
                    {letter}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label='Margin'
              value={editMargin}
              onChange={(e) => setEditMargin(e.target.value)}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>GST Treatment</InputLabel>
              <Select
                value={editInEx}
                label='GST Treatment'
                onChange={(e) => setEditInEx(e.target.value)}
              >
                <MenuItem value='Inclusive'>Inclusive</MenuItem>
                <MenuItem value='Exclusive'>Exclusive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label='Status'
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Sales Person</InputLabel>
              <Select
                multiple
                value={assignedSalesPeople}
                onChange={(e) => {
                  const value = e.target.value;
                  setAssignedSalesPeople(
                    typeof value === 'string' ? value.split(',') : value
                  );
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {(selected as string[]).map((val) =>
                      val !== '' ? <Chip key={val} label={val} /> : null
                    )}
                  </Box>
                )}
              >
                {salesPeople
                  .filter((sp: any) => sp.name !== '-')
                  .map((sp: any) => (
                    <MenuItem key={sp._id} value={sp.code}>
                      {sp.name} ({sp.code})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
          {customer.addresses.length > 0 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant='outlined'
                onClick={() => setShowAddresses((prev) => !prev)}
              >
                {showAddresses ? 'Hide Addresses' : 'Show Addresses'}
              </Button>
              {showAddresses && (
                <List>
                  {customer.addresses.map((a: any, i: number) => (
                    <ListItem key={a.address_id}>
                      <ListItemText
                        primary={`Address ${i + 1}: ${a.attention}`}
                        secondary={
                          <>
                            {a.address}, {a.street2 && `${a.street2}, `}
                            {a.city}, {a.state} - {a.zip} <br />
                            {a.country} ({a.country_code})
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant='h5' mb={2}>
              Special Margins
            </Typography>
            <Box display='flex' flexDirection='row' gap='24px' mb={2}>
              <Button variant='contained' onClick={openAddDialog}>
                Add Special Margin
              </Button>
              <Button
                variant='contained'
                color='error'
                onClick={handleDeleteAllSpecialMargins}
              >
                Remove All Special Margins
              </Button>
            </Box>

            {Object.keys(groupedMargins).length === 0 ? (
              <Typography>No special margins found.</Typography>
            ) : (
              Object.entries(groupedMargins).map(([brand, products]) => {
                // Compute unique margins in this group.
                const uniqueMargins = Array.from(
                  new Set(products.map((p) => p.margin))
                );
                if (uniqueMargins.length === 1) {
                  // Entire brand group has the same margin - show as accordion
                  return (
                    <Accordion
                      key={brand}
                      sx={{
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px !important',
                        '&:before': {
                          display: 'none',
                        },
                        boxShadow: 1,
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                          backgroundColor: '#f0f7ff',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            pr: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant='h6'>
                              {brand}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {products.length} product{products.length !== 1 ? 's' : ''} with uniform margin
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={`Margin: ${uniqueMargins[0]}`}
                              color='success'
                              size='medium'
                            />
                            <IconButton
                              color='error'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBrandMargin(brand);
                              }}
                              size='small'
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 2 }}>
                        <TableContainer
                          component={Paper}
                          variant='outlined'
                          sx={{ maxHeight: 400 }}
                        >
                          <Table size='small' stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: '#f5f5f5',
                                  }}
                                >
                                  #
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: '#f5f5f5',
                                  }}
                                >
                                  Product Name
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: '#f5f5f5',
                                  }}
                                >
                                  Margin
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: '#f5f5f5',
                                  }}
                                >
                                  Action
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {products.map((prod, index) => (
                                <TableRow
                                  key={prod.product_id}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: '#f9f9f9',
                                    },
                                  }}
                                >
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <Typography variant='body2'>
                                      {prod.name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={prod.margin}
                                      size='small'
                                      color='success'
                                      variant='outlined'
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant='outlined'
                                      color='error'
                                      size='small'
                                      onClick={() =>
                                        handleDeleteSpecialMargin(prod)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  );
                } else {
                  // Mixed margins: find the mode (default) and list exceptions.
                  const defaultMargin = getModeMargin(products);
                  const exceptions = products.filter(
                    (p) => p.margin !== defaultMargin
                  );
                  return (
                    <Box
                      key={brand}
                      mb={3}
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <Box
                        display={'flex'}
                        flexDirection={'row'}
                        gap={'16px'}
                        alignItems={'center'}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant='h6' sx={{ flex: 1 }}>
                          {brand} - Overall Margin: {defaultMargin}
                        </Typography>
                        <IconButton
                          color='error'
                          onClick={() => handleDeleteBrandMargin(brand)}
                          size='small'
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      {exceptions.length > 0 && (
                        <Box>
                          <Typography
                            variant='subtitle2'
                            color='text.secondary'
                            sx={{ mb: 1 }}
                          >
                            Exceptions ({exceptions.length} product
                            {exceptions.length !== 1 ? 's' : ''} with different
                            margin):
                          </Typography>
                          <TableContainer
                            component={Paper}
                            sx={{
                              boxShadow: 1,
                              borderRadius: 1,
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            <Table size='small'>
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontWeight: 'bold',
                                      backgroundColor: '#f5f5f5',
                                    }}
                                  >
                                    #
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 'bold',
                                      backgroundColor: '#f5f5f5',
                                    }}
                                  >
                                    Product Name
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 'bold',
                                      backgroundColor: '#f5f5f5',
                                    }}
                                  >
                                    Margin
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 'bold',
                                      backgroundColor: '#f5f5f5',
                                    }}
                                  >
                                    Action
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {exceptions.map((prod, index) => (
                                  <TableRow
                                    key={prod.product_id}
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: '#f9f9f9',
                                      },
                                    }}
                                  >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                      <Typography variant='body2'>
                                        {prod.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={prod.margin}
                                        size='small'
                                        color='warning'
                                        variant='outlined'
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant='outlined'
                                        color='error'
                                        size='small'
                                        onClick={() =>
                                          handleDeleteSpecialMargin(prod)
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Box>
                  );
                }
              })
            )}
          </Box>

          <Box sx={{ mt: 3, mb: 3, display: ' flex', gap: 2 }}>
            <Button variant='contained' onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant='contained' color='secondary' onClick={onClose}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default CustomerDetailsDrawer;
