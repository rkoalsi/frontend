// ProductsOptimized.tsx

import React, {
  useState,
  useEffect,
  memo,
  useCallback,
  useRef,
  useMemo,
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
  Switch,
  FormControlLabel,
  Checkbox,
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
import QuantitySelector from './QuantitySelector';
import ImagePopupDialog from '../common/ImagePopUp';

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
  };
  order: {
    status?: string;
  };
  specialMargins: { [key: string]: string };
  totals: any;
  onCheckout: () => void;
}

// ---------- Helper Components ----------

interface ProductRowProps {
  product: SearchResult;
  selectedProducts: SearchResult[];
  temporaryQuantities: { [key: string]: number };
  specialMargins: { [key: string]: string };
  customerMargin: string;
  orderStatus?: string;
  getSellingPrice: (product: SearchResult) => number;
  handleImageClick: (src: string) => void;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleAddOrRemove: (product: SearchResult) => void;
}
const ProductRow: React.FC<ProductRowProps> = memo(
  ({
    product,
    selectedProducts,
    temporaryQuantities,
    specialMargins,
    customerMargin,
    orderStatus,
    getSellingPrice,
    handleImageClick,
    handleQuantityChange,
    handleAddOrRemove,
  }) => {
    const productId = product._id;
    const selectedProduct = selectedProducts.find((p) => p._id === productId);
    const quantity: any =
      selectedProduct?.quantity || temporaryQuantities[productId] || '';
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes('accepted') ||
      orderStatus?.toLowerCase().includes('declined');

    return (
      <TableRow key={productId}>
        <TableCell>
          <Badge
            badgeContent={product.new ? 'New' : undefined}
            color='secondary'
            overlap='rectangular'
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
                handleImageClick(product.image_url || '/placeholder.png')
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
        <TableCell>
          {specialMargins[productId]
            ? specialMargins[productId]
            : customerMargin}
        </TableCell>
        <TableCell>₹{sellingPrice}</TableCell>
        <TableCell style={{ padding: 0 }}>
          <QuantitySelector
            quantity={quantity}
            max={product.stock}
            onChange={(newQuantity) =>
              handleQuantityChange(productId, newQuantity)
            }
            disabled={isDisabled}
          />
          {isQuantityExceedingStock && (
            <Typography variant='caption' color='error'>
              Exceeds stock!
            </Typography>
          )}
        </TableCell>
        <TableCell>{selectedProduct ? `₹${itemTotal}` : '-'}</TableCell>
        <TableCell>
          <IconButton
            color='primary'
            disabled={isDisabled}
            onClick={() => handleAddOrRemove(product)}
          >
            {selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />}
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

interface ProductCardProps {
  product: SearchResult;
  selectedProducts: SearchResult[];
  temporaryQuantities: { [key: string]: number };
  specialMargins: { [key: string]: string };
  customerMargin: string;
  orderStatus?: string;
  getSellingPrice: (product: SearchResult) => number;
  handleImageClick: (src: string) => void;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleAddOrRemove: (product: SearchResult) => void;
  index: number;
}
const ProductCard: React.FC<ProductCardProps> = memo(
  ({
    product,
    selectedProducts,
    temporaryQuantities,
    specialMargins,
    customerMargin,
    orderStatus,
    getSellingPrice,
    handleImageClick,
    handleQuantityChange,
    handleAddOrRemove,
    index,
  }) => {
    const productId = product._id;
    const selectedProduct = selectedProducts.find((p) => p._id === productId);
    const quantity: any =
      selectedProduct?.quantity || temporaryQuantities[productId] || '';
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes('accepted') ||
      orderStatus?.toLowerCase().includes('declined');

    return (
      <Grid item xs={12} key={productId}>
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: 3,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            mt: index === 0 ? '16px' : undefined,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {product.new && (
              <Badge
                badgeContent='New'
                color='secondary'
                overlap='rectangular'
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  zIndex: 10,
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: 1,
                    padding: '4px 6px',
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
                '&:hover': { transform: 'scale(1.03)' },
              }}
              onClick={() =>
                handleImageClick(product.image_url || '/placeholder.png')
              }
            />
          </Box>
          <CardContent sx={{ p: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
              {product.name}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, auto)',
                gap: 1,
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
              <Typography variant='body2'>{product.series || '-'}</Typography>
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
              <Typography variant='body2'>₹{product.rate}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Stock
              </Typography>
              <Typography variant='body2'>{product.stock}</Typography>
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
                  : customerMargin}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Selling Price
              </Typography>
              <Typography variant='body2'>₹{sellingPrice}</Typography>
              {selectedProduct && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 800 }}
                  >
                    Item Total
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    ₹{itemTotal}
                  </Typography>
                </>
              )}
            </Box>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <QuantitySelector
                quantity={quantity}
                max={product.stock}
                onChange={(newQuantity) =>
                  handleQuantityChange(productId, newQuantity)
                }
                disabled={isDisabled}
              />
            </Box>
            {isQuantityExceedingStock && (
              <Typography variant='caption' color='error'>
                Exceeds stock!
              </Typography>
            )}
            <Box mt={2}>
              <Button
                variant='contained'
                color={selectedProduct ? 'error' : 'primary'}
                startIcon={
                  selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />
                }
                onClick={() => handleAddOrRemove(product)}
                disabled={isDisabled}
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 'bold',
                }}
              >
                {selectedProduct ? 'Remove from Cart' : 'Add to Cart'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  }
);

