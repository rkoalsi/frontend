// Products.tsx

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
  Card,
  CardContent,
  CardMedia,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
} from '@mui/material';
import {
  AddShoppingCart,
  RemoveShoppingCart,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  Sort,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import debounce from 'lodash.debounce';
import { toast } from 'react-toastify';
import QuantitySelector from './QuantitySelector'; // Adjust the path as necessary
import ImagePopupDialog from '../common/ImagePopUp';

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
  const [searchTerm, setSearchTerm] = useState<string>(''); // Current search term
  const [activeBrand, setActiveBrand] = useState<string>(''); // Currently active brand tab
  const [activeCategory, setActiveCategory] = useState<string>(''); // Currently active category tab
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({}); // Mapping of brands to their categories
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detect mobile screen
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false); // State for Cart Drawer
  const [noMoreProducts, setNoMoreProducts] = useState<{
    [key: string]: boolean;
  }>({}); // State to indicate no more products per key
  const [sortOrder, setSortOrder] = useState<string>('default');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // ------------------ Refs for Caching and Avoiding Duplicate Fetches ---------------------
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

  // Get selling price
  const getSellingPrice = useCallback(
    (product: SearchResult): number => {
      let marginPercent = 40; // Default 40%
      if (specialMargins[product._id]) {
        marginPercent = parseInt(specialMargins[product._id].replace('%', ''));
      } else if (customer?.cf_margin) {
        marginPercent = parseInt(customer?.cf_margin.replace('%', ''));
      }
      const margin = isNaN(marginPercent) ? 0.4 : marginPercent / 100;
      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [specialMargins, customer]
  );

  // Fetch all brands
  // Inside Products.tsx

  // At the top among your state variables, add:
  const [brandList, setBrandList] = useState<{ brand: string; url: string }[]>(
    []
  );

  // Then update fetchAllBrands:
  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/products/brands`
      );
      // API returns an array of objects: { brand, url }
      const allBrands: { brand: string; url: string }[] =
        response.data.brands || [];
      setBrandList(allBrands);
      // Set activeBrand to the first brand's name (if available)
      setActiveBrand(
        (prev) => prev || (allBrands[0] ? allBrands[0].brand : '')
      );
      // Initialize productsByBrandCategory using each brand's name as the key
      setProductsByBrandCategory((prev) => {
        const initialized = allBrands.reduce((acc, brandObj) => {
          acc[brandObj.brand] = [];
          return acc;
        }, {} as { [key: string]: SearchResult[] });
        return { ...prev, ...initialized };
      });
    } catch (error) {
      debouncedError('Failed to fetch brands.');
    } finally {
      setLoading(false);
    }
  }, [debouncedError]);

  // Fetch categories for a brand
  const fetchCategories = useCallback(
    async (brand: string) => {
      try {
        const response = await axios.get(
          `${process.env.api_url}/products/categories`,
          {
            params: { brand },
          }
        );
        const categories = response.data.categories || [];
        setCategoriesByBrand((prev) => ({
          ...prev,
          [brand]: categories.sort(),
        }));
        setActiveCategory((prev) => prev || categories[0] || ''); // Default to first category
      } catch (error) {
        debouncedError('Failed to fetch categories.');
      }
    },
    [debouncedError]
  );

  // Fetch products
  const fetchProducts = useCallback(
    async (
      key: string,
      brand?: string,
      category?: string,
      search?: string,
      page = 1,
      sortOverride?: string
    ) => {
      if (isFetching.current[key]) return;
      const controller = new AbortController();
      isFetching.current[key] = true;

      try {
        setLoadingMore(true);
        // Use sortOverride if provided, otherwise fall back to state sortOrder
        const sortToUse = sortOverride || sortOrder;
        const response = await axios.get(`${process.env.api_url}/products`, {
          params: {
            brand,
            category,
            search,
            page,
            per_page: 75,
            sort: sortToUse, // Pass the chosen sort order
          },
          signal: controller.signal,
        });

        const newProducts = response.data.products || [];
        const hasMore = newProducts.length === 75;

        setProductsByBrandCategory((prev) => ({
          ...prev,
          [key]:
            page === 1 ? newProducts : [...(prev[key] || []), ...newProducts],
        }));
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page, hasMore },
        }));
        if (!hasMore) setNoMoreProducts((prev) => ({ ...prev, [key]: true }));
      } catch (error) {
        if (!axios.isCancel(error)) {
          debouncedError('Failed to fetch products.');
        }
      } finally {
        isFetching.current[key] = false;
        setLoadingMore(false);
      }

      return () => controller.abort();
    },
    [debouncedError, sortOrder]
  );

  // Reset pagination and fetch products for a category
  const resetPaginationAndFetch = useCallback(
    async (brand: string, category: string) => {
      const key = `${brand}-${category}`;
      setPaginationState((prev) => ({
        ...prev,
        [key]: { page: 1, hasMore: true },
      }));
      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: [],
      }));
      fetchProducts(key, brand, category, undefined, 1);
    },
    [fetchProducts]
  );

  // Handle tab changes with debounce
  const handleTabChange = useCallback(
    debounce((newValue: string) => {
      setActiveBrand(newValue); // Set the new active brand
      const categories = categoriesByBrand[newValue] || []; // Retrieve categories for the selected brand

      // Set the first category if it exists
      const firstCategory = categories[0] || '';
      setActiveCategory(firstCategory);

      // Reset pagination and fetch products only if categories exist
      if (firstCategory) {
        resetPaginationAndFetch(newValue, firstCategory);
      }
    }, 300),
    [categoriesByBrand, resetPaginationAndFetch]
  );

  const handleCategoryTabChange = useCallback(
    debounce((newValue) => {
      setActiveCategory(newValue);
      resetPaginationAndFetch(activeBrand, newValue);
    }, 300),
    [activeBrand, resetPaginationAndFetch]
  );

  // Initialize brands and categories
  useEffect(() => {
    fetchAllBrands();
  }, [fetchAllBrands]);

  useEffect(() => {
    if (activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand); // Fetch categories only if they aren't already cached
    }
  }, [activeBrand, categoriesByBrand, fetchCategories]);

  // ------------------ Handle Search ---------------------
  const handleSearch = useCallback(
    debounce(async (search: string) => {
      setSearchTerm(search);
      const key =
        search.trim() !== '' ? 'search' : `${activeBrand}-${activeCategory}`;

      // Reset pagination and products if search term changes
      if (search.trim() !== '') {
        // Reset brand and category since they should not be used when searching.
        setActiveBrand('');
        setActiveCategory('');

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
        // Determine the default brand from brandList and default category from categoriesByBrand
        const defaultBrand = brandList.length > 0 ? brandList[0].brand : '';
        // Use the first category available for the defaultBrand (if any)
        const defaultCategory =
          (categoriesByBrand[defaultBrand] &&
            categoriesByBrand[defaultBrand][0]) ||
          '';

        // Update activeBrand and activeCategory with default values
        setActiveBrand(defaultBrand);
        setActiveCategory(defaultCategory);

        // Compute a new key using the default values
        const newKey = `${defaultBrand}-${defaultCategory}`;

        setPaginationState((prev) => ({
          ...prev,
          [newKey]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({
          ...prev,
          [newKey]: [],
        }));
        setNoMoreProducts((prev) => ({
          ...prev,
          [newKey]: false,
        }));

        await fetchProducts(
          newKey,
          defaultBrand,
          defaultCategory,
          undefined,
          1
        );

        // Reset options if needed
        setOptions(productsByBrandCategory[newKey] || []);
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
              : customer?.cf_margin || '40%',
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
      customer?.cf_margin,
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

  // ------------------ Handle Quantity Change ---------------------
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      const productInCart = selectedProducts.find(
        (product) => product._id === id
      );

      if (productInCart) {
        // Update existing product's quantity
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
      } else {
        // Add new product to cart with the specified quantity
        // Find the product in displayedProducts
        const product = displayedProducts.find((p) => p._id === id);
        if (product) {
          const sanitizedQuantity = Math.max(
            1,
            Math.min(newQuantity, product.stock)
          );

          const queryString = window.location.search;
          const urlParams = new URLSearchParams(queryString);
          const isShared = urlParams.has('shared');

          const updatedProducts: any[] = [
            ...selectedProducts,
            {
              ...product,
              margin: specialMargins[id]
                ? specialMargins[id]
                : customer?.cf_margin || '40%',
              quantity: sanitizedQuantity,
              added_by: isShared ? 'customer' : 'sales_person',
            },
          ];

          setSelectedProducts(updatedProducts);
          debouncedSuccess(
            `Added ${product.name} (x${sanitizedQuantity}) to cart.`
          );
        }
      }
    },
    [
      selectedProducts,
      specialMargins,
      customer?.cf_margin,
      debouncedSuccess,
      displayedProducts,
    ]
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
    const key = `${activeBrand}-${activeCategory}`;
    if (
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500 &&
      !loadingMore &&
      paginationState[key]?.hasMore
    ) {
      const nextPage = (paginationState[key]?.page || 1) + 1;
      fetchProducts(key, activeBrand, activeCategory, undefined, nextPage);
    }
  }, [
    activeBrand,
    activeCategory,
    fetchProducts,
    loadingMore,
    paginationState,
  ]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ------------------ Reset Pagination on Brand or Category Tab Switch ---------------------
  useEffect(() => {
    if (activeBrand) {
      resetPaginationAndFetch(
        activeBrand,
        categoriesByBrand[activeBrand]?.[0] || ''
      );
    }
  }, [activeBrand, categoriesByBrand, resetPaginationAndFetch]);
  const handleSortChange = (e: any) => {
    const newSort = e.target.value as string;
    setSortOrder(newSort);
    // Reset pagination and re-fetch products for current brand/category or search
    const key =
      searchTerm.trim() !== ''
        ? 'search'
        : activeBrand && activeCategory
        ? `${activeBrand}-${activeCategory}`
        : 'all';
    setPaginationState((prev) => ({
      ...prev,
      [key]: { page: 1, hasMore: true },
    }));
    setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
    setNoMoreProducts((prev) => ({ ...prev, [key]: false }));
    fetchProducts(
      key,
      activeBrand,
      activeCategory,
      searchTerm.trim() !== '' ? searchTerm : undefined,
      1,
      newSort
    );
  };
  const handleSortIconClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortMenuSelect = (value: any) => {
    handleSortChange({ target: { value } });
    setAnchorEl(null);
  };

  // ------------------ Render Component ---------------------
  if (!customer) {
    return <Typography>This is content for Products</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'column' }, // Use column for full-width
        gap: 3, // Increase gap for spacing
        width: '100%',
        padding: 1.5, // Increase padding
        maxWidth: '100%', // Ensure full width on larger screens
        margin: '0 auto', // Center horizontally
        position: 'relative',
      }}
    >
      {/* Left Section: Products */}
      <Box sx={{ flex: 3 }}>
        {/* Header with Clear Cart Button */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 2 }}
        >
          <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
            Add Products
          </Typography>
          <Button
            variant='contained'
            color='primary'
            onClick={handleClearCart}
            disabled={
              selectedProducts.length === 0 ||
              !order?.status?.toLowerCase()?.includes('draft')
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
          // onChange={(event, value) => handleAddProducts(value)}
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
        <Box
          display={'flex'}
          justifyContent={'flex-start'}
          alignItems={'baseline'}
          gap={'8px'}
        >
          {/* <Typography variant='subtitle2'>Brands:</Typography> */}
          {/* Tabs for Brands */}
          {isMobile ? (
            // Mobile View: Brand Dropdown with image
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='brand-select-label'>Brand</InputLabel>
              <Select
                labelId='brand-select-label'
                id='brand-select'
                value={activeBrand}
                label='Brand'
                disabled={searchTerm !== ''}
                onChange={(e) => handleTabChange(e.target.value)}
              >
                {brandList.map((b) => (
                  <MenuItem key={b.brand} value={b.brand}>
                    <Box display='flex' alignItems='center'>
                      {/* <img
                        src={b.url}
                        alt={b.brand}
                        style={{ width: 200, height: 40, marginRight: 8 }}
                      /> */}
                      {b.brand}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            // Desktop View: Tabs with brand image
            !searchTerm.trim() && (
              <Tabs
                value={activeBrand || (brandList[0] ? brandList[0].brand : '')}
                onChange={(e, newValue) => handleTabChange(newValue)}
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
                {brandList.map((b) => (
                  <Tab
                    key={b.brand}
                    value={b.brand}
                    label={
                      <Box display='flex' alignItems='center'>
                        {/* <img
                          src={b.url}
                          alt={b.brand}
                          style={{ width: 200, height: 40, marginRight: 8 }}
                        /> */}
                        {b.brand}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            )
          )}
        </Box>
        <Box
          display={'flex'}
          justifyContent={'flex-start'}
          alignItems={'baseline'}
          gap={'8px'}
        >
          {/* <Typography variant='subtitle2'>Categories</Typography> */}
          {/* Tabs for Categories (Sub Tabs) */}
          {isMobile ? (
            // Mobile View: Categories Dropdown
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='category-select-label'>Category</InputLabel>
              <Select
                labelId='category-select-label'
                id='category-select'
                value={activeCategory}
                label='Category'
                disabled={searchTerm !== ''}
                onChange={(e) => handleCategoryTabChange(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            !searchTerm.trim() &&
            activeBrand &&
            categories.length > 0 && (
              <Tabs
                value={activeCategory || categories[0] || ''} // Ensure a valid default value
                onChange={(e, newValue) => handleCategoryTabChange(newValue)}
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
            )
          )}
          {/* <<-- New: Sort Filter Dropdown --> */}
        </Box>

        {isMobile ? (
          // Mobile: full-width dropdown as before
          <Box sx={{ mt: 2, mb: 2, width: '100%' }}>
            <FormControl fullWidth variant='outlined'>
              <InputLabel id='sort-select-label'>Sort By</InputLabel>
              <Select
                labelId='sort-select-label'
                id='sort-select'
                value={sortOrder}
                label='Sort By'
                onChange={(e: any) => handleSortChange(e)}
              >
                <MenuItem value='default'>Default</MenuItem>
                <MenuItem value='price_asc'>Price: Low to High</MenuItem>
                <MenuItem value='price_desc'>Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          // Desktop: show sort icon button that opens a menu
          !searchTerm.trim() &&
          activeBrand &&
          categories.length > 0 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <IconButton onClick={handleSortIconClick}>
                <Sort />
              </IconButton>
              <Menu
                id='sort-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleSortMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => handleSortMenuSelect('default')}>
                  Default
                </MenuItem>
                <MenuItem onClick={() => handleSortMenuSelect('price_asc')}>
                  Price: Low to High
                </MenuItem>
                <MenuItem onClick={() => handleSortMenuSelect('price_desc')}>
                  Price: High to Low
                </MenuItem>
              </Menu>
            </Box>
          )
        )}

        {/* Responsive Products Display */}
        {!isMobile ? (
          // Desktop/Table View
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      position: 'sticky', // Makes the header sticky
                      top: 0, // Sticks the header at the top
                      zIndex: 1000, // Ensures it appears above other elements
                      backgroundColor: 'background.paper', // Keeps the background solid
                    }}
                  >
                    Image
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Sub Category
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Series
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                      minWidth: '80px',
                    }}
                  >
                    SKU
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                      minWidth: '80px',
                    }}
                  >
                    Price
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                      minWidth: '80px',
                    }}
                  >
                    Stock
                  </TableCell>

                  {/* Margin Column */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Margin
                  </TableCell>

                  {/* Selling Price Column */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                      minWidth: '112px',
                    }}
                  >
                    Selling Price
                  </TableCell>

                  {/* Quantity Column */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      textAlign: 'center',
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Quantity
                  </TableCell>

                  {/* Total Column */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Total
                  </TableCell>

                  {/* Action Column */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1000,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    Action
                  </TableCell>
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
                      const quantity: any =
                        selectedProduct?.quantity ||
                        temporaryQuantities[productId] ||
                        '';

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
                          <TableCell
                            sx={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            ₹{product.rate}
                          </TableCell>
                          <TableCell>{product.stock}</TableCell>

                          {/* Margin (either from specialMargins or default) */}
                          <TableCell>
                            {specialMargins[productId]
                              ? specialMargins[productId]
                              : customer?.cf_margin || '40%'}
                          </TableCell>

                          {/* Selling Price */}
                          <TableCell>₹{sellingPrice}</TableCell>

                          {/* Quantity Selector */}
                          <TableCell style={{ padding: '0px' }}>
                            <QuantitySelector
                              quantity={quantity}
                              max={product.stock}
                              onChange={(newQuantity) =>
                                handleQuantityChange(productId, newQuantity)
                              }
                              disabled={
                                order?.status
                                  ?.toLowerCase()
                                  ?.includes('accepted') ||
                                order?.status
                                  ?.toLowerCase()
                                  ?.includes('declined')
                              }
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
                                order?.status
                                  ?.toLowerCase()
                                  ?.includes('declined')
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
                            No more products for{' '}
                            {searchTerm ? searchTerm : activeBrand}{' '}
                            {searchTerm ? '' : `${activeCategory}.`}
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
        ) : (
          // Mobile/Card View
          <Box>
            {displayedProducts.length > 0 ? (
              <Grid container spacing={2}>
                {displayedProducts.map(
                  (product: SearchResult, index: number) => {
                    const productId = product._id;
                    const selectedProduct = selectedProducts.find(
                      (p) => p._id === product._id
                    );

                    // Calculate selling price
                    const sellingPrice = getSellingPrice(product);

                    // If the product is in the cart, use its quantity; otherwise, use the temp or default
                    const quantity: any =
                      selectedProduct?.quantity ||
                      temporaryQuantities[productId] ||
                      '';

                    // Item-level total
                    const itemTotal = parseFloat(
                      (sellingPrice * quantity).toFixed(2)
                    );

                    // Determine if the current quantity exceeds stock
                    const isQuantityExceedingStock = quantity > product.stock;

                    return (
                      <Grid item xs={12} key={productId}>
                        <Card
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 2,
                            boxShadow: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: 'background.paper',
                            marginTop: index == 0 ? '16px' : null,
                          }}
                        >
                          {/* "New" Badge & Image Section */}
                          <Box sx={{ position: 'relative' }}>
                            {product.new && (
                              <Badge
                                badgeContent='New'
                                color='secondary'
                                overlap='rectangular'
                                anchorOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 16, // Add some spacing from the top
                                  right: 20, // Add some spacing from the right
                                  zIndex: 10,
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.7rem', // Smaller font size for mobile
                                    fontWeight: 'bold',
                                    borderRadius: 1,
                                    padding: '4px 6px', // Adequate padding
                                  },
                                }}
                              />
                            )}
                            <CardMedia
                              component='img'
                              image={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              sx={{
                                width: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                },
                              }}
                              onClick={() =>
                                handleImageClick(
                                  product.image_url || '/placeholder.png'
                                )
                              }
                            />
                          </Box>

                          {/* Details Section */}
                          <CardContent sx={{ p: 2 }}>
                            <Typography
                              variant='h6'
                              sx={{ fontWeight: 'bold', mb: 1 }}
                            >
                              {product.name}
                            </Typography>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, auto)',
                                columnGap: 1,
                                rowGap: 0.5,
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Sub Category
                              </Typography>
                              <Typography variant='body2'>
                                {product.sub_category || '-'}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Series
                              </Typography>
                              <Typography variant='body2'>
                                {product.series || '-'}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                SKU
                              </Typography>
                              <Typography variant='body2'>
                                {product.cf_sku_code || '-'}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Price
                              </Typography>
                              <Typography variant='body2'>
                                ₹{product.rate}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Stock
                              </Typography>
                              <Typography variant='body2'>
                                {product.stock}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Margin
                              </Typography>
                              <Typography variant='body2'>
                                {specialMargins[productId]
                                  ? specialMargins[productId]
                                  : customer?.cf_margin || '40%'}
                              </Typography>

                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}
                              >
                                Selling Price
                              </Typography>
                              <Typography variant='body2'>
                                ₹{sellingPrice}
                              </Typography>
                              {selectedProduct && (
                                <>
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ fontWeight: 800 }}
                                  >
                                    Item Total
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    fontWeight={'bold'}
                                  >
                                    ₹{itemTotal}
                                  </Typography>
                                </>
                              )}
                            </Box>

                            {/* Quantity Selector & Item Total */}
                            <Box
                              sx={{
                                mt: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <QuantitySelector
                                quantity={quantity}
                                max={product.stock}
                                onChange={(newQuantity) =>
                                  handleQuantityChange(productId, newQuantity)
                                }
                                disabled={
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('accepted') ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('declined')
                                }
                              />
                            </Box>
                            {isQuantityExceedingStock && (
                              <Typography variant='caption' color='error'>
                                Exceeds stock!
                              </Typography>
                            )}

                            {/* Action Button */}
                            <Box mt={2}>
                              <Button
                                variant='contained'
                                color={
                                  selectedProducts.some(
                                    (prod) => prod._id === product._id
                                  )
                                    ? 'error'
                                    : 'primary'
                                }
                                startIcon={
                                  selectedProducts.some(
                                    (prod) => prod._id === product._id
                                  ) ? (
                                    <RemoveShoppingCart />
                                  ) : (
                                    <AddShoppingCart />
                                  )
                                }
                                onClick={() =>
                                  selectedProducts.some(
                                    (prod) => prod._id === product._id
                                  )
                                    ? handleRemoveProduct(productId)
                                    : handleAddProducts(product)
                                }
                                disabled={
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('accepted') ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('declined')
                                }
                                fullWidth
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                }}
                              >
                                {selectedProducts.some(
                                  (prod) => prod._id === product._id
                                )
                                  ? 'Remove from Cart'
                                  : 'Add to Cart'}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  }
                )}
              </Grid>
            ) : (
              <Box mt={2}>
                <Typography variant='body1' align='center'>
                  {loading ? 'Loading products...' : 'No products found.'}
                </Typography>
              </Box>
            )}

            {/* Loading Indicator for More Products */}
            {loadingMore && (
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
            )}

            {/* Display 'No more products' message */}
            {!loadingMore && noMoreProducts[productsKey] && (
              <Box mt={2}>
                <Typography
                  variant='body2'
                  color='textSecondary'
                  align='center'
                >
                  No more products for {searchTerm ? searchTerm : activeBrand}{' '}
                  {searchTerm ? '' : `${activeCategory}.`}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Cart Icon */}
      <IconButton
        color='primary'
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: isMobile ? theme.spacing(10) : theme.spacing(4),
          right: isMobile ? theme.spacing(2) : theme.spacing(4),
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
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 450,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            padding: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Cart
          </Typography>
          <IconButton onClick={() => setCartDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Product List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {selectedProducts.length === 0 ? (
            <Typography variant='body1' align='center' sx={{ mt: 4 }}>
              Your cart is empty.
            </Typography>
          ) : (
            <Grid
              container
              paddingLeft={2}
              paddingRight={2}
              sx={{
                gap: '16px',
              }}
            >
              {selectedProducts.map((product: any) => {
                const productId = product._id;
                const sellingPrice = getSellingPrice(product);
                const itemTotal = parseFloat(
                  (sellingPrice * product.quantity).toFixed(2)
                );
                const quantity =
                  product.quantity || temporaryQuantities[productId] || '';

                const isDisabled =
                  order?.status?.toLowerCase()?.includes('accepted') ||
                  order?.status?.toLowerCase()?.includes('declined');

                return (
                  <Grid
                    item
                    xs={12}
                    key={productId}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      padding: 2,
                      boxShadow: 1,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Grid container spacing={2} alignItems='center'>
                      {/* Product Details */}
                      <Grid item xs={12} sm={8}>
                        <Typography
                          variant='subtitle1'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {product.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <QuantitySelector
                            quantity={quantity}
                            max={product.stock}
                            onChange={(newQuantity) =>
                              handleQuantityChange(productId, newQuantity)
                            }
                            disabled={isDisabled}
                          />
                        </Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 1 }}
                        >
                          Price: ₹{sellingPrice.toFixed(2)}
                        </Typography>
                      </Grid>

                      {/* Item Total and Remove Button */}
                      <Grid
                        item
                        xs={12}
                        sm={4}
                        container
                        direction={isMobile ? 'row' : 'column'}
                        justifyContent={isMobile ? 'space-between' : 'flex-end'}
                        alignItems={isMobile ? 'center' : 'flex-end'}
                        sx={{ mt: isMobile ? 0 : 1 }}
                      >
                        <Typography
                          variant='subtitle1'
                          sx={{ fontWeight: 'bold', mb: isMobile ? 0 : 1 }}
                        >
                          ₹{itemTotal.toFixed(2)}
                        </Typography>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleRemoveProduct(productId)}
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <RemoveShoppingCart />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        <Divider />

        {/* Cart Totals and Checkout */}
        <Box sx={{ padding: 2 }}>
          {selectedProducts.length > 0 && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                  Total GST ({customer?.cf_in_ex || 'Exclusive'}): ₹
                  {totals.totalGST.toFixed(2)}
                </Typography>
                <Typography variant='h6' sx={{ fontWeight: 'bold', mt: 1 }}>
                  Total Amount: ₹{totals.totalAmount.toFixed(2)}
                </Typography>
              </Box>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  setCartDrawerOpen(false);
                  onCheckout();
                }}
                disabled={
                  selectedProducts.length === 0 ||
                  !order?.status?.toLowerCase()?.includes('draft')
                }
              >
                Checkout
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Image Popup Dialog */}
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default memo(Products);
