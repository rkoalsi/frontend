import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
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
import { toast } from 'react-toastify';

// ------------------ Interface Definitions ---------------------
interface SearchResult {
  id: number;
  name: string;
  brand: string;
  _id: string;
  cf_sku_code?: string;
  item_tax_preferences?: { tax_percentage: number }[];
  quantity?: number;
  rate: number;
  stock: number;
  image_url?: string;
  new?: boolean;
  sub_category?: string;
  category?: string;
  series?: string;
}

interface SearchBarProps {
  label: string;
  selectedProducts: SearchResult[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  customer: {
    cf_margin?: string;
    cf_in_ex?: string;
    // Add other customer properties as needed
  };
  order: {
    status?: string;
    // Add other order properties as needed
  };
  specialMargins: { [key: string]: string };
  totals: any;
  onCheckout: () => void;
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
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const PRODUCTS_PER_PAGE = 75; // Number of products per batch
  const [searchTerm, setSearchTerm] = useState<string>(''); // Current search term
  const [activeBrand, setActiveBrand] = useState<string>(''); // Currently active brand tab
  const [activeCategory, setActiveCategory] = useState<string>(''); // Currently active category tab
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({}); // Mapping of brands to their categories
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false); // State for Cart Drawer
  const [noMoreProducts, setNoMoreProducts] = useState<{
    [key: string]: boolean;
  }>({}); // State to indicate no more products per key

  // ------------------ Refs for Caching and Avoiding Duplicate Fetches ---------------------
  const productCache = useRef<{
    [key: string]: {
      [page: number]: SearchResult[];
    };
  }>({});

  const isFetching = useRef<{
    [key: string]: boolean;
  }>({});

  // ------------------ Debounced Toast Functions ---------------------
  const debouncedSuccess = useCallback(
    debounce((msg: string) => toast.success(msg), 1000),
    []
  );

  const debouncedWarn = useCallback(
    debounce((msg: string) => toast.warn(msg), 1000),
    []
  );

  const debouncedInfo = useCallback(
    debounce((msg: string) => toast.info(msg), 1000),
    []
  );

  const debouncedError = useCallback(
    debounce((msg: string) => toast.error(msg), 1000),
    []
  );

  // ------------------ Cleanup Debounced Toasts on Unmount ---------------------
  useEffect(() => {
    return () => {
      debouncedSuccess.cancel();
      debouncedWarn.cancel();
      debouncedInfo.cancel();
      debouncedError.cancel();
    };
  }, [debouncedSuccess, debouncedWarn, debouncedInfo, debouncedError]);

