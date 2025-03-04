import { useContext, useEffect, useState, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
  Paper,
  Stack,
  Divider,
  Chip,
  Tooltip,
  Badge,
  Avatar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';
import { useRouter } from 'next/router';
import Header from '../../src/components/common/Header';
import CustomerSearchBar from '../../src/components/OrderForm/CustomerSearchBar';
import Address from '../../src/components/OrderForm/SelectAddress';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Check } from '@mui/icons-material';
import AddressSelection from '../../src/components/common/AddressSelection';

// Helper function to format an address object into a string.
const formatAddress = (address: any) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.attention,
    address.address,
    address.streetz,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter((part) => part && part.toString().trim() !== '');
  return parts.join(', ');
};

/**
 * Memoized shop card component.
 * It only re-renders when its props (shop data or index) change.
 */
const ShopCard = memo(function ShopCard({
  shop,
  index,
  updateShop,
  toggleEditShop,
  deleteShop,
  moveShopUp,
  moveShopDown,
  isMobile,
  setLoading,
  totalShops,
}: any) {
  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '100%',
          backgroundColor: 'primary.main',
        },
      }}
    >
      <Badge
        badgeContent={index + 1}
        color='primary'
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          '& .MuiBadge-badge': {
            height: 24,
            minWidth: 24,
            borderRadius: 12,
          },
        }}
      />

      {shop.editing ? (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Checkbox to mark as potential customer */}
          <FormControlLabel
            control={
              <Checkbox
                disabled={shop.selectedCustomer}
                checked={shop.potentialCustomer || false}
                onChange={(e: any) =>
                  updateShop(index, 'potentialCustomer', e.target.checked)
                }
              />
            }
            label='Potential Customer'
          />
          {/* If potential, show TextField for customer name, otherwise use the search bar */}
          {shop.potentialCustomer && (
            <TextField
              label='Enter Customer Name'
              fullWidth
              value={shop.potential_customer_name || ''}
              onChange={(e) =>
                updateShop(index, 'potential_customer_name', e.target.value)
              }
            />
          )}
          {!shop.potentialCustomer && (
            <CustomerSearchBar
              ref_no={false}
              label='Select Customer'
              onChange={(value) => {
                updateShop(index, 'selectedCustomer', value);
                updateShop(index, 'customer_id', value?._id);
                updateShop(index, 'customer_name', value?.contact_name);
              }}
              initialValue={shop.selectedCustomer}
              value={shop.selectedCustomer}
            />
          )}
          {shop.potentialCustomer && (
            <TextField
              label='Enter Customer Address'
              fullWidth
              value={shop.potential_customer_address || ''}
              onChange={(e) =>
                updateShop(index, 'potential_customer_address', e.target.value)
              }
            />
          )}
          {/* Render address component if potential customer OR when a customer is selected */}
          {shop.selectedCustomer && (
            <AddressSelection
              shop={shop}
              selectedAddressId={shop?.address?.address_id}
              handleAddressChange={(e: any) => {
                const address_id = e.target.value;
                const selectedAddress = shop.selectedCustomer.addresses.find(
                  (a: any) => a.address_id === address_id
                );
                if (selectedAddress) {
                  updateShop(index, 'address', selectedAddress);
                }
              }}
            />
          )}
          <TextField
            label='Reason for Visit'
            fullWidth
            multiline
            rows={2}
            margin='normal'
            value={shop.reason}
            onChange={(e) => updateShop(index, 'reason', e.target.value)}
            required
            InputProps={{
              startAdornment: <DescriptionIcon color='action' sx={{ mr: 1 }} />,
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Tooltip title='Move Up'>
                <span>
                  <IconButton
                    onClick={() => moveShopUp(index)}
                    disabled={index === 0}
                    size='small'
                    color='primary'
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title='Move Down'>
                <span>
                  <IconButton
                    onClick={() => moveShopDown(index)}
                    disabled={index === totalShops - 1}
                    size='small'
                    color='primary'
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box>
              <Tooltip title='Done Editing'>
                <IconButton
                  onClick={() => toggleEditShop(index)}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  <Check />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete'>
                <IconButton
                  onClick={() => deleteShop(index)}
                  sx={{
                    ml: 1,
                    backgroundColor: 'error.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.main',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ mt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon color='primary' sx={{ mr: 1.5 }} />
            <Typography variant='subtitle1' fontWeight='bold'>
              Customer:
            </Typography>
            <Typography variant='body1' sx={{ ml: 1 }}>
              {shop.potentialCustomer
                ? shop.potential_customer_name
                : typeof shop.selectedCustomer === 'object'
                ? shop.selectedCustomer?.contact_name
                : shop.selectedCustomer}
            </Typography>
          </Box>

          <Divider variant='middle' />

          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <PlaceIcon color='primary' sx={{ mr: 1.5, mt: 0.3 }} />
            <Typography variant='subtitle1' fontWeight='bold'>
              Address:
            </Typography>
            <Typography
              variant='body1'
              sx={{
                ml: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {shop.potentialCustomer
                ? shop.potential_customer_address
                : formatAddress(shop.address)}
            </Typography>
          </Box>

          <Divider variant='middle' />

          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <DescriptionIcon color='primary' sx={{ mr: 1.5, mt: 0.3 }} />
            <Typography variant='subtitle1' fontWeight='bold'>
              Reason:
            </Typography>
            <Typography variant='body1' sx={{ ml: 1 }}>
              {shop.reason}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Box>
              <Tooltip title='Move Up'>
                <span>
                  <IconButton
                    onClick={() => moveShopUp(index)}
                    disabled={index === 0}
                    size='small'
                    color='primary'
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title='Move Down'>
                <span>
                  <IconButton
                    onClick={() => moveShopDown(index)}
                    disabled={index === totalShops - 1}
                    size='small'
                    color='primary'
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box>
              <Tooltip title='Edit'>
                <IconButton
                  onClick={() => toggleEditShop(index)}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete'>
                <IconButton
                  onClick={() => deleteShop(index)}
                  sx={{
                    ml: 1,
                    backgroundColor: 'error.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.main',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Stack>
      )}
    </Paper>
  );
});

function DailyVisits() {
  const [dailyVisits, setDailyVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user }: any = useContext(AuthContext);
  const router = useRouter();

  // State for the selfie file
  const [selfie, setSelfie] = useState(null);

  // State for the creation dialog (with multiple shops)
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState([
    {
      id: Date.now(),
      selectedCustomer: null,
      potentialCustomer: false,
      address: {},
      reason: '',
      editing: true,
    },
  ]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch daily visits from the API
  const getData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/daily_visits`, {
        params: { created_by: user?.data?._id },
      });
      setDailyVisits(resp.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching daily visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for selfie file selection
  const handleSelfieChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setSelfie(e.target.files[0]);
    }
  };

  // Function to create a new daily visit entry
  const createDailyVisit = async (formData: any) => {
    setLoading(true);
    try {
      await axios.post(`${process.env.api_url}/daily_visits`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Daily visit created successfully!');
      getData();
      setShops([]);
      setSelfie(null);
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Error creating daily visit:\n${error?.response?.data?.detail}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Shop helper functions for the dialog ---
  const addShop = useCallback(() => {
    setShops((prev: any) => [
      ...prev,
      {
        id: Date.now(),
        potentialCustomer: false,
        selectedCustomer: null,
        address: {},
        reason: '',
        editing: true,
      },
    ]);
  }, []);

  const updateShop = useCallback((index: number, field: string, value: any) => {
    setShops((prev) => {
      const updated: any = [...prev];
      if (updated[index][field] === value) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const toggleEditShop = useCallback((index: number) => {
    setShops((prev) =>
      prev.map((shop, i) =>
        i === index ? { ...shop, editing: !shop.editing } : shop
      )
    );
  }, []);

  const deleteShop = useCallback((index: any) => {
    setShops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveShopUp = useCallback((index: any) => {
    if (index === 0) return;
    setShops((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
      return updated;
    });
  }, []);

  const moveShopDown = useCallback((index: any) => {
    setShops((prev) => {
      if (index === prev.length - 1) return prev;
      const updated = [...prev];
      [updated[index + 1], updated[index]] = [
        updated[index],
        updated[index + 1],
      ];
      return updated;
    });
  }, []);

  // Handle form submission for creating a daily visit with multiple shops
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log(shops);
    if (!selfie) {
      toast.error('Please upload a selfie');
      return;
    }
    for (let shop of shops) {
      if (shop.editing) {
        toast.error(
          'Please complete editing all shop details before submitting.'
        );
        return;
      }
      if (!(shop.selectedCustomer || shop.potentialCustomer)) {
        toast.error('Please select a customer for each shop.');
        return;
      }
      if (!shop.address || !shop.reason) {
        toast.error('Please complete address and reason for each shop.');
        return;
      }
    }
    const formData = new FormData();
    const formattedShops = shops.map((shop: any) => ({
      customer_id:
        !shop.potentialCustomer &&
        typeof shop.selectedCustomer === 'object' &&
        shop.selectedCustomer._id
          ? shop.selectedCustomer._id
          : undefined,
      customer_name:
        !shop.potentialCustomer && typeof shop.selectedCustomer === 'object'
          ? shop.selectedCustomer.contact_name || shop.selectedCustomer.name
          : undefined,
      potential_customer: shop.potentialCustomer ?? null,
      potential_customer_name: shop.potentialCustomer
        ? shop.potential_customer_name
        : null,
      potential_customer_address: shop.potentialCustomer
        ? shop.potential_customer_address
        : null,
      address: shop.address,
      reason: shop.reason,
    }));
    formData.append('shops', JSON.stringify(formattedShops));
    formData.append('created_by', user?.data?._id);

    // Append selfie file if available
    if (selfie) {
      formData.append('selfie', selfie);
    }

    await createDailyVisit(formData);
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{ width: '100%', gap: 2, p: isMobile ? 2 : 4 }}
    >
      <Header title='Daily Visits' showBackButton />
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
          size='large'
          sx={{
            borderRadius: 28,
            px: 3,
            py: 1,
            boxShadow: 3,
            fontSize: '1rem',
          }}
        >
          Create Daily Visit
        </Button>
      </Box>

      {/* Display Daily Visits using a responsive Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : dailyVisits.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            width: '100%',
            maxWidth: 600,
          }}
        >
          <StorefrontIcon
            sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant='h6' color='text.secondary' gutterBottom>
            No Daily Visits Available
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Create your first daily visit to get started
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ width: '100%', p: 2 }}>
          <Grid container spacing={3}>
            {dailyVisits.map((visit: any) => (
              <Grid item xs={12} sm={6} md={4} key={visit._id}>
                <Card
                  onClick={() => router.push(`/daily_visits/${visit._id}`)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ backgroundColor: 'primary.main' }}>
                        <CalendarTodayIcon />
                      </Avatar>
                    }
                    title={
                      <Typography variant='h6'>
                        {new Date(visit.created_at).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </Typography>
                    }
                    subheader={
                      <Chip
                        size='small'
                        label={`${visit.shops?.length || 0} shops`}
                        color='primary'
                        variant='outlined'
                      />
                    }
                  />
                  {visit.selfie && (
                    <CardMedia
                      component='img'
                      image={visit.selfie}
                      alt='Selfie'
                      sx={{ height: 200, objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    {visit.shops && visit.shops.length > 0 ? (
                      visit.shops.map((shop: any, idx: number) => (
                        <Box
                          key={idx}
                          sx={{
                            mb: 2,
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            '&:last-child': {
                              mb: 0,
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.02)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <PersonIcon
                              color='primary'
                              fontSize='small'
                              sx={{ mr: 1 }}
                            />
                            <Typography variant='body2' fontWeight='medium'>
                              {shop.customer_name
                                ? shop.customer_name
                                : shop.potential_customer_name}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              mb: 1,
                            }}
                          >
                            <PlaceIcon
                              color='action'
                              fontSize='small'
                              sx={{ mr: 1, mt: 0.3 }}
                            />
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {shop?.potential_customer
                                ? shop?.potential_customer_address
                                : formatAddress(shop.address)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{ display: 'flex', alignItems: 'flex-start' }}
                          >
                            <DescriptionIcon
                              color='action'
                              fontSize='small'
                              sx={{ mr: 1, mt: 0.3 }}
                            />
                            <Typography variant='body2'>
                              {shop.reason}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontStyle: 'italic' }}
                      >
                        No Shops Available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Dialog for Creating a Daily Visit with Multiple Shops */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth='md'
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            py: 2,
            backgroundColor: 'primary.main',
            color: 'white',
          }}
        >
          Create Daily Visit
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component='form' onSubmit={handleSubmit}>
            {/* Selfie Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' gutterBottom>
                Upload Selfie
              </Typography>
              <Button variant='outlined' component='label'>
                {selfie ? 'Change Selfie' : 'Upload Selfie'}
                <input
                  hidden
                  accept='image/*'
                  type='file'
                  onChange={handleSelfieChange}
                />
              </Button>
              {selfie && (
                <Box mt={2}>
                  <img
                    src={URL.createObjectURL(selfie)}
                    alt='Selfie Preview'
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
              )}
            </Box>
            {shops.map((shop, index) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                index={index}
                updateShop={updateShop}
                toggleEditShop={toggleEditShop}
                deleteShop={deleteShop}
                moveShopUp={moveShopUp}
                moveShopDown={moveShopDown}
                isMobile={isMobile}
                setLoading={setLoading}
                totalShops={shops.length}
              />
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Button
                variant='outlined'
                color='primary'
                startIcon={<AddIcon />}
                onClick={addShop}
                sx={{
                  borderRadius: 28,
                  px: 3,
                }}
              >
                Add Shop
              </Button>
            </Box>
            <DialogActions sx={{ px: 0, pb: 0 }}>
              <Button
                onClick={() => setOpen(false)}
                color='secondary'
                variant='outlined'
                sx={{
                  borderRadius: 28,
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                sx={{
                  borderRadius: 28,
                  px: 3,
                }}
              >
                Submit
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default DailyVisits;
