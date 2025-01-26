import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from 'react';
import axios from 'axios';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  Snackbar,
  Badge,
  Drawer,
  Divider,
} from '@mui/material';
import {
  AddShoppingCart,
  RemoveShoppingCart,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import debounce from 'lodash.debounce';

// ------------------ Interface Definitions ---------------------
interface SearchResult {
  id: number;
  name: string;
  brand: string;
  _id: { $oid: string } | string;
  cf_sku_code?: string;
  item_tax_preferences?: { tax_percentage: number }[];
  quantity?: number;
  rate: number;
  stock: number;
  image_url?: string;
  new?: boolean;
}

interface SearchBarProps {
  label: string;
  selectedProducts: SearchResult[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  customer: any; // Replace with appropriate type
  order: any;
  specialMargins: { [key: string]: string };
  totals: any;
  onCheckout: any;
}

// ------------------ Products Component -------------------------
const Products: React.FC<SearchBarProps> = ({
  label = 'Search',
  selectedProducts = [],
  setSelectedProducts,
  customer = {},
  order = {},
  specialMargins = {},
  totals = {},
  onCheckout,
}) => {
  const router = useRouter();
  const { id = '' } = router.query;

  // ------------------ State Variables ---------------------
  const [query, setQuery] = useState<string>(''); // Controlled input for Autocomplete
  const [temporaryQuantities, setTemporaryQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [popupImageSrc, setPopupImageSrc] = useState<string>('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { page: number; hasMore: boolean };
  }>({});
  const [productsByBrand, setProductsByBrand] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const PRODUCTS_PER_PAGE = 75; // Number of products per batch
  const [searchTerm, setSearchTerm] = useState<string>(''); // Current search term
  const [activeTab, setActiveTab] = useState<string>(''); // Currently active brand tab
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false); // State for Cart Drawer

  // ------------------ Ref for Selected Products ---------------------
  const selectedProductsRef = useRef<SearchResult[]>(selectedProducts);
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  // ------------------ Snackbar Handlers ---------------------
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback(
    (event?: React.SyntheticEvent, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setSnackbarOpen(false);
    },
    []
  );

  // ------------------ Calculate Selling Price ---------------------
  const getSellingPrice = useCallback(
    (product: SearchResult): number => {
      let margin = 0.4; // default 40%
      const productId =
        typeof product._id === 'string' ? product._id : product._id.$oid;

      if (specialMargins[productId]) {
        margin = parseInt(specialMargins[productId].replace('%', '')) / 100;
      } else {
        // fallback to customer's margin (e.g. "40%")
        margin = parseInt(customer?.cf_margin?.replace('%', '') || '40') / 100;
      }

      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [customer, specialMargins]
  );

  // ------------------ Fetch All Brands ---------------------
  const fetchAllBrands = useCallback(async () => {
    try {
      const base = process.env.api_url;
      const response = await axios.get(`${base}/products/brands`); // Endpoint that returns all available brands
      const allBrands: string[] = response.data.brands || []; // Ensure an array is returned

      // Initialize pagination state for all brands
      const initialPaginationState = allBrands.reduce(
        (acc: any, brand: string) => {
          acc[brand] = { page: 1, hasMore: true }; // Start from page 1
          return acc;
        },
        {}
      );

      setPaginationState(initialPaginationState);
      setProductsByBrand(
        allBrands.reduce(
          (acc: any, brand: string) => ({ ...acc, [brand]: [] }),
          {}
        )
      );

      // Set the first brand as the active tab
      if (allBrands.length > 0) {
        setActiveTab(allBrands[0]); // Set the first brand as default
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllBrands(); // Fetch brands when the component mounts
  }, [fetchAllBrands]);

  // ------------------ Fetch Products ---------------------
  const fetchProducts = useCallback(
    async (brand: string | undefined, page: number, search: string = '') => {
      setLoadingMore(true);
      try {
        const base = process.env.api_url;
        const params: any = {
          page,
          per_page: PRODUCTS_PER_PAGE,
        };

        if (brand && !search) {
          params.brand = brand;
        }

        if (search) {
          params.search = search;
        }

        const response = await axios.get(`${base}/products`, { params });

        const newProducts: SearchResult[] = response.data.products || [];
        const totalPages: number = response.data.total_pages || 1; // Adjust based on your API response

        if (search) {
          // When searching, set productsByBrand['search'] to search results
          setProductsByBrand((prev) => ({
            ...prev,
            ['search']:
              page === 1 ? newProducts : [...prev['search'], ...newProducts],
          }));
        } else if (brand) {
          // When not searching, append products to the active brand
          setProductsByBrand((prev) => ({
            ...prev,
            [brand]:
              page === 1 ? newProducts : [...prev[brand], ...newProducts],
          }));
        }

        setPaginationState((prev) => ({
          ...prev,
          [brand || 'search']: {
            page,
            hasMore: page < totalPages,
          },
        }));

        // **Removed Automatic Tab Switching to Prevent 'search' Tab**
        // Previously, during search, the active tab was being set to the first product's brand,
        // which might cause 'search' to be treated as a brand. This has been removed to prevent the 'search' tab from appearing.
      } catch (error: any) {
        console.error('Error fetching products:', error);
        // Handle specific error for invalid page number
        if (error.response && error.response.status === 400) {
          console.warn(
            `Invalid page number ${page} for brand ${brand}. Resetting to page 1.`
          );
          // Reset to page 1 and refetch
          setPaginationState((prev) => ({
            ...prev,
            [brand || 'search']: { page: 1, hasMore: true },
          }));
          fetchProducts(brand, 1, search);
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [PRODUCTS_PER_PAGE]
  );

  // ------------------ Debounced Fetch Products ---------------------
  const debouncedFetchProducts = useMemo(
    () => debounce(fetchProducts, 300),
    [fetchProducts]
  );

  // ------------------ Handle Search ---------------------
  const handleSearch = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.trim() === '') {
          // If search is cleared, reset to active tab's products
          if (activeTab) {
            setPaginationState((prev) => ({
              ...prev,
              [activeTab]: { page: 1, hasMore: true },
            }));
            await fetchProducts(activeTab, 1, '');
          }
          return;
        }

        // When searching, fetch all products matching the search term without brand
        setPaginationState((prev) => ({
          ...prev,
          ['search']: { page: 1, hasMore: true },
        }));

        await fetchProducts(undefined, 1, search);
      }, 500), // Debounce delay of 500ms
    [activeTab, fetchProducts]
  );

  // ------------------ Handle Input Change ---------------------
  const handleInputChange = (event: any, value: string) => {
    setQuery(value);
    setSearchTerm(value);
    handleSearch(value);
  };

  // ------------------ Handle Adding Products ---------------------
  const handleAddProducts = useCallback(
    (event: any, values: any) => {
      if (!values) return;

      if (typeof values === 'string') {
        // Handle freeSolo input if necessary
        // For example, you might want to add it as a new product or prompt the user
        showSnackbar(`You entered: ${values}. Please select a valid product.`);
        return;
      }

      const isAlreadySelected = selectedProducts.some(
        (product) => product._id === values._id
      );
      const quantity =
        temporaryQuantities[values._id as string] || values.quantity || 1;

      if (!isAlreadySelected) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const isShared = urlParams.has('shared');
        const updatedProducts = [
          ...selectedProductsRef.current,
          {
            ...values,
            product_id: values._id,
            margin: specialMargins[values._id]
              ? specialMargins[values._id]
              : customer.cf_margin || '40%',
            quantity,
            added_by: isShared ? 'customer' : 'sales_person',
          },
        ];

        setSelectedProducts(updatedProducts);
        selectedProductsRef.current = updatedProducts;
        showSnackbar(`Added ${values.name} (x${quantity}) to cart.`);

        // Clear temporary quantity
        setTemporaryQuantities((prev) => {
          const updated = { ...prev };
          delete updated[values._id as string];
          return updated;
        });
      } else {
        showSnackbar(`${values.name} is already in the cart.`);
      }

      // Remove from the autocomplete list
      setOptions((prevOptions) =>
        prevOptions.filter((option) => {
          if (typeof option === 'string') return true; // Keep string inputs
          return option._id !== values._id;
        })
      );
    },
    [selectedProducts, temporaryQuantities, showSnackbar, setSelectedProducts]
  );

  // ------------------ Handle Removing Products ---------------------
  const handleRemoveProduct = useCallback(
    (id: string) => {
      const removedProduct = selectedProductsRef.current.find(
        (product) => product._id === id
      );
      if (!removedProduct) return;

      // Filter out the removed product
      const updatedProducts = selectedProductsRef.current.filter(
        (product) => product._id !== id
      );

      setSelectedProducts(updatedProducts);
      selectedProductsRef.current = updatedProducts;

      // Put the removed product back into options
      setOptions((prevOptions) => [...prevOptions, removedProduct]);
      showSnackbar(`Removed ${removedProduct.name} from cart`);
    },
    [showSnackbar, setSelectedProducts]
  );

  // ------------------ Handle Quantity Change ---------------------
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      const updatedProducts = selectedProducts.map((product) => {
        if (product._id === id) {
          return {
            ...product,
            quantity: Math.max(1, Math.min(newQuantity, product.stock)),
          };
        }
        return product;
      });

      setSelectedProducts(updatedProducts);
      const updatedProduct = updatedProducts.find((p) => p._id === id);
      if (updatedProduct) {
        showSnackbar(
          `Updated ${updatedProduct.name} to quantity ${updatedProduct.quantity}`
        );
      }
    },
    [selectedProducts, setSelectedProducts, showSnackbar]
  );

  // ------------------ Handle Clear Cart ---------------------
  const handleClearCart = useCallback(async () => {
    try {
      const base = process.env.api_url;
      await axios.put(`${base}/orders/clear/${id}`);

      setSelectedProducts([]);
      setOptions([]);
      showSnackbar('Cart cleared successfully.');
    } catch (error) {
      console.error('Failed to clear the cart:', error);
      showSnackbar('Failed to clear the cart.');
    }
  }, [id, setSelectedProducts, showSnackbar]);

  // ------------------ Handle Image Popup ---------------------
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);

  // ------------------ Handle Scroll for Infinite Scrolling ---------------------
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500 && // Trigger near bottom
      !loadingMore &&
      ((searchTerm && paginationState['search']?.hasMore) ||
        (!searchTerm && activeTab && paginationState[activeTab]?.hasMore))
    ) {
      const nextPage = searchTerm
        ? (paginationState['search']?.page || 1) + 1
        : (paginationState[activeTab]?.page || 1) + 1;
      const brand = searchTerm ? undefined : activeTab;
      fetchProducts(brand, nextPage, searchTerm);
    }
  }, [activeTab, fetchProducts, loadingMore, paginationState, searchTerm]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ------------------ Reset Pagination on Tab Switch ---------------------
  useEffect(() => {
    if (activeTab && !searchTerm) {
      handleSearch.cancel(); // Cancel any pending search requests

      // Reset pagination state for the new active tab
      setPaginationState((prev) => ({
        ...prev,
        [activeTab]: { page: 1, hasMore: true },
      }));

      // Fetch the first page for the new active tab
      fetchProducts(activeTab, 1, '');
    }
  }, [activeTab, fetchProducts, searchTerm, handleSearch]);
  useEffect(() => {
    return () => {
      debouncedFetchProducts.cancel(); // Cancel debounced fetchProducts
      handleSearch.cancel(); // Cancel debounced handleSearch
    };
  }, [debouncedFetchProducts, handleSearch]);
  // ------------------ Render Component ---------------------
  if (!customer) {
    return <Typography>This is content for Products</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        width: '100%',
        padding: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Left Section: Products */}
      <Box sx={{ flex: 3 }}>
        {/* Header with Clear Cart Button */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5' sx={{ mb: 1, fontWeight: 'bold' }}>
            Add Products
          </Typography>
          <Button
            variant='outlined'
            color='secondary'
            onClick={handleClearCart}
            disabled={
              selectedProducts.length === 0 ||
              order?.status?.toLowerCase()?.includes('accepted') ||
              order?.status?.toLowerCase()?.includes('declined')
            }
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '24px',
            }}
          >
            Clear Cart
          </Button>
        </Box>

        {/* Search Bar */}
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={(option: any) =>
            typeof option === 'string'
              ? option
              : option?.name
              ? option.name
              : 'Unknown Product'
          }
          isOptionEqualToValue={(option: any, value: any) =>
            typeof option === 'string' && typeof value === 'string'
              ? option === value
              : option._id === value._id
          }
          onInputChange={handleInputChange}
          onChange={(event, value) => handleAddProducts(event, value)}
          value={query} // Controlled input
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant='outlined'
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color='inherit' size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Tabs for Brands */}
        {!searchTerm && (
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              mt: 2,
              '.MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                padding: '10px 20px',
              },
              '.Mui-selected': { color: 'primary.main' },
            }}
          >
            {Object.keys(productsByBrand)
              .filter((brand) => brand !== 'search') // Exclude 'search' from tabs
              .map((brand) => (
                <Tab key={brand} label={brand} value={brand} />
              ))}
          </Tabs>
        )}

        {/* Product Table */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 2,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflowX: 'auto',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Sub Category</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Margin</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(searchTerm
                ? productsByBrand['search']
                : productsByBrand[activeTab]
              )?.map((product: any) => {
                // Convert _id to a string if needed
                const productId =
                  typeof product._id === 'string'
                    ? product._id
                    : product._id.$oid;

                // Decide margin from specialMargins if any
                let marginPercent = specialMargins[productId]
                  ? parseInt(specialMargins[productId].replace('%', ''))
                  : parseInt((customer.cf_margin || '40%').replace('%', ''));

                if (isNaN(marginPercent)) {
                  marginPercent = 40; // fallback
                }

                const margin = marginPercent / 100;
                const selectedProduct = selectedProducts.find(
                  (p) => p._id === product._id
                );

                // Calculate selling price
                const sellingPrice = getSellingPrice(product);

                // If the product is in the cart, use its quantity; otherwise, use the temp or default
                const quantity =
                  selectedProduct?.quantity ||
                  temporaryQuantities[productId] ||
                  1;

                // Item-level total
                const itemTotal = parseFloat(
                  (sellingPrice * quantity).toFixed(2)
                );

                return (
                  <TableRow key={productId}>
                    <TableCell>
                      <Badge
                        badgeContent={product.new ? 'New' : undefined}
                        color='secondary'
                        overlap='rectangular'
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          loading='lazy'
                          style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleImageClick(
                              product.image_url || '/placeholder.png'
                            )
                          }
                        />
                      </Badge>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{product.sub_category || '-'}</TableCell>
                    <TableCell>{product.cf_sku_code || '-'}</TableCell>
                    <TableCell>₹{product.rate}</TableCell>
                    <TableCell>{product.stock}</TableCell>

                    {/* Margin (either from specialMargins or default) */}
                    <TableCell>
                      {specialMargins[productId]
                        ? specialMargins[productId]
                        : customer.cf_margin || '40%'}
                    </TableCell>

                    {/* Selling Price */}
                    <TableCell>₹{sellingPrice}</TableCell>

                    {/* Quantity input */}
                    <TableCell>
                      <TextField
                        type='number'
                        value={quantity}
                        disabled={
                          order?.status?.toLowerCase()?.includes('accepted') ||
                          order?.status?.toLowerCase()?.includes('declined')
                        }
                        onChange={(e) => {
                          const newQuantity = Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          );
                          if (selectedProduct) {
                            // If already in cart, update quantity
                            handleQuantityChange(productId, newQuantity);
                          } else {
                            // If not in cart, just store temp
                            setTemporaryQuantities((prev) => ({
                              ...prev,
                              [productId]: newQuantity,
                            }));
                            showSnackbar(
                              `Set quantity to ${newQuantity}. Add product to cart to confirm.`
                            );
                          }
                        }}
                        inputProps={{
                          min: 1,
                          max: product.stock,
                        }}
                        size='small'
                        sx={{ width: '80px' }}
                      />
                    </TableCell>

                    {/* Item total if in cart */}
                    <TableCell>
                      {selectedProduct ? `₹${itemTotal}` : '-'}
                    </TableCell>

                    {/* Add or Remove button */}
                    <TableCell>
                      <IconButton
                        color='primary'
                        disabled={
                          order?.status?.toLowerCase()?.includes('accepted') ||
                          order?.status?.toLowerCase()?.includes('declined')
                        }
                        onClick={() =>
                          selectedProducts.some(
                            (prod) => prod._id === product._id
                          )
                            ? handleRemoveProduct(productId)
                            : handleAddProducts(event, product)
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderRadius: '24px',
                        }}
                      >
                        {selectedProducts.some(
                          (prod) => prod._id === product._id
                        ) ? (
                          <RemoveShoppingCart />
                        ) : (
                          <AddShoppingCart />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Loading Indicator for More Products */}
              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={12} align='center'>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: 2,
                      }}
                    >
                      <CircularProgress color='primary' />
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        Loading more products...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Cart Icon */}
      <IconButton
        color='primary'
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: theme.spacing(4),
          right: theme.spacing(4),
          backgroundColor: 'background.paper',
          boxShadow: 3,
          '&:hover': {
            backgroundColor: 'background.default',
          },
          zIndex: 1000,
        }}
      >
        <ShoppingCartIcon fontSize='large' />
        {selectedProducts.length > 0 && (
          <Badge
            badgeContent={selectedProducts.length}
            color='secondary'
            sx={{ position: 'absolute', top: -4, right: -4 }}
          />
        )}
      </IconButton>

      {/* Cart Drawer */}
      <Drawer
        anchor='right'
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : 350,
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
          >
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
              Cart
            </Typography>
            <IconButton onClick={() => setCartDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {/* List of Selected Products */}
          <Box sx={{ flex: 1, overflowY: 'auto', mt: 2 }}>
            {selectedProducts.length === 0 ? (
              <Typography variant='body1'>Your cart is empty.</Typography>
            ) : (
              selectedProducts.map((product: any) => {
                const productId =
                  typeof product._id === 'string'
                    ? product._id
                    : product._id.$oid;
                const sellingPrice = getSellingPrice(product);
                const itemTotal = parseFloat(
                  (sellingPrice * product?.quantity).toFixed(2)
                );

                return (
                  <Box
                    key={productId}
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    mb={2}
                  >
                    <Box>
                      <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                        {product.name}
                      </Typography>
                      <Typography variant='body2'>
                        Quantity: {product.quantity}
                      </Typography>
                      <Typography variant='body2'>
                        Price: ₹{sellingPrice}
                      </Typography>
                    </Box>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='flex-end'
                    >
                      <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                        ₹{itemTotal}
                      </Typography>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleRemoveProduct(productId)}
                      >
                        <RemoveShoppingCart />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          <Divider />

          {/* Cart Totals */}
          <Box sx={{ mt: 2 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
              Total GST ({customer?.cf_in_ex || 'Exclusive'}): ₹
              {totals.totalGST.toFixed(2)}
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mt: 1 }}>
              Total Amount: ₹{totals.totalAmount.toFixed(2)}
            </Typography>
            {/* You can add buttons like 'Checkout' or 'Finalize Order' here */}
            <Button
              variant='contained'
              color='primary'
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => {
                // Implement checkout or finalize order logic here
                setCartDrawerOpen(false);
                onCheckout();
                // For example, navigate to review step or perform an action
                // router.push('/checkout'); // Example
              }}
              disabled={
                selectedProducts.length === 0 ||
                order?.status?.toLowerCase()?.includes('accepted') ||
                order?.status?.toLowerCase()?.includes('declined')
              }
            >
              Checkout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Image Popup Dialog */}
      <Dialog
        open={openImagePopup}
        onClose={handleClosePopup}
        sx={{ zIndex: 1300 }}
      >
        <DialogContent
          sx={{
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <IconButton
            onClick={handleClosePopup}
            sx={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              color: 'white',
              zIndex: 1400,
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={popupImageSrc}
            alt='Full screen'
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        onClose={(e: any, r: any) => handleSnackbarClose(e, r)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        action={
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />
    </Box>
  );
};

export default memo(Products);