// ---------- Main Component ----------

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
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ------------------ States ------------------
  const [query, setQuery] = useState<string>('');
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeBrand, setActiveBrand] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [noMoreProducts, setNoMoreProducts] = useState<{
    [key: string]: boolean;
  }>({});
  const [sortOrder, setSortOrder] = useState<string>('default');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [productCounts, setProductCounts] = useState<{
    [brand: string]: { [category: string]: number };
  }>({});
  const [brandList, setBrandList] = useState<{ brand: string; url: string }[]>(
    []
  );
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);

  // ------------------ Refs ------------------
  const isFetching = useRef<{ [key: string]: boolean }>({});

  // ------------------ Debounced Toasts ------------------
  const debouncedSuccess = useCallback(
    debounce((msg: string) => toast.success(msg), 1000),
    []
  );
  const debouncedWarn = useCallback(
    debounce((msg: string) => toast.warn(msg), 1000),
    []
  );
  const debouncedError = useCallback(
    debounce((msg: string) => toast.error(msg), 1000),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSuccess.cancel();
      debouncedWarn.cancel();
      debouncedError.cancel();
    };
  }, [debouncedSuccess, debouncedWarn, debouncedError]);

  // ------------------ Price Calculation ------------------
  const getSellingPrice = useCallback(
    (product: SearchResult): number => {
      let marginPercent = 40;
      if (specialMargins[product._id]) {
        marginPercent = parseInt(specialMargins[product._id].replace('%', ''));
      } else if (customer?.cf_margin) {
        marginPercent = parseInt(customer.cf_margin.replace('%', ''));
      }
      const margin = isNaN(marginPercent) ? 0.4 : marginPercent / 100;
      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [specialMargins, customer]
  );

  // ------------------ API Calls ------------------
  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/products/brands`
      );
      const allBrands: { brand: string; url: string }[] =
        response.data.brands || [];
      setBrandList(allBrands);
      if (!activeBrand && allBrands[0]) {
        setActiveBrand(allBrands[0].brand);
      }
      setProductsByBrandCategory((prev) =>
        allBrands.reduce(
          (acc, brandObj) => ({ ...acc, [brandObj.brand]: [] }),
          { ...prev }
        )
      );
    } catch (error) {
      debouncedError('Failed to fetch brands.');
    } finally {
      setLoading(false);
    }
  }, [activeBrand, debouncedError]);

  const fetchCategories = useCallback(
    async (brand: string) => {
      try {
        const response = await axios.get(
          `${process.env.api_url}/products/categories`,
          { params: { brand } }
        );
        const categories = response.data.categories || [];
        setCategoriesByBrand((prev) => ({
          ...prev,
          [brand]: categories.sort(),
        }));
        if (!activeCategory && categories[0]) setActiveCategory(categories[0]);
      } catch (error) {
        debouncedError('Failed to fetch categories.');
      }
    },
    [activeCategory, debouncedError]
  );

  // New function to fetch all categories (ignoring brand)
  const fetchAllCategories = useCallback(async () => {
    try {
      // You may need to implement this endpoint on your backend
      const response = await axios.get(
        `${process.env.api_url}/products/all_categories`
      );
      const categories = response.data.categories || [];
      setAllCategories(categories.sort());
      if (!activeCategory && categories[0]) setActiveCategory(categories[0]);
    } catch (error) {
      debouncedError('Failed to fetch all categories.');
    }
  }, [activeCategory, debouncedError]);

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
        const sortToUse = sortOverride || sortOrder;
        const response = await axios.get(`${process.env.api_url}/products`, {
          params: {
            brand,
            category,
            search,
            page,
            per_page: 75,
            sort: sortToUse,
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
        setPaginationState((prev) => ({ ...prev, [key]: { page, hasMore } }));
        if (!hasMore) setNoMoreProducts((prev) => ({ ...prev, [key]: true }));
      } catch (error) {
        if (!axios.isCancel(error)) debouncedError('Failed to fetch products.');
      } finally {
        isFetching.current[key] = false;
        setLoadingMore(false);
      }
      return () => controller.abort();
    },
    [sortOrder, debouncedError]
  );

  const fetchProductCounts = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/counts`
      );
      setProductCounts(response.data);
    } catch (error) {
      debouncedError('Failed to fetch product counts.');
    }
  }, [debouncedError]);

  // Modified resetPaginationAndFetch to handle groupByCategory
  const resetPaginationAndFetch = useCallback(
    (brand: string, category: string) => {
      let key = '';
      if (groupByCategory) {
        key = `all-${category}`;
        // When grouping by category, we do not filter by brand.
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        fetchProducts(key, undefined, category, undefined, 1);
      } else {
        key = `${brand}-${category}`;
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        fetchProducts(key, brand, category, undefined, 1);
      }
    },
    [groupByCategory, fetchProducts]
  );

  // ------------------ Handlers ------------------
  const handleTabChange = useCallback(
    debounce((newBrand: string) => {
      setActiveBrand(newBrand);
      const categories = categoriesByBrand[newBrand] || [];
      const firstCategory = categories[0] || '';
      setActiveCategory(firstCategory);
      if (firstCategory) resetPaginationAndFetch(newBrand, firstCategory);
    }, 300),
    [categoriesByBrand, resetPaginationAndFetch]
  );

  const handleCategoryTabChange = useCallback(
    debounce((newCategory: string) => {
      setActiveCategory(newCategory);
      // If grouping by category, brand is not used.
      resetPaginationAndFetch(groupByCategory ? '' : activeBrand, newCategory);
    }, 300),
    [activeBrand, groupByCategory, resetPaginationAndFetch]
  );

  const handleSearch = useCallback(
    debounce(async (search: string) => {
      setSearchTerm(search);
      const key =
        search.trim() !== ''
          ? 'search'
          : groupByCategory
          ? `all-${activeCategory}`
          : `${activeBrand}-${activeCategory}`;
      if (search.trim() !== '') {
        setActiveBrand('');
        setActiveCategory('');
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        setNoMoreProducts((prev) => ({ ...prev, [key]: false }));
        await fetchProducts(key, undefined, undefined, search, 1);
      } else {
        if (groupByCategory) {
          const defaultCategory =
            allCategories.length > 0 ? allCategories[0] : '';
          setActiveCategory(defaultCategory);
          const newKey = `all-${defaultCategory}`;
          setPaginationState((prev) => ({
            ...prev,
            [newKey]: { page: 1, hasMore: true },
          }));
          setProductsByBrandCategory((prev) => ({ ...prev, [newKey]: [] }));
          setNoMoreProducts((prev) => ({ ...prev, [newKey]: false }));
          await fetchProducts(newKey, undefined, defaultCategory, undefined, 1);
          setOptions(productsByBrandCategory[newKey] || []);
        } else {
          const defaultBrand = brandList.length > 0 ? brandList[0].brand : '';
          const defaultCategory =
            (categoriesByBrand[defaultBrand] &&
              categoriesByBrand[defaultBrand][0]) ||
            '';
          setActiveBrand(defaultBrand);
          setActiveCategory(defaultCategory);
          const newKey = `${defaultBrand}-${defaultCategory}`;
          setPaginationState((prev) => ({
            ...prev,
            [newKey]: { page: 1, hasMore: true },
          }));
          setProductsByBrandCategory((prev) => ({ ...prev, [newKey]: [] }));
          setNoMoreProducts((prev) => ({ ...prev, [newKey]: false }));
          await fetchProducts(
            newKey,
            defaultBrand,
            defaultCategory,
            undefined,
            1
          );
          setOptions(productsByBrandCategory[newKey] || []);
        }
      }
    }, 500),
    [
      activeBrand,
      activeCategory,
      groupByCategory,
      fetchProducts,
      brandList,
      categoriesByBrand,
      allCategories,
      productsByBrandCategory,
    ]
  );

  const handleInputChange = useCallback(
    (event: any, value: string) => {
      setQuery(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  const handleAddProducts = useCallback(
    (product: SearchResult) => {
      if (!product) return;
      const isAlreadySelected = selectedProducts.some(
        (p) => p._id === product._id
      );
      const productId = product._id;
      const quantity = temporaryQuantities[productId] || product.quantity || '';
      if (!isAlreadySelected) {
        const isShared = new URLSearchParams(window.location.search).has(
          'shared'
        );
        const updatedProducts: any = [
          ...selectedProducts,
          {
            ...product,
            margin: specialMargins[productId]
              ? specialMargins[productId]
              : customer?.cf_margin || '40%',
            quantity,
            added_by: isShared ? 'customer' : 'sales_person',
          },
        ];
        setSelectedProducts(updatedProducts);
        debouncedSuccess(`Added ${product.name} (x${quantity}) to cart.`);
        setTemporaryQuantities((prev) => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      } else {
        debouncedWarn(`${product.name} is already in the cart.`);
      }
      setOptions((prev) => prev.filter((opt) => opt._id !== product._id));
    },
    [
      selectedProducts,
      temporaryQuantities,
      specialMargins,
      customer,
      debouncedSuccess,
      debouncedWarn,
    ]
  );

  const handleRemoveProduct = useCallback(
    (id: string) => {
      const removedProduct = selectedProducts.find((p) => p._id === id);
      if (!removedProduct) return;
      setSelectedProducts(selectedProducts.filter((p) => p._id !== id));
      setOptions((prev) => [...prev, removedProduct]);
      debouncedSuccess(`Removed ${removedProduct.name} from cart`);
    },
    [selectedProducts, debouncedSuccess, setSelectedProducts]
  );

  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      const productInCart = selectedProducts.find((p) => p._id === id);
      if (productInCart) {
        const sanitized = Math.max(
          1,
          Math.min(newQuantity, productInCart.stock)
        );
        const updated = selectedProducts.map((p) =>
          p._id === id ? { ...p, quantity: sanitized } : p
        );
        setSelectedProducts(updated);
        debouncedSuccess(
          `Updated ${productInCart.name} to quantity ${sanitized}`
        );
      } else {
        const product = productsByBrandCategory[
          searchTerm.trim() !== ''
            ? 'search'
            : groupByCategory
            ? `all-${activeCategory}`
            : `${activeBrand}-${activeCategory}`
        ]?.find((p) => p._id === id);
        if (product) {
          const sanitized = Math.max(1, Math.min(newQuantity, product.stock));
          const isShared = new URLSearchParams(window.location.search).has(
            'shared'
          );
          const updated = [
            ...selectedProducts,
            {
              ...product,
              margin: specialMargins[id]
                ? specialMargins[id]
                : customer?.cf_margin || '40%',
              quantity: sanitized,
              added_by: isShared ? 'customer' : 'sales_person',
            },
          ];
          setSelectedProducts(updated);
          debouncedSuccess(`Added ${product.name} (x${sanitized}) to cart.`);
        }
      }
    },
    [
      selectedProducts,
      productsByBrandCategory,
      searchTerm,
      activeBrand,
      activeCategory,
      groupByCategory,
      specialMargins,
      customer,
      debouncedSuccess,
    ]
  );

  const handleClearCart = useCallback(async () => {
    try {
      await axios.put(`${process.env.api_url}/orders/clear/${id}`);
      setSelectedProducts([]);
      setOptions([]);
      debouncedSuccess('Cart cleared successfully.');
    } catch (error) {
      console.error('Failed to clear the cart:', error);
      debouncedError('Failed to clear the cart.');
    }
  }, [id, setSelectedProducts, debouncedSuccess, debouncedError]);

  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  const handleSortChange = (e: any) => {
    const newSort = e.target.value as string;
    setSortOrder(newSort);
    const key =
      searchTerm.trim() !== ''
        ? 'search'
        : groupByCategory
        ? `all-${activeCategory}`
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
      groupByCategory ? undefined : activeBrand,
      activeCategory,
      searchTerm.trim() !== '' ? searchTerm : undefined,
      1,
      newSort
    );
  };

  const handleSortIconClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleSortMenuClose = () => setAnchorEl(null);
  const handleSortMenuSelect = (value: string) => {
    handleSortChange({ target: { value } });
    setAnchorEl(null);
  };

  // ------------------ Infinite Scroll ------------------
  const handleScroll = useCallback(() => {
    const key = groupByCategory
      ? `all-${activeCategory}`
      : `${activeBrand}-${activeCategory}`;
    if (
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500 &&
      !loadingMore &&
      paginationState[key]?.hasMore
    ) {
      const nextPage = (paginationState[key]?.page || 1) + 1;
      fetchProducts(
        key,
        groupByCategory ? undefined : activeBrand,
        activeCategory,
        undefined,
        nextPage
      );
    }
  }, [
    activeBrand,
    activeCategory,
    groupByCategory,
    loadingMore,
    paginationState,
    fetchProducts,
  ]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (groupByCategory) {
      // When grouping by category, fetch all categories
      fetchAllCategories();
      // Reset products for the currently selected category
      if (activeCategory) {
        resetPaginationAndFetch('', activeCategory);
      }
    } else if (activeBrand) {
      resetPaginationAndFetch(
        activeBrand,
        categoriesByBrand[activeBrand]?.[0] || ''
      );
    }
  }, [
    activeBrand,
    activeCategory,
    categoriesByBrand,
    groupByCategory,
    fetchAllCategories,
    resetPaginationAndFetch,
  ]);

  // ------------------ Initial API Calls ------------------
  useEffect(() => {
    fetchAllBrands();
    fetchProductCounts();
  }, [fetchAllBrands, fetchProductCounts]);

  useEffect(() => {
    if (!groupByCategory && activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand);
    }
  }, [activeBrand, categoriesByBrand, fetchCategories, groupByCategory]);

  // ------------------ Derived Values ------------------
  const productsKey = useMemo(() => {
    return searchTerm.trim() !== ''
      ? 'search'
      : groupByCategory && activeCategory
      ? `all-${activeCategory}`
      : activeBrand && activeCategory
      ? `${activeBrand}-${activeCategory}`
      : 'all';
  }, [searchTerm, activeBrand, activeCategory, groupByCategory]);

  const displayedProducts = useMemo(() => {
    return productsByBrandCategory[productsKey] || [];
  }, [productsByBrandCategory, productsKey]);

  // Compute counts for all categories across brands
  const allCategoryCounts = useMemo(() => {
    const counts: { [category: string]: number } = {};
    Object.values(productCounts).forEach((brandCounts) => {
      Object.entries(brandCounts).forEach(([cat, count]) => {
        counts[cat] = (counts[cat] || 0) + count;
      });
    });
    return counts;
  }, [productCounts]);

  // ------------------ Render ------------------
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
        padding: 1.5,
        maxWidth: '100%',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Products Section */}
      <Box sx={{ flex: 3 }}>
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
              !['draft', 'sent'].includes(
                order?.status?.toLowerCase() as string
              )
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
        <Autocomplete
          freeSolo
          options={options}
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
          value={query}
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
                    {loading && <CircularProgress color='inherit' size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {/* Tabs: When groupByCategory is true, show only category tabs across all brands */}
        <Box display='flex' flexDirection={'column'} gap='8px' sx={{ mt: 2 }}>
          {/* When grouping by category, hide brand controls */}
          {!groupByCategory && (
            <>
              {isMobile || isTablet ? (
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
                    {brandList.map((b) => {
                      const brandCount = productCounts[b.brand]
                        ? Object.values(productCounts[b.brand]).reduce(
                            (a, b) => a + b,
                            0
                          )
                        : 0;
                      return (
                        <MenuItem key={b.brand} value={b.brand}>
                          <Box display='flex' alignItems='center'>
                            {b.brand} ({brandCount})
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              ) : (
                !searchTerm.trim() && (
                  <Tabs
                    value={
                      activeBrand || (brandList[0] ? brandList[0].brand : '')
                    }
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
                    {brandList.map((b) => {
                      const brandCount = productCounts[b.brand]
                        ? Object.values(productCounts[b.brand]).reduce(
                            (a, b) => a + b,
                            0
                          )
                        : 0;
                      return (
                        <Tab
                          key={b.brand}
                          value={b.brand}
                          label={`${b.brand} (${brandCount})`}
                        />
                      );
                    })}
                  </Tabs>
                )
              )}
            </>
          )}

          {/* Category Controls */}
          <Box>
            {isMobile || isTablet ? (
              groupByCategory ? (
                // On mobile when grouping by category: use a dropdown
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
                    {allCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat} ({allCategoryCounts[cat] || 0})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                // On mobile when NOT grouping: use the standard mobile dropdown for category
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
                    {categoriesByBrand[activeBrand]?.map((cat) => {
                      const catCount = productCounts[activeBrand]?.[cat] || 0;
                      return (
                        <MenuItem key={cat} value={cat}>
                          {cat} ({catCount})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )
            ) : // Desktop view
            groupByCategory ? (
              <Tabs
                value={activeCategory || allCategories[0] || ''}
                onChange={(e, newValue) => handleCategoryTabChange(newValue)}
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
                {allCategories.map((cat) => (
                  <Tab
                    key={cat}
                    value={cat}
                    label={`${cat} (${allCategoryCounts[cat] || 0})`}
                  />
                ))}
              </Tabs>
            ) : (
              !searchTerm.trim() &&
              activeBrand &&
              (categoriesByBrand[activeBrand] || []).length > 0 && (
                <Tabs
                  value={
                    activeCategory || categoriesByBrand[activeBrand][0] || ''
                  }
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
                  {categoriesByBrand[activeBrand].map((cat) => {
                    const catCount = productCounts[activeBrand]?.[cat] || 0;
                    return (
                      <Tab
                        key={cat}
                        label={`${cat} (${catCount})`}
                        value={cat}
                      />
                    );
                  })}
                </Tabs>
              )
            )}
          </Box>
          {isMobile || isTablet ? (
            <Box sx={{ mt: 2, mb: 2, width: '100%' }}>
              <FormControl fullWidth variant='outlined'>
                <InputLabel id='sort-select-label'>Sort By</InputLabel>
                <Select
                  labelId='sort-select-label'
                  id='sort-select'
                  value={sortOrder}
                  label='Sort By'
                  onChange={handleSortChange}
                >
                  <MenuItem value='default'>Default</MenuItem>
                  <MenuItem value='price_asc'>Price: Low to High</MenuItem>
                  <MenuItem value='price_desc'>Price: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ) : (
            !searchTerm.trim() &&
            activeBrand &&
            (categoriesByBrand[activeBrand] || []).length > 0 && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <IconButton onClick={handleSortIconClick}>
                  <Sort />
                </IconButton>
                <Menu
                  id='sort-menu'
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleSortMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
          {/* Toggle Switch for Group by Category */}
          <Box display='flex' justifyContent='flex-end'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={groupByCategory}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setGroupByCategory(newValue);
                    if (!newValue) {
                      const defaultBrand = brandList[0]?.brand || '';
                      const defaultCategory =
                        categoriesByBrand[defaultBrand]?.[0] || '';
                      setActiveBrand(defaultBrand);
                      setActiveCategory(defaultCategory);
                      resetPaginationAndFetch(defaultBrand, defaultCategory);
                    }
                  }}
                  color='primary'
                />
              }
              label='Group by Category'
            />
          </Box>
        </Box>

        {/* Products Display */}
        {isMobile || isTablet ? (
          <Box>
            {displayedProducts.length > 0 ? (
              <Grid container spacing={2}>
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    selectedProducts={selectedProducts}
                    temporaryQuantities={temporaryQuantities}
                    specialMargins={specialMargins}
                    customerMargin={customer?.cf_margin || '40%'}
                    orderStatus={order?.status}
                    getSellingPrice={getSellingPrice}
                    handleImageClick={handleImageClick}
                    handleQuantityChange={handleQuantityChange}
                    handleAddOrRemove={(prod) =>
                      selectedProducts.some((p) => p._id === prod._id)
                        ? handleRemoveProduct(prod._id)
                        : handleAddProducts(prod)
                    }
                    index={index}
                  />
                ))}
              </Grid>
            ) : (
              <Box mt={2}>
                <Typography variant='body1' align='center'>
                  {loading ? 'Loading products...' : 'No products found.'}
                </Typography>
              </Box>
            )}
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
            {!loadingMore && noMoreProducts[productsKey] && (
              <Box mt={2}>
                <Typography
                  variant='body2'
                  color='textSecondary'
                  align='center'
                >
                  No more products for{' '}
                  {searchTerm
                    ? searchTerm
                    : groupByCategory
                    ? activeCategory
                    : activeBrand}{' '}
                  {searchTerm ? '' : activeCategory}.
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    'Image',
                    'Name',
                    'Sub Category',
                    'Series',
                    'SKU',
                    'Price',
                    'Stock',
                    'Margin',
                    'Selling Price',
                    'Quantity',
                    'Total',
                    'Action',
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000,
                        backgroundColor: 'background.paper',
                        minWidth:
                          header === 'SKU' ||
                          header === 'Price' ||
                          header === 'Stock'
                            ? '80px'
                            : undefined,
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedProducts.length > 0 ? (
                  <>
                    {displayedProducts.map((product) => (
                      <ProductRow
                        key={product._id}
                        product={product}
                        selectedProducts={selectedProducts}
                        temporaryQuantities={temporaryQuantities}
                        specialMargins={specialMargins}
                        customerMargin={customer?.cf_margin || '40%'}
                        orderStatus={order?.status}
                        getSellingPrice={getSellingPrice}
                        handleImageClick={handleImageClick}
                        handleQuantityChange={handleQuantityChange}
                        handleAddOrRemove={(prod) =>
                          selectedProducts.some((p) => p._id === prod._id)
                            ? handleRemoveProduct(prod._id)
                            : handleAddProducts(prod)
                        }
                      />
                    ))}
                    {!loadingMore && noMoreProducts[productsKey] && (
                      <TableRow>
                        <TableCell colSpan={12} align='center'>
                          <Typography variant='body2' color='textSecondary'>
                            No more products for{' '}
                            {searchTerm
                              ? searchTerm
                              : groupByCategory
                              ? activeCategory
                              : activeBrand}{' '}
                            {searchTerm ? '' : activeCategory}.
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
        )}
      </Box>

      {/* Cart Icon */}
      <IconButton
        color='primary'
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: isMobile || isTablet ? theme.spacing(10) : theme.spacing(4),
          right: isMobile || isTablet ? theme.spacing(2) : theme.spacing(4),
          backgroundColor: 'background.paper',
          boxShadow: 3,
          '&:hover': { backgroundColor: 'background.default' },
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
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: isMobile || isTablet ? '100%' : 450,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
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
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {selectedProducts.length === 0 ? (
            <Typography variant='body1' align='center' sx={{ mt: 4 }}>
              Your cart is empty.
            </Typography>
          ) : (
            <Grid container paddingX={2} gap={2}>
              {selectedProducts.map((product: any) => {
                const productId = product._id;
                const sellingPrice = getSellingPrice(product);
                const itemTotal = parseFloat(
                  (sellingPrice * product.quantity).toFixed(2)
                );
                const isDisabled = ['accepted', 'declined'].includes(
                  order?.status?.toLowerCase() as string
                );
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
                    <Grid
                      container
                      spacing={2}
                      alignItems={isMobile || isTablet ? 'center' : 'flex-end'}
                    >
                      <Grid item xs={12} sm={8}>
                        <Box
                          display='flex'
                          justifyContent='center'
                          alignItems='center'
                        >
                          <img
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            loading='lazy'
                            style={{
                              width: isMobile || isTablet ? '200px' : '150px',
                              height: 'fit-content',
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
                        <Typography
                          variant='subtitle1'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {product.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <QuantitySelector
                            quantity={product.quantity}
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
                      <Grid
                        item
                        xs={12}
                        sm={4}
                        container
                        direction={isMobile || isTablet ? 'row' : 'column'}
                        justifyContent={
                          isMobile || isTablet ? 'space-between' : 'flex-end'
                        }
                        alignItems={
                          isMobile || isTablet ? 'center' : 'flex-end'
                        }
                        sx={{ mt: isMobile || isTablet ? 0 : 1 }}
                      >
                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 'bold',
                            mb: isMobile || isTablet ? 0 : 1,
                          }}
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
                  !['draft', 'sent'].includes(
                    order?.status?.toLowerCase() as string
                  )
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
