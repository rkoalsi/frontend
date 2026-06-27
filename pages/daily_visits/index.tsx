import { useContext, useEffect, useState, useCallback, memo, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
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
  TablePagination,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
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
import { Check, ShoppingCartOutlined } from '@mui/icons-material';
import AddressSelection from '../../src/components/common/AddressSelection';
import formatAddress from '../../src/util/formatAddress';
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
  user,
}: any) {
  const [potentialCustomers, setPotentialCustomers] = useState([]);
  const [loadingPotentialCustomers, setLoadingPotentialCustomers] =
    useState(false);

  // Fetch potential customers created by the user
  useEffect(() => {
    if (shop.editing && shop.potentialCustomer && user?._id) {
      const fetchPotentialCustomers = async () => {
        setLoadingPotentialCustomers(true);
        try {
          const { data } = await axios.get(
            `${process.env.api_url}/potential_customers?created_by=${user._id}`
          );
          setPotentialCustomers(data || []);
        } catch (err) {
          console.error('Error fetching potential customers:', err);
          toast.error('Failed to load potential customers');
        } finally {
          setLoadingPotentialCustomers(false);
        }
      };
      fetchPotentialCustomers();
    }
  }, [shop.editing, shop.potentialCustomer, user?._id]);

  // Handle selection of an existing potential customer
  const handleSelectPotentialCustomer = (potentialCustomer: any) => {
    if (potentialCustomer) {
      updateShop(index, 'potential_customer_id', potentialCustomer._id);
      updateShop(index, 'potential_customer_name', potentialCustomer.name);
      updateShop(
        index,
        'potential_customer_address',
        potentialCustomer.address
      );
      updateShop(index, 'potential_customer_tier', potentialCustomer.tier);
      updateShop(
        index,
        'potential_customer_mobile',
        potentialCustomer.mobile || ''
      );
      updateShop(
        index,
        'potential_customer_state_city',
        potentialCustomer.state_city || ''
      );
      updateShop(
        index,
        'potential_customer_customer_name',
        potentialCustomer.customer_name || ''
      );
      updateShop(
        index,
        'potential_customer_follow_up_date',
        potentialCustomer.follow_up_date || ''
      );
      updateShop(
        index,
        'potential_customer_comments',
        potentialCustomer.comments || ''
      );
      updateShop(
        index,
        'potential_customer_status',
        potentialCustomer.status || ''
      );
    } else {
      // Clear potential customer fields if selection is removed
      updateShop(index, 'potential_customer_id', null);
      updateShop(index, 'potential_customer_name', '');
      updateShop(index, 'potential_customer_address', '');
      updateShop(index, 'potential_customer_tier', '');
      updateShop(index, 'potential_customer_mobile', '');
      updateShop(index, 'potential_customer_state_city', '');
      updateShop(index, 'potential_customer_customer_name', '');
      updateShop(index, 'potential_customer_follow_up_date', '');
      updateShop(index, 'potential_customer_comments', '');
      updateShop(index, 'potential_customer_status', '');
    }
  };

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
          <FormControlLabel
            control={
              <Checkbox
                disabled={shop.potentialCustomer}
                checked={
                  shop.potentialCustomer ? false : shop.order_expected || false
                }
                onChange={(e) =>
                  updateShop(index, 'order_expected', e.target.checked)
                }
              />
            }
            label='Expect an Order from Customer soon'
          />
          <FormControlLabel
            control={
              <Checkbox
                disabled={shop.selectedCustomer}
                checked={shop.potentialCustomer || false}
                onChange={(e) => {
                  updateShop(index, 'potentialCustomer', e.target.checked);
                  // Clear potential customer fields if unchecked
                  if (!e.target.checked) {
                    handleSelectPotentialCustomer(null);
                  }
                }}
              />
            }
            label='Potential Customer'
          />

          {/* Potential Customer Selection (NEW) */}
          {shop.potentialCustomer && (
            <Autocomplete
              options={potentialCustomers}
              getOptionLabel={(option: any) => option.name}
              loading={loadingPotentialCustomers}
              onChange={(_, value) => handleSelectPotentialCustomer(value)}
              value={
                shop.potential_customer_id
                  ? potentialCustomers.find(
                      (pc: any) => pc._id === shop.potential_customer_id
                    ) || null
                  : null
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select Existing Potential Customer'
                  variant='outlined'
                  fullWidth
                  helperText='Leave empty to create a new potential customer'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingPotentialCustomers ? (
                          <CircularProgress color='inherit' size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}

          {/* If not potential customer, use the customer search bar */}
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

          {/* Potential Customer Fields */}
          {shop.potentialCustomer && (
            <>
              <TextField
                label='Store Name'
                fullWidth
                value={shop.potential_customer_name || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_name', e.target.value)
                }
                required
              />
              <TextField
                label='Address'
                fullWidth
                value={shop.potential_customer_address || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_address', e.target.value)
                }
                required
              />
              <TextField
                label='State/City'
                fullWidth
                value={shop.potential_customer_state_city || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_state_city', e.target.value)
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={shop.potential_customer_tier || ''}
                  onChange={(e) =>
                    updateShop(index, 'potential_customer_tier', e.target.value)
                  }
                >
                  <MenuItem value='A'>A</MenuItem>
                  <MenuItem value='B'>B</MenuItem>
                  <MenuItem value='C'>C</MenuItem>
                  <MenuItem value='D'>D</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label='Customer Name'
                fullWidth
                value={shop.potential_customer_customer_name || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_customer_name', e.target.value)
                }
              />
              <TextField
                label='Mobile'
                fullWidth
                value={shop.potential_customer_mobile || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_mobile', e.target.value)
                }
              />
              <TextField
                label='Follow Up Date'
                type='date'
                fullWidth
                value={shop.potential_customer_follow_up_date || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_follow_up_date', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label='Comments'
                fullWidth
                multiline
                rows={3}
                value={shop.potential_customer_comments || ''}
                onChange={(e) =>
                  updateShop(index, 'potential_customer_comments', e.target.value)
                }
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={shop.potential_customer_status || ''}
                  onChange={(e) =>
                    updateShop(index, 'potential_customer_status', e.target.value)
                  }
                >
                  <MenuItem value='Onboard'>Onboard</MenuItem>
                  <MenuItem value='Decline'>Decline</MenuItem>
                  <MenuItem value='Intalks'>Intalks</MenuItem>
                  <MenuItem value='Issue'>Issue</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {/* Render address component if not potential customer AND when a customer is selected */}
          {shop.selectedCustomer && !shop.potentialCustomer && (
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

          {/* Reason for Visit */}
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

          {/* Bottom Action Buttons */}
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
            {shop.potentialCustomer && (
              <Chip
                size='small'
                label='Potential'
                color='secondary'
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <Divider variant='middle' />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCartOutlined color='primary' sx={{ mr: 1.5 }} />
            <Typography variant='subtitle1' fontWeight='medium'>
              Order Expected Soon: {shop?.order_expected ? 'Yes' : 'No'}
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

          {shop.potentialCustomer && shop.potential_customer_state_city && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  State/City:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_state_city}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_tier && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Tier:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_tier}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_customer_name && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Customer Name:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_customer_name}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_mobile && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Mobile:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_mobile}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_follow_up_date && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Follow Up Date:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_follow_up_date}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_comments && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Comments:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_comments}
                </Typography>
              </Box>
            </>
          )}

          {shop.potentialCustomer && shop.potential_customer_status && (
            <>
              <Divider variant='middle' />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Status:
                </Typography>
                <Typography variant='body1' sx={{ ml: 1 }}>
                  {shop.potential_customer_status}
                </Typography>
              </Box>
            </>
          )}

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
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [skipPage, setSkipPage] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const ROWS_PER_PAGE = 5;
  const { user }: any = useContext(AuthContext);
  const router = useRouter();

  // State for the selfie file
  const [selfie, setSelfie] = useState(null);

  // State for the creation dialog (with multiple shops)
  const [open, setOpen] = useState(false);
  const [shops, setShops]: any = useState([
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

  const selfiePreviewUrl = useMemo(() => {
    if (!selfie) return null;
    const url = URL.createObjectURL(selfie as File);
    return url;
  }, [selfie]);

  useEffect(() => {
    return () => {
      if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    };
  }, [selfiePreviewUrl]);

  // Fetch daily visits from the API
  const getData = async (pageOverride?: number) => {
    setLoading(true);
    const activePage = pageOverride !== undefined ? pageOverride : page;
    try {
      const params: any = { created_by: user?._id, page: activePage, limit: ROWS_PER_PAGE };
      if (appliedSearch) params.customer_name = appliedSearch;
      if (filterDate) params.date = filterDate;
      const resp = await axios.get(`${process.env.api_url}/daily_visits`, { params });
      setDailyVisits(resp.data.daily_visits);
      setTotalCount(resp.data.total_count);
      setTotalPages(resp.data.total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching daily visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user?._id, appliedSearch, filterDate]);

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
      setAppliedSearch('');
      setSearchCustomer('');
      setFilterDate('');
      setPage(0);
      getData(0);
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
    setShops((prev: any) => {
      const updated: any = [...prev];
      if (updated[index][field] === value) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const toggleEditShop = useCallback((index: number) => {
    setShops((prev: any) =>
      prev.map((shop: any, i: number) =>
        i === index ? { ...shop, editing: !shop.editing } : shop
      )
    );
  }, []);

  const deleteShop = useCallback((index: any) => {
    if (!window.confirm('Remove this shop from the visit?')) return;
    setShops((prev: any) => prev.filter((_: any, i: number) => i !== index));
  }, []);

  const moveShopUp = useCallback((index: any) => {
    if (index === 0) return;
    setShops((prev: any) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
      return updated;
    });
  }, []);

  const moveShopDown = useCallback((index: any) => {
    setShops((prev: any) => {
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
    // if (!selfie) {
    //   toast.error('Please upload a selfie');
    //   return;
    // }
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
      if (shop.potentialCustomer) {
        if (!shop?.potential_customer_name) {
          toast.error('Potential Customer Name Cannot be Empty');
          return;
        }
        if (!shop?.potential_customer_address) {
          toast.error('Potential Customer Address Cannot be Empty');
          return;
        }
        if (!shop?.potential_customer_tier) {
          toast.error('Potential Customer Tier Cannot be Empty');
          return;
        }
      }
      if (!shop.reason) {
        toast.error('Please enter a reason for each shop.');
        return;
      }
      if (!shop.potentialCustomer && !shop.address?.address_id) {
        toast.error('Please select an address for each shop.');
        return;
      }
    }
    const formData = new FormData();
    const formattedShops = shops.map((shop: any) => {
      let body: any = {
        address: shop.address,
        reason: shop.reason,
      };
      if (shop.potentialCustomer) {
        delete body['address'];
        body['potential_customer'] = shop.potentialCustomer;
        body['potential_customer_name'] = shop.potential_customer_name;
        body['potential_customer_address'] = shop.potential_customer_address;
        body['potential_customer_tier'] = shop.potential_customer_tier;
        body['potential_customer_mobile'] = shop.potential_customer_mobile;
        body['potential_customer_state_city'] = shop.potential_customer_state_city;
        body['potential_customer_customer_name'] = shop.potential_customer_customer_name;
        body['potential_customer_follow_up_date'] = shop.potential_customer_follow_up_date;
        body['potential_customer_comments'] = shop.potential_customer_comments;
        body['potential_customer_status'] = shop.potential_customer_status;
        if (shop.potential_customer_id) {
          body['potential_customer_id'] = shop.potential_customer_id;
        }
      } else {
        body['customer_id'] = shop.selectedCustomer._id;
        body['customer_name'] = shop.selectedCustomer.contact_name;
        body['order_expected'] = shop?.order_expected;
      }
      return body;
    });

    formData.append('shops', JSON.stringify(formattedShops));
    formData.append('created_by', user?._id);

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
      <Header title='Daily Visits' showBackButton useBack />
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

      {/* Filters */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <TextField
          label='Search Customer'
          variant='outlined'
          size='small'
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setAppliedSearch(searchCustomer);
              setPage(0);
            }
          }}
          sx={{ flex: 1 }}
          InputProps={{
            endAdornment: searchCustomer ? (
              <IconButton
                size='small'
                onClick={() => {
                  setSearchCustomer('');
                  setAppliedSearch('');
                  setPage(0);
                }}
              >
                ×
              </IconButton>
            ) : null,
          }}
        />
        <Button
          variant='outlined'
          size='small'
          onClick={() => {
            setAppliedSearch(searchCustomer);
            setPage(0);
          }}
          sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
        >
          Search
        </Button>
        <TextField
          label='Filter by Date'
          type='date'
          variant='outlined'
          size='small'
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        {(appliedSearch || filterDate) && (
          <Button
            variant='text'
            size='small'
            color='secondary'
            onClick={() => {
              setSearchCustomer('');
              setAppliedSearch('');
              setFilterDate('');
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* Daily Visits List */}
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
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dailyVisits.map((visit: any) => (
              <Card
                key={visit._id}
                onClick={() => router.push(`/daily_visits/${visit._id}`)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
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
                      {new Date(visit.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip size='small' label={`${visit.shops?.length || 0} shops`} color='primary' variant='outlined' />
                      {(visit.updates?.length || 0) > 0 && (
                        <Chip
                          size='small'
                          label={`${visit.updates.length} update${visit.updates.length > 1 ? 's' : ''}`}
                          color='success'
                          variant='outlined'
                        />
                      )}
                      {(() => {
                        const comments = visit.admin_comments || [];
                        if (comments.length === 0) return null;
                        const pendingReply = comments.some((c: any) => !c.reply);
                        return (
                          <Chip
                            size='small'
                            label={pendingReply ? `${comments.length} comment${comments.length > 1 ? 's' : ''} — reply needed` : `${comments.length} comment${comments.length > 1 ? 's' : ''}`}
                            color={pendingReply ? 'warning' : 'default'}
                            variant={pendingReply ? 'filled' : 'outlined'}
                          />
                        );
                      })()}
                    </Box>
                  }
                />
                {visit.selfie && (
                  <CardMedia component='img' image={visit.selfie} alt='Selfie' sx={{ height: 200, objectFit: 'cover' }} />
                )}
                <CardContent>
                  {visit.shops && visit.shops.length > 0 ? (
                    visit.shops.map((shop: any, idx: number) => (
                      <Box
                        key={idx}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          '&:last-child': { mb: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon color='primary' fontSize='small' sx={{ mr: 1 }} />
                          <Typography variant='body2' fontWeight='medium'>
                            {shop.customer_name || shop.potential_customer_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <PlaceIcon color='action' fontSize='small' sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.8rem' }}>
                            {shop?.potential_customer ? shop?.potential_customer_address : formatAddress(shop.address)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <DescriptionIcon color='action' fontSize='small' sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant='body2'>{shop.reason}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <ShoppingCartOutlined color='action' fontSize='small' sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant='body2'>
                            Order Expected Soon: {shop?.order_expected ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                      No Shops Available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          <Box
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent='space-between'
            mt={2}
            gap={1}
          >
            <TablePagination
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              component='div'
              count={totalCount}
              rowsPerPage={ROWS_PER_PAGE}
              page={page}
              onPageChange={(_e, newPage) => {
                setPage(newPage);
                setSkipPage('');
              }}
              onRowsPerPageChange={() => {}}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} of ${count} (Page ${page + 1} of ${totalPages})`
              }
            />
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2' color='text.secondary'>
                Jump to:
              </Typography>
              <TextField
                type='number'
                variant='outlined'
                size='small'
                sx={{ width: 72 }}
                value={skipPage !== '' ? skipPage : page + 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= totalPages) setSkipPage(e.target.value);
                  else toast.error('Invalid page number');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const requested = parseInt(skipPage, 10);
                    if (isNaN(requested) || requested < 1) { toast.error('Invalid page number'); return; }
                    setPage(requested - 1);
                    setSkipPage('');
                  }
                }}
                inputProps={{ min: 1, max: totalPages }}
              />
              <Button
                variant='contained'
                size='small'
                onClick={() => {
                  const requested = parseInt(skipPage, 10);
                  if (isNaN(requested) || requested < 1) { toast.error('Invalid page number'); return; }
                  setPage(requested - 1);
                  setSkipPage('');
                }}
              >
                Go
              </Button>
            </Box>
          </Box>
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
              {isMobile ? (
                /* On mobile: two buttons — one opens front camera, one opens gallery */
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Button variant='outlined' component='label' startIcon={<PersonIcon />}>
                    {selfie ? 'Retake Selfie' : 'Take Selfie'}
                    <input
                      hidden
                      accept='image/*'
                      capture='user'
                      type='file'
                      onChange={handleSelfieChange}
                    />
                  </Button>
                  <Button variant='outlined' component='label' startIcon={<AddIcon />}>
                    {selfie ? 'Change from Gallery' : 'Upload from Gallery'}
                    <input
                      hidden
                      accept='image/*'
                      type='file'
                      onChange={handleSelfieChange}
                    />
                  </Button>
                </Stack>
              ) : (
                /* On desktop: single upload button */
                <Button variant='outlined' component='label'>
                  {selfie ? 'Change Selfie' : 'Upload Selfie'}
                  <input
                    hidden
                    accept='image/*'
                    type='file'
                    onChange={handleSelfieChange}
                  />
                </Button>
              )}
              {selfiePreviewUrl && (
                <Box mt={2}>
                  <img
                    src={selfiePreviewUrl}
                    alt='Selfie Preview'
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
            {shops.map((shop: any, index: number) => (
              <ShopCard
                user={user}
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
