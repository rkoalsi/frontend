import { useState, useEffect, useRef, useMemo, memo } from 'react';
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
  Badge,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/router';
import {
  AddShoppingCart,
  Close,
  RemoveShoppingCart,
} from '@mui/icons-material';
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
  setSelectedProducts: any;
  updateOrder: any;
  customer: any; // Key to determine GST type
  totals: any;
  order: any;
}

const Products: React.FC<SearchBarProps> = ({
  label = 'Search',
  selectedProducts = [],
  setSelectedProducts = () => {},
  updateOrder = () => {},
  customer = {},
  totals = {},
  order = {},
}) => {
  const [query, setQuery] = useState('');
  const [temporaryQuantities, setTemporaryQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { page: number; hasMore: boolean };
  }>({});
  const [productsByBrand, setProductsByBrand] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [loadingMore, setLoadingMore] = useState(false); // Loading indicator for more products
  const PRODUCTS_PER_PAGE = 75; // Number of products per batch

  const { id = '' } = useRouter().query;

  // ------------------ NEW: specialMargins State ---------------------
  /**
   * Will store data like:
   * {
   *   "abc123": "45%",   // product_id => margin string
   *   "xyz789": "50%"
   * }
   */
  const [specialMargins, setSpecialMargins] = useState<{
    [key: string]: string;
  }>({});

  // ------------------ FETCH SPECIAL MARGINS -------------------------
  /**
   * Once we know the customer's _id, fetch the special margins from your API.
   */
  useEffect(() => {
    if (!customer?._id) return; // Wait until customer is known

    const fetchSpecialMargins = async () => {
      try {
        const base = process.env.api_url;
        const res = await axios.get(
          `${base}/admin/customer/special_margins/${customer._id}`
        );
        // Suppose it returns: { products: [ { product_id: 'abc123', margin: '45%' }, ... ] }
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

  // ------------------ Helper: Local Totals Calculation --------------
  const calculateLocalTotals = (products: any) => {
    const totals = products.reduce(
      (acc: any, product: any) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity.toString()) || 1;

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

  const [products, setProducts] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = (
    event?: React.SyntheticEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return; // Don't close on clickaway
    }
    setSnackbarOpen(false);
  };
  const fetchAllBrands = async () => {
    try {
      const base = process.env.api_url;
      const response = await axios.get(`${base}/products/brands`); // Endpoint that returns all available brands
      const allBrands = response.data.brands || []; // Ensure an array is returned

      // Initialize pagination state for all brands
      const initialPaginationState = allBrands.reduce(
        (acc: any, brand: any) => {
          acc[brand] = { page: 0, hasMore: true }; // Default pagination state
          return acc;
        },
        {}
      );

      setPaginationState(initialPaginationState);
      setProductsByBrand(
        allBrands.reduce(
          (acc: any, brand: any) => ({ ...acc, [brand]: [] }),
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

  const fetchProducts = async (brand: string, page: number) => {
    setLoadingMore(true);
    try {
      const base = process.env.api_url;
      const response = await axios.get(`${base}/products`, {
        params: {
          page,
          per_page: PRODUCTS_PER_PAGE,
          brand,
        },
      });

      const newProducts = response.data.products || [];

      setProductsByBrand((prev) => ({
        ...prev,
        [brand]:
          page === 1 ? newProducts : [...(prev[brand] || []), ...newProducts], // Reset data if fetching the first page
      }));

      setPaginationState((prev) => ({
        ...prev,
        [brand]: {
          page,
          hasMore: newProducts.length === PRODUCTS_PER_PAGE,
        },
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!activeTab) return; // No active tab to fetch data for

    const brandPagination = paginationState[activeTab];
    if (!brandPagination || brandPagination.page === 0) {
      // Fetch the first page of products for the active tab
      fetchProducts(activeTab, 1);
    }
  }, [activeTab, paginationState]);
  useEffect(() => {
    if (!activeTab && Object.keys(productsByBrand).length > 0) {
      setActiveTab(Object.keys(productsByBrand)[0]); // Default to the first brand
    }
  }, [productsByBrand]);
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500 && // Trigger near bottom
      !loadingMore &&
      activeTab &&
      paginationState[activeTab]?.hasMore
    ) {
      const nextPage = (paginationState[activeTab]?.page || 1) + 1;
      fetchProducts(activeTab, nextPage); // Fetch the next page for the active tab
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [paginationState, activeTab, loadingMore]);
  /**
   * Fetch products from your main /products endpoint
   */
  const handleSearch = async (page = 1) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/products`, {
        params: {
          page,
          per_page: PRODUCTS_PER_PAGE, // Adjust backend to handle pagination
        },
      });

      const newProducts = response.data.products || [];
      const total = response.data.total || 0;

      setProducts((prevProducts) =>
        page === 1 ? newProducts : [...prevProducts, ...newProducts]
      );
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Only fetch products once (or whenever you want to refresh)
  useEffect(() => {
    if (!customer || options.length > 0) return; // Prevent redundant fetch
    handleSearch();
  }, [customer?._id, options.length]);

  const selectedProductsRef = useRef(selectedProducts);
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  // ------------------ Adding/Removing Products -----------------------
  const handleAddProducts = (event: any, values: any | null) => {
    if (!values) return;
    const isAlreadySelected = selectedProducts.some(
      (product: any) => product._id === values._id
    );
    const quantity = temporaryQuantities[values._id] || values.quantity || 1;
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
        delete updated[values._id];
        return updated;
      });
    } else {
      showSnackbar(`${values.name} is already in the cart.`);
    }

    // Remove from the autocomplete list
    setOptions((prevOptions) =>
      prevOptions.filter((option) => option._id !== values._id)
    );
  };

  const handleRemoveProduct = (id: any) => {
    const removedProduct = selectedProductsRef.current.find(
      (product: any) => product._id === id
    );
    if (!removedProduct) return;

    // Filter out the removed product
    const updatedProducts = selectedProductsRef.current.filter(
      (product: any) => product._id !== id
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

  // ------------------ Quantity Changes ------------------------------
  const handleQuantityChange = (id: string, newQuantity: number) => {
    const updatedProducts = selectedProducts.map((product: any) => {
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

  // ------------------ Clear Cart (Backend + Frontend) ---------------
  const handleClearCart = async () => {
    try {
      const base = `${process.env.api_url}`;
      await axios.put(`${base}/orders/clear/${id}`);

      setSelectedProducts([]);
      const newTotals = calculateLocalTotals([]);

      updateOrder({
        products: [],
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });
      setOptions([]);
      console.log('✅ Cart cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear the cart:', error);
    }
  };

  // ------------------ Image Popup -----------------------------------
  const handleImageClick = (src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  };
  const handleClosePopup = () => {
    setOpenImagePopup(false);
  };

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
          options={options}
          getOptionLabel={(option: any) => option?.name || 'Unknown Name'}
          isOptionEqualToValue={(option: any, value: any) =>
            option?._id?.$oid === value?._id?.$oid
          }
          onInputChange={(event, value) => {
            setQuery(value);
            handleSearch();
          }}
          onChange={(event, value) => handleAddProducts(event, value)}
          value={null}
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

        {/* Tabs for brand */}
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
              {(productsByBrand[activeTab] || []).map((product: any) => {
                // Convert _id to a string if needed
                const productId =
                  typeof product._id === 'string'
                    ? product._id
                    : product._id?.$oid;

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
                      <Box
                        sx={{ position: 'relative', display: 'inline-block' }}
                      >
                        {product.new && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              backgroundColor: 'primary.main',
                              color: 'white',
                              padding: '4px 8px',
                              borderTopLeftRadius: '4px',
                              borderBottomRightRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              zIndex: 1,
                            }}
                          >
                            New
                          </Box>
                        )}
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
                      </Box>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.cf_sku_code}</TableCell>
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
                            (prod: any) => prod._id === product._id
                          )
                            ? handleRemoveProduct(productId)
                            : handleAddProducts(null, product)
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderRadius: '24px',
                        }}
                      >
                        {selectedProducts.some(
                          (prod: any) => prod._id === product._id
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
            <Close />
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
      {/* Snackbar */}
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
            <Close fontSize='small' />
          </IconButton>
        }
      />
    </Box>
  );
};

export default memo(Products);
