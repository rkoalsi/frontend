import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
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
  debounce,
} from '@mui/material';
import {
  AddShoppingCart,
  RemoveShoppingCart,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

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
  updateOrder: (order: any) => void;
  customer: any; // Replace with appropriate type
  totals: any;
  order: any;
}

// ------------------ Products Component -------------------------
const Products: React.FC<SearchBarProps> = ({
  label = 'Search',
  selectedProducts = [],
  setSelectedProducts,
  updateOrder,
  customer = {},
  totals = {},
  order = {},
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

  // ------------------ Ref for Selected Products ---------------------
  const selectedProductsRef = useRef<SearchResult[]>(selectedProducts);
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  // ------------------ Snackbar Handlers ---------------------
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // ------------------ Special Margins State ---------------------
  /**
   * Stores special margins for products.
   * Example:
   * {
   *   "abc123": "45%",   // product_id => margin string
   *   "xyz789": "50%"
   * }
   */
  const [specialMargins, setSpecialMargins] = useState<{
    [key: string]: string;
  }>({});

  // ------------------ Fetch Special Margins ---------------------
  useEffect(() => {
    if (!customer?._id) return; // Wait until customer is known

    const fetchSpecialMargins = async () => {
      try {
        const base = process.env.api_url;
        const res = await axios.get(
          `${base}/admin/customer/special_margins/${customer._id}`
        );
        // Expected response: { products: [ { product_id: 'abc123', margin: '45%' }, ... ] }
        const productList = res.data.products || [];

        // Transform the array into a dictionary for easy lookup
        const marginMap: { [key: string]: string } = {};
        productList.forEach((item: any) => {
          marginMap[item.product_id] = item.margin;
        });

        setSpecialMargins(marginMap);
      } catch (error) {
        console.error('Error fetching special margins:', error);
      }
    };

    fetchSpecialMargins();
  }, [customer]);

  // ------------------ Calculate Local Totals ---------------------
  const calculateLocalTotals = (products: SearchResult[]) => {
    const totals = products.reduce(
      (acc: { totalGST: number; totalAmount: number }, product) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity?.toString() || '1') || 1;

        // 1) Check if there's a special margin for this product
        let margin = 0.4; // default 40%
        const productId =
          typeof product._id === 'string' ? product._id : product._id.$oid;

        if (specialMargins[productId]) {
          margin = parseInt(specialMargins[productId].replace('%', '')) / 100;
        } else {
          // fallback to customer's margin (e.g. "40%")
          margin =
            parseInt(customer?.cf_margin?.replace('%', '') || '40') / 100;
        }

        // 2) Calculate Selling Price based on margin
        const sellingPrice = rate - rate * margin;

        let gstAmount = 0;
        let totalAmount = 0;

        if (customer?.cf_in_ex === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          totalAmount = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          totalAmount =
            (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }

        // Accumulate without rounding
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );

    // Apply rounding once at the end
    const roundedTotalGST = Math.round(totals.totalGST * 100) / 100; // Round to 2 decimals
    const roundedTotalAmount =
      totals.totalAmount % 1 >= 0.5
        ? Math.ceil(totals.totalAmount) // Round up if decimal >= 0.5
        : Math.floor(totals.totalAmount); // Round down otherwise

    return { totalGST: roundedTotalGST, totalAmount: roundedTotalAmount };
  };

  // ------------------ Fetch All Brands ---------------------
  const fetchAllBrands = async () => {
    try {
      const base = process.env.api_url;
      const response = await axios.get(`${base}/products/brands`); // Endpoint that returns all available brands
      const allBrands = response.data.brands || []; // Ensure an array is returned

      // Initialize pagination state for all brands
      const initialPaginationState = allBrands.reduce(
        (acc: any, brand: string) => {
          acc[brand] = { page: 0, hasMore: true }; // Default pagination state
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
  };

  useEffect(() => {
    fetchAllBrands(); // Fetch brands when the component mounts
  }, []);

  // ------------------ Fetch Products ---------------------
  const fetchProducts = async (
    brand: string | undefined,
    page: number,
    search: string = ''
  ) => {
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

      const newProducts = response.data.products || [];
      const totalPages = response.data.total_pages || 1; // Adjust based on your API response

      console.log('Fetched Products:', newProducts); // Debugging

      if (search) {
        // When searching, set options to search results
        setOptions(newProducts);
      } else if (brand) {
        // When not searching, set options to products of the active brand
        setOptions(newProducts);
      }

      setProductsByBrand((prev) => ({
        ...prev,
        // Use a unique key for search results
        [brand || 'search']:
          page === 1
            ? newProducts
            : [...(prev[brand || 'search'] || []), ...newProducts], // Append if not first page
      }));

      setPaginationState((prev) => ({
        ...prev,
        [brand || 'search']: {
          page,
          hasMore: page < totalPages,
        },
      }));

      // Automatic Tab Switching: If on first page and search is active, switch to the brand of the first product
      if (page === 1 && search && newProducts.length > 0) {
        const firstProduct = newProducts[0];
        if (firstProduct.brand && firstProduct.brand !== brand) {
          setActiveTab(firstProduct.brand);
        }
      }
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
  };

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
    [activeTab]
  );

  // ------------------ Handle Input Change ---------------------
  const handleInputChange = (event: any, value: string) => {
    setQuery(value);
    setSearchTerm(value);
    handleSearch(value);
  };

  // ------------------ Handle Adding Products ---------------------
  const handleAddProducts = (
    event: any,
    values: SearchResult | string | null
  ) => {
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
          quantity,
          added_by: isShared ? 'customer' : 'sales_person',
        },
      ];

      setSelectedProducts(updatedProducts);
      selectedProductsRef.current = updatedProducts;
      const newTotals = calculateLocalTotals(updatedProducts);

      updateOrder({
        products: updatedProducts,
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });
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
  };

  // ------------------ Handle Removing Products ---------------------
  const handleRemoveProduct = (id: string) => {
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
    const newTotals = calculateLocalTotals(updatedProducts);

    updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
    });

    // Put the removed product back into options
    setOptions((prevOptions) => [...prevOptions, removedProduct]);
    showSnackbar(`Removed ${removedProduct.name} from cart`);
  };

  // ------------------ Handle Quantity Change ---------------------
  const handleQuantityChange = (id: string, newQuantity: number) => {
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
    const newTotals = calculateLocalTotals(updatedProducts);

    updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
    });

    const updatedProduct = updatedProducts.find((p) => p._id === id);
    if (updatedProduct) {
      showSnackbar(
        `Updated ${updatedProduct.name} to quantity ${updatedProduct.quantity}`
      );
    }
  };

  // ------------------ Handle Clear Cart ---------------------
  const handleClearCart = async () => {
    try {
      const base = process.env.api_url;
      await axios.put(`${base}/orders/clear/${id}`);

      setSelectedProducts([]);
      const newTotals = calculateLocalTotals([]);
      updateOrder({
        products: [],
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });
      setOptions([]);
      showSnackbar('Cart cleared successfully.');
    } catch (error) {
      console.error('Failed to clear the cart:', error);
      showSnackbar('Failed to clear the cart.');
    }
  };

  // ------------------ Handle Image Popup ---------------------
  const handleImageClick = (src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  };
  const handleClosePopup = () => {
    setOpenImagePopup(false);
  };

  // ------------------ Handle Scroll for Infinite Scrolling ---------------------
  const handleScroll = () => {
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
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [paginationState, activeTab, loadingMore, searchTerm]);

  // ------------------ Reset Pagination on Tab Switch ---------------------
  useEffect(() => {
    if (activeTab && !searchTerm) {
      // Reset pagination state for the new active tab
      setPaginationState((prev) => ({
        ...prev,
        [activeTab]: { page: 1, hasMore: true },
      }));

      // Fetch the first page for the new active tab
      fetchProducts(activeTab, 1, '');
    }
  }, [activeTab, searchTerm]);

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
              order?.status?.toLowerCase().includes('accepted') ||
              order?.status?.toLowerCase().includes('declined')
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
              : option?._id?.$oid === value?._id?.$oid
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
            {Object.keys(productsByBrand).map((brand) => (
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
              )?.map((product: SearchResult) => {
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
                const sellingPrice = parseFloat(
                  (product.rate - product.rate * margin).toFixed(2)
                );

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
                  <TableCell colSpan={10} align='center'>
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

      {/* Right Section: Cart Totals */}
      <Box>
        <Box
          sx={{
            position: 'fixed',
            top: '70px', // Adjust as needed
            right: '8px',
            padding: 2,
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            maxWidth: '300px',
          }}
        >
          <Typography
            variant='h6'
            sx={{
              mb: 2,
              fontWeight: 'bold',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '8px',
            }}
          >
            Total
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              fontSize: '16px',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 500 }}>
                Total GST ({customer?.cf_in_ex || 'Exclusive'}):
              </Typography>
              <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ₹{calculateLocalTotals(selectedProducts).totalGST.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 500 }}>Total Amount:</Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: 'secondary.main',
                }}
              >
                ₹{calculateLocalTotals(selectedProducts).totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

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
