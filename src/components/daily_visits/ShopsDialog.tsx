import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { toast } from 'react-toastify';
import CustomerSearchBar from '../OrderForm/CustomerSearchBar';
import AddressSelection from '../common/AddressSelection';

interface ShopsDialogProps {
  open: boolean;
  onClose: () => void;
  dailyVisit: any;
  refreshDailyVisit: () => void;
  user: any;
}

interface Shop {
  id: string;
  selectedCustomer: any;
  customer_name?: string;
  address: any;
  reason: string;
  editing: boolean;
  customer_id?: string | null;
}

const ShopsDialog = ({
  open,
  onClose,
  dailyVisit,
  refreshDailyVisit,
  user,
}: ShopsDialogProps) => {
  const [shopsForm, setShopsForm] = useState<Shop[]>([]);
  const [shopsSubmitting, setShopsSubmitting] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Only load initial shops data once when the dialog opens
  useEffect(() => {
    if (open && dailyVisit?.shops && !initialLoaded) {
      const loadShops = async () => {
        const initialShopsForm: Shop[] = await Promise.all(
          dailyVisit.shops.map(async (shop: any) => {
            let selectedCustomer = shop.selectedCustomer;
            if (!selectedCustomer && shop.customer_id) {
              try {
                const { data } = await axios.get(
                  `${process.env.api_url}/customers/${shop.customer_id}`
                );
                selectedCustomer = data.customer;
              } catch (err) {
                console.error(err);
              }
            }
            return {
              id:
                shop._id ||
                shop.id ||
                `existing-${Math.random().toString(36).substring(2, 9)}`,
              selectedCustomer: selectedCustomer || null,
              customer_name: shop.customer_name || '',
              potential_customer: shop.potential_customer,
              potential_customer_id: shop.potential_customer_id,
              potential_customer_name: shop.potential_customer
                ? shop.potential_customer_name
                : null,
              potential_customer_address: shop.potential_customer
                ? shop.potential_customer_address
                : null,
              potential_customer_tier: shop.potential_customer
                ? shop.potential_customer_tier
                : null,
              address: !shop.potential_customer ? shop.address : {},
              reason: shop.reason || '',
              editing: false,
              customer_id: shop.customer_id || null,
              order_expected: shop?.order_expected || false,
            };
          })
        );
        setShopsForm(initialShopsForm);
        setInitialLoaded(true);
      };
      loadShops();
    }
    // When dialog closes, reset the initialLoaded flag for the next open
    if (!open) {
      setInitialLoaded(false);
      setShopsForm([]);
    }
  }, [open, dailyVisit, initialLoaded]);

  const addShop = useCallback(() => {
    setShopsForm((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        selectedCustomer: null,
        customer_name: '',
        address: {},
        reason: '',
        editing: true,
      },
    ]);
  }, []);

  const updateShop = (index: number, field: string, value: any) => {
    setShopsForm((prev) =>
      prev.map((shop, i) => (i === index ? { ...shop, [field]: value } : shop))
    );
  };

  const toggleEditShop = (index: number) => {
    setShopsForm((prev) =>
      prev.map((shop, i) =>
        i === index ? { ...shop, editing: !shop.editing } : shop
      )
    );
  };

  const moveShopUp = useCallback((index: number) => {
    if (index === 0) return;
    setShopsForm((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
      return updated;
    });
  }, []);

  const moveShopDown = useCallback((index: number) => {
    setShopsForm((prev) => {
      if (index === prev.length - 1) return prev;
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [
        updated[index + 1],
        updated[index],
      ];
      return updated;
    });
  }, []);

  const deleteShop = (index: number) => {
    setShopsForm((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopsSubmitting(true);
    try {
      const formData = new FormData();
      const shopsData = shopsForm.map((shop: any) => ({
        id: shop._id,
        customer_id: shop.selectedCustomer?._id || shop.selectedCustomer?.id,
        customer_name:
          shop.customer_name ||
          (shop.selectedCustomer
            ? shop.selectedCustomer.contact_name || shop.selectedCustomer.name
            : null),
        potential_customer: shop.potential_customer,
        potential_customer_id: shop.potential_customer_id,
        potential_customer_name: shop.potential_customer_name,
        potential_customer_address: shop.potential_customer_address,
        potential_customer_tier: shop.potential_customer_tier,
        address: shop.address,
        reason: shop.reason,
        order_expected: shop.order_expected,
      }));
      formData.append('shops', JSON.stringify(shopsData));
      formData.append('uploaded_by', user?.data?._id);

      const response = await axios.put(
        `${process.env.api_url}/daily_visits/${dailyVisit._id}`,
        formData
      );
      toast.success(response.data.message || 'Shops updated successfully');
      refreshDailyVisit();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error updating shops');
    } finally {
      setShopsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !shopsSubmitting && onClose()}
      fullWidth
      maxWidth='xl'
      scroll='paper'
    >
      <DialogTitle>
        <Typography variant='h6'>Manage Shop Visits</Typography>
        <Typography variant='body2' color='text.secondary'>
          Add or edit shops you visited during this trip
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box component='form' onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {shopsForm.length === 0 ? (
            <Alert severity='info' sx={{ mb: 2 }}>
              No shops added yet. Click the "+" button below to add a shop.
            </Alert>
          ) : (
            shopsForm.map((shop: any, index) => (
              <Paper
                key={shop.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                }}
                elevation={1}
              >
                <Box
                  sx={{
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      gap: '16px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Chip
                      label={
                        shop?.potential_customer
                          ? `Shop ${index + 1} (Potential Customer)`
                          : `Shop ${index + 1}`
                      }
                      color='primary'
                      size='small'
                      variant='outlined'
                    />
                  </Box>
                  <Box>
                    <Tooltip title='Move Up'>
                      <span>
                        <IconButton
                          onClick={() => moveShopUp(index)}
                          disabled={index === 0}
                          size='small'
                        >
                          <ArrowUpwardIcon fontSize='small' />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Move Down'>
                      <span>
                        <IconButton
                          onClick={() => moveShopDown(index)}
                          disabled={index === shopsForm.length - 1}
                          size='small'
                        >
                          <ArrowDownwardIcon fontSize='small' />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {shop.editing ? (
                      <Tooltip title='Save'>
                        <IconButton
                          onClick={() => toggleEditShop(index)}
                          color='primary'
                          size='small'
                        >
                          <SaveIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title='Edit'>
                        <IconButton
                          onClick={() => toggleEditShop(index)}
                          color='primary'
                          size='small'
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title='Delete'>
                      <IconButton
                        onClick={() => deleteShop(index)}
                        color='error'
                        size='small'
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                {shop.editing ? (
                  <Box display='flex' gap='16px' flexDirection='column'>
                    <FormControlLabel
                      control={
                        <Checkbox
                          disabled={shop.potentialCustomer}
                          checked={
                            shop.potentialCustomer
                              ? false
                              : shop.order_expected || false
                          }
                          onChange={(e: any) =>
                            updateShop(
                              index,
                              'order_expected',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Expect an Order from Customer soon'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          disabled={shop.selectedCustomer}
                          checked={shop.potential_customer || false}
                          onChange={(e: any) =>
                            updateShop(
                              index,
                              'potential_customer',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Potential Customer'
                    />
                    {shop.potential_customer ? (
                      <>
                        <TextField
                          label='Enter Customer Name'
                          fullWidth
                          value={shop.potential_customer_name || ''}
                          onChange={(e) =>
                            updateShop(
                              index,
                              'potential_customer_name',
                              e.target.value
                            )
                          }
                        />
                        <TextField
                          label='Enter Customer Address'
                          fullWidth
                          value={shop.potential_customer_address || ''}
                          onChange={(e) =>
                            updateShop(
                              index,
                              'potential_customer_address',
                              e.target.value
                            )
                          }
                        />
                        <FormControl fullWidth>
                          <InputLabel>Customer Tier</InputLabel>
                          <Select
                            value={shop.potential_customer_tier || ''}
                            onChange={(e) =>
                              updateShop(
                                index,
                                'potential_customer_tier',
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value='A'>A</MenuItem>
                            <MenuItem value='B'>B</MenuItem>
                            <MenuItem value='C'>C</MenuItem>
                            <MenuItem value='D'>D</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label='Enter Customer Phone'
                          fullWidth
                          value={shop.potential_customer_mobile || ''}
                          onChange={(e) =>
                            updateShop(
                              index,
                              'potential_customer_mobile',
                              e.target.value
                            )
                          }
                        />
                      </>
                    ) : (
                      <>
                        <CustomerSearchBar
                          ref_no={false}
                          label='Select Customer'
                          onChange={(value) =>
                            updateShop(index, 'selectedCustomer', value)
                          }
                          initialValue={shop.selectedCustomer}
                          value={shop.selectedCustomer}
                        />
                        <AddressSelection
                          shop={shop}
                          selectedAddressId={shop.address.address_id}
                          handleAddressChange={(e: any) => {
                            const address_id = e.target.value;
                            const selectedAddress =
                              shop.selectedCustomer.addresses.find(
                                (a: any) => a.address_id === address_id
                              );
                            if (selectedAddress) {
                              updateShop(index, 'address', selectedAddress);
                            }
                          }}
                        />
                      </>
                    )}
                    <Box>
                      <Typography variant='body2' gutterBottom>
                        Reason for Visit
                      </Typography>
                      <input
                        type='text'
                        value={shop.reason}
                        onChange={(e) =>
                          updateShop(index, 'reason', e.target.value)
                        }
                        style={{ width: '100%', padding: '8px' }}
                        required
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant='subtitle1'
                      fontWeight='bold'
                      gutterBottom
                    >
                      {shop?.potential_customer
                        ? shop.potential_customer_name
                        : typeof shop.selectedCustomer === 'object'
                        ? shop.selectedCustomer?.contact_name
                        : shop.customer_name}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      <strong>Address:</strong>
                    </Typography>
                    <Typography variant='body2' paragraph>
                      {shop?.potential_customer
                        ? shop.potential_customer_address
                        : shop.address && shop.address.address
                        ? shop.address.address
                        : 'No address provided'}
                    </Typography>
                    {shop?.potential_customer && (
                      <>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          gutterBottom
                        >
                          <strong>Tier:</strong>
                        </Typography>
                        <Typography variant='body2' paragraph>
                          {shop.potential_customer_tier}
                        </Typography>
                      </>
                    )}
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Reason:</strong>
                    </Typography>
                    <Typography variant='body2' mb={1}>
                      {shop.reason || 'No reason provided'}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      <strong>Order Expected Soon:</strong>
                    </Typography>
                    <Typography variant='body2'>
                      {shop?.order_expected ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <IconButton onClick={addShop} color='primary'>
              <AddIcon fontSize='large' />
            </IconButton>
          </Box>
          <DialogActions sx={{ mt: 2 }}>
            <Button onClick={onClose} color='secondary'>
              Cancel
            </Button>
            <Button type='submit' variant='contained' color='primary'>
              {shopsSubmitting ? 'Saving...' : 'Save Shops'}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShopsDialog;