  // ------------------ Calculate Selling Price ---------------------
  const getSellingPrice = useCallback(
    (product: SearchResult): number => {
      let marginPercent = 40; // default 40%
      if (specialMargins[product._id]) {
        marginPercent = parseInt(specialMargins[product._id].replace('%', ''));
      } else if (customer.cf_margin) {
        marginPercent = parseInt(customer.cf_margin.replace('%', ''));
      }

      if (isNaN(marginPercent)) {
        marginPercent = 40; // fallback
      }

      const margin = marginPercent / 100;
      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [customer.cf_margin, specialMargins]
  );

  // ------------------ Fetch All Brands ---------------------
  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      const base = process.env.api_url;
      const response = await axios.get(`${base}/products/brands`); // Endpoint that returns all available brands
      const allBrands: string[] = response.data.brands || []; // Ensure an array is returned

      if (allBrands.length > 0) {
        setActiveBrand(allBrands[0]); // Set the first brand as default
      }

      // Initialize pagination state for all brands
      const initialPaginationState: {
        [key: string]: { page: number; hasMore: boolean };
      } = allBrands.reduce((acc, brand) => {
        acc[brand] = { page: 1, hasMore: true };
        return acc;
      }, {} as { [key: string]: { page: number; hasMore: boolean } });

      setPaginationState(initialPaginationState);

      // Initialize productsByBrandCategory with empty arrays
      const initialProducts: { [key: string]: SearchResult[] } =
        allBrands.reduce((acc, brand) => {
          acc[brand] = [];
          return acc;
        }, {} as { [key: string]: SearchResult[] });

      setProductsByBrandCategory(initialProducts);
    } catch (error) {
      console.error('Error fetching brands:', error);
      debouncedError('Failed to fetch brands.');
    } finally {
      setLoading(false);
    }
  }, [debouncedError]);

  useEffect(() => {
    fetchAllBrands(); // Fetch brands when the component mounts
  }, [fetchAllBrands]);

  // ------------------ Fetch Categories for a Brand ---------------------
  const fetchCategories = useCallback(
    async (brand: string) => {
      try {
        const base = process.env.api_url;
        const response = await axios.get(`${base}/products/categories`, {
          params: { brand },
        }); // Endpoint to fetch categories based on brand
        const categories: string[] = response.data.categories || [];

        setCategoriesByBrand((prev) => ({
          ...prev,
          [brand]: categories.sort((a, b) => a.localeCompare(b)), // Sort categories alphabetically
        }));

        // Set the first category as active if available
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        } else {
          setActiveCategory('');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        debouncedError('Failed to fetch categories.');
      }
    },
    [debouncedError]
  );

  // Fetch categories when activeBrand changes
  useEffect(() => {
    if (activeBrand) {
      fetchCategories(activeBrand);
    }
  }, [activeBrand, fetchCategories]);

  // ------------------ Fetch Products ---------------------
  const fetchProducts = useCallback(
    async (
      key: string,
      brand: string | undefined,
      category: string | undefined,
      search: string | undefined,
      page: number
    ) => {
      // Prevent duplicate fetches
      if (isFetching.current[key]) return;
      isFetching.current[key] = true;

      try {
        // Check cache first
        if (productCache.current[key] && productCache.current[key][page]) {
          setProductsByBrandCategory((prev) => ({
            ...prev,
            [key]:
              page === 1
                ? productCache.current[key][page]
                : [...prev[key], ...productCache.current[key][page]],
          }));
          setPaginationState((prev) => ({
            ...prev,
            [key]: {
              page,
              hasMore: page < 100, // Assuming 100 pages max
            },
          }));
          setNoMoreProducts((prev) => ({
            ...prev,
            [key]: page >= 100,
          }));
          return;
        }

        const base = process.env.api_url;
        const params: any = {
          page,
          per_page: PRODUCTS_PER_PAGE,
        };

        if (brand && category && !search) {
          params.brand = brand;
          params.category = category;
        }

        if (search) {
          params.search = search;
        }

        const response = await axios.get(`${base}/products`, { params });

        const newProducts: SearchResult[] = response.data.products || [];
        const totalPages: number = response.data.total_pages || 1; // Adjust based on your API response

        // No frontend sorting; rely on API ordering

        // Update cache
        if (!productCache.current[key]) {
          productCache.current[key] = {};
        }
        productCache.current[key][page] = newProducts;

        setProductsByBrandCategory((prev) => ({
          ...prev,
          [key]: page === 1 ? newProducts : [...prev[key], ...newProducts],
        }));

        setPaginationState((prev) => ({
          ...prev,
          [key]: {
            page,
            hasMore: page < totalPages,
          },
        }));

        setNoMoreProducts((prev) => ({
          ...prev,
          [key]: page >= totalPages,
        }));

        // **Update options if it's a search operation**
        if (key === 'search') {
          setOptions(newProducts);
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        debouncedError('Failed to fetch products.');
      } finally {
        isFetching.current[key] = false;
        setLoadingMore(false);
      }
    },
    [PRODUCTS_PER_PAGE, debouncedError]
  );

  // ------------------ Handle Search ---------------------
  const handleSearch = useCallback(
    debounce(async (search: string) => {
      setSearchTerm(search);
      const key =
        search.trim() !== '' ? 'search' : `${activeBrand}-${activeCategory}`;

      // Reset pagination and products if search term changes
      if (search.trim() !== '') {
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({
          ...prev,
          [key]: [],
        }));
        setNoMoreProducts((prev) => ({
          ...prev,
          [key]: false,
        }));
        await fetchProducts(key, undefined, undefined, search, 1);
      } else {
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({
          ...prev,
          [key]: [],
        }));
        setNoMoreProducts((prev) => ({
          ...prev,
          [key]: false,
        }));
        await fetchProducts(key, activeBrand, activeCategory, undefined, 1);

        // **Reset options to all products when search is cleared**
        setOptions(productsByBrandCategory[key] || []);
      }
    }, 500),
    [activeBrand, activeCategory, fetchProducts, productsByBrandCategory]
  );

  // ------------------ Handle Input Change ---------------------
  const handleInputChange = useCallback(
    (event: any, value: string) => {
      setQuery(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  // ------------------ Handle Adding Products ---------------------
  const handleAddProducts = useCallback(
    (values: any) => {
      if (!values) return;

      const isAlreadySelected = selectedProducts.some(
        (product) => product._id === values._id
      );
      const productIdStr = values._id;
      const quantity =
        temporaryQuantities[productIdStr] || values.quantity || 1;

      if (!isAlreadySelected) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const isShared = urlParams.has('shared');

        const updatedProducts: SearchResult[] = [
          ...selectedProducts,
          {
            ...values,
            margin: specialMargins[productIdStr]
              ? specialMargins[productIdStr]
              : customer.cf_margin || '40%',
            quantity,
            added_by: isShared ? 'customer' : 'sales_person',
          },
        ];

        setSelectedProducts(updatedProducts);
        debouncedSuccess(`Added ${values.name} (x${quantity}) to cart.`);

        // Clear temporary quantity
        setTemporaryQuantities((prev) => {
          const updated = { ...prev };
          delete updated[productIdStr];
          return updated;
        });
      } else {
        debouncedWarn(`${values.name} is already in the cart.`);
      }

      // Remove from the autocomplete list
      setOptions((prevOptions) =>
        prevOptions.filter((option) => option._id !== values._id)
      );
    },
    [
      selectedProducts,
      temporaryQuantities,
      specialMargins,
      customer.cf_margin,
      debouncedSuccess,
      debouncedWarn,
      setSelectedProducts,
    ]
  );

  // ------------------ Handle Removing Products ---------------------
  const handleRemoveProduct = useCallback(
    (id: string) => {
      const removedProduct = selectedProducts.find(
        (product) => product._id === id
      );
      if (!removedProduct) return;

      // Filter out the removed product
      const updatedProducts = selectedProducts.filter(
        (product) => product._id !== id
      );

      setSelectedProducts(updatedProducts);

      // Put the removed product back into options
      setOptions((prevOptions) => [...prevOptions, removedProduct]);
      debouncedSuccess(`Removed ${removedProduct.name} from cart`);
    },
    [selectedProducts, debouncedSuccess, setSelectedProducts]
  );

  // ------------------ Handle Quantity Change ---------------------
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      const productInCart = selectedProducts.find(
        (product) => product._id === id
      );
      if (!productInCart) return;

      const sanitizedQuantity = Math.max(
        1,
        Math.min(newQuantity, productInCart.stock)
      );

      const updatedProducts = selectedProducts.map((product) => {
        if (product._id === id) {
          return {
            ...product,
            quantity: sanitizedQuantity,
          };
        }
        return product;
      });

      setSelectedProducts(updatedProducts);
      const updatedProduct = updatedProducts.find((p) => p._id === id);
      if (updatedProduct) {
        debouncedSuccess(
          `Updated ${updatedProduct.name} to quantity ${updatedProduct.quantity}`
        );
      }
    },
    [selectedProducts, setSelectedProducts, debouncedSuccess]
  );

  // ------------------ Handle Clear Cart ---------------------
  const handleClearCart = useCallback(async () => {
    try {
      const base = process.env.api_url;
      await axios.put(`${base}/orders/clear/${id}`);

      setSelectedProducts([]);
      setOptions([]);
      debouncedSuccess('Cart cleared successfully.');
    } catch (error) {
      console.error('Failed to clear the cart:', error);
      debouncedError('Failed to clear the cart.');
    }
  }, [id, setSelectedProducts, debouncedSuccess, debouncedError]);

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
    const key =
      searchTerm.trim() !== '' ? 'search' : `${activeBrand}-${activeCategory}`;

    if (
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500 && // Trigger near bottom
      !loadingMore &&
      !noMoreProducts[key] &&
      paginationState[key]?.hasMore
    ) {
      const nextPage = paginationState[key]?.page + 1 || 2;
      const brand = searchTerm.trim() !== '' ? undefined : activeBrand;
      const category = searchTerm.trim() !== '' ? undefined : activeCategory;
      const search = searchTerm.trim() !== '' ? searchTerm : undefined;

      setLoadingMore(true);
      fetchProducts(key, brand, category, search, nextPage);
    }
  }, [
    activeBrand,
    activeCategory,
    fetchProducts,
    loadingMore,
    noMoreProducts,
    paginationState,
    searchTerm,
  ]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ------------------ Reset Pagination on Brand or Category Tab Switch ---------------------
  // ------------------ Reset Pagination on Brand or Category Tab Switch ---------------------
  useEffect(() => {
    if (activeBrand && activeCategory && searchTerm.trim() === '') {
      const key = `${activeBrand}-${activeCategory}`;

      // Reset pagination state for the new brand-category
      setPaginationState((prev) => ({
        ...prev,
        [key]: { page: 1, hasMore: true },
      }));

      // Reset productsByBrandCategory for the brand-category
      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: [],
      }));

      // Reset 'No more products' state for the key
      setNoMoreProducts((prev) => ({
        ...prev,
        [key]: false,
      }));

      // Fetch the first page for the new brand-category
      fetchProducts(key, activeBrand, activeCategory, undefined, 1);
    }
  }, [activeBrand, activeCategory, fetchProducts, searchTerm]);

  // ------------------ Render Component ---------------------
  if (!customer) {
    return <Typography>This is content for Products</Typography>;
  }

  // Extract categories for the active brand
  const categories = categoriesByBrand[activeBrand] || [];

  // Determine the key for productsByBrandCategory
  const productsKey =
    searchTerm.trim() !== ''
      ? 'search'
      : activeBrand && activeCategory
      ? `${activeBrand}-${activeCategory}`
      : 'all';

  const displayedProducts = productsByBrandCategory[productsKey] || [];

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
          options={options} // Updated options based on search or selection
          getOptionLabel={(option: SearchResult | string) =>
            typeof option === 'string' ? option : option.name
          }
          isOptionEqualToValue={(
            option: SearchResult | string,
            value: SearchResult | string
          ) =>
            typeof option === 'string' && typeof value === 'string'
              ? option === value
              : typeof option !== 'string' &&
                typeof value !== 'string' &&
                option._id === value._id
          }
          onInputChange={handleInputChange}
          onChange={(event, value) => handleAddProducts(value)}
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
        {!searchTerm.trim() && (
          <Tabs
            value={activeBrand}
            onChange={(e, newValue) => setActiveBrand(newValue)}
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
            {Object.keys(productsByBrandCategory)
              .filter(
                (brand) => brand !== 'search' && !brand.includes('-') // Ensure that the key is just the brand without category
              )
              .map((brand) => (
                <Tab key={brand} label={brand} value={brand} />
              ))}
          </Tabs>
        )}

        {/* Tabs for Categories (Sub Tabs) */}
        {!searchTerm.trim() && activeBrand && categories.length > 0 && (
          <Tabs
            value={activeCategory}
            onChange={(e, newValue) => setActiveCategory(newValue)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              mt: 2,
              mb: 2,
              '.MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                padding: '8px 16px',
              },
              '.Mui-selected': { color: 'primary.main' },
            }}
          >
            {categories.map((category) => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        )}

        {/* Product Table without Grouping */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 2,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflowX: 'auto',
            maxHeight: '600px', // Set a max height for the table container
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Sub Category</TableCell>
                <TableCell>Series</TableCell>
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
              {/* Display Products Without Grouping */}
              {displayedProducts.length > 0 ? (
                <>
                  {displayedProducts.map((product: SearchResult) => {
                    const productId = product._id;

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

                    // Determine if the current quantity exceeds stock
                    const isQuantityExceedingStock = quantity > product.stock;

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
                                width: '100px',
                                height: '100px',
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
                        <TableCell>{product.sub_category || '-'}</TableCell>
                        <TableCell>{product.series || '-'}</TableCell>
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
                              order?.status
                                ?.toLowerCase()
                                ?.includes('accepted') ||
                              order?.status?.toLowerCase()?.includes('declined')
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Allow empty string for controlled input
                              if (inputValue === '') {
                                if (selectedProduct) {
                                  // If in cart, set quantity to 1 temporarily
                                  handleQuantityChange(productId, 1);
                                } else {
                                  // If not in cart, remove temporary quantity
                                  setTemporaryQuantities((prev) => {
                                    const updated = { ...prev };
                                    delete updated[productId];
                                    return updated;
                                  });
                                }
                                return;
                              }

                              const parsedValue = parseInt(inputValue);
                              if (isNaN(parsedValue)) return;

                              // Enforce minimum and maximum
                              let newQuantity = Math.max(1, parsedValue);
                              if (newQuantity > product.stock) {
                                newQuantity = product.stock;
                                debouncedWarn(
                                  `Maximum available stock for ${product.name} is ${product.stock}.`
                                );
                              }

                              if (selectedProduct) {
                                // If already in cart, update quantity
                                handleQuantityChange(productId, newQuantity);
                              } else {
                                // If not in cart, just store temp
                                setTemporaryQuantities((prev) => ({
                                  ...prev,
                                  [productId]: newQuantity,
                                }));
                                debouncedInfo(
                                  `Set quantity to ${newQuantity}. Add product to cart to confirm.`
                                );
                              }
                            }}
                            inputProps={{
                              min: 1,
                              max: product.stock,
                              step: 1,
                            }}
                            size='small'
                            sx={{ width: '80px' }}
                          />
                          {isQuantityExceedingStock && (
                            <Typography
                              variant='caption'
                              color='error'
                              sx={{ display: 'block' }}
                            >
                              Exceeds stock!
                            </Typography>
                          )}
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
                              order?.status
                                ?.toLowerCase()
                                ?.includes('accepted') ||
                              order?.status?.toLowerCase()?.includes('declined')
                            }
                            onClick={() =>
                              selectedProducts.some(
                                (prod) => prod._id === product._id
                              )
                                ? handleRemoveProduct(productId)
                                : handleAddProducts(product)
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
                  {/* Display 'No more products' message */}
                  {!loadingMore && noMoreProducts[productsKey] && (
                    <TableRow>
                      <TableCell colSpan={12} align='center'>
                        <Typography variant='body2' color='textSecondary'>
                          No more products for this {activeBrand} -{' '}
                          {activeCategory}.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align='center'>
                    <Typography variant='body1'>
                      {loading ? 'Loading products...' : 'No products found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

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
              selectedProducts.map((product: SearchResult) => {
                const productId = product._id;
                const sellingPrice = getSellingPrice(product);
                const itemTotal = parseFloat(
                  (sellingPrice * product.quantity!).toFixed(2)
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
            {/* Checkout Button */}
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
    </Box>
  );
};

export default memo(Products);
