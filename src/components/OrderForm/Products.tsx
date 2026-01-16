// Products.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  startTransition,
} from "react";
import axios from "axios";
import { useProducts, useBrands, useCategories, useAllCategories, useProductCounts } from "../../hooks/useProducts";
import { ProductCardSkeleton, ProductGroupCardSkeleton } from "../common/ProductCardSkeleton";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
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
  useMediaQuery,
  useTheme,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Checkbox,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  Chip,
  Alert,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  Sort,
  AddShoppingCart,
  RemoveShoppingCart,
} from "@mui/icons-material";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import ProductRow from "./products/ProductRow";
import ProductCard from "./products/ProductCard";
import ProductGroupCard from "./products/ProductGroupCard";
import CartDrawer from "./products/Cart";
import ImagePopupDialog from "../common/ImagePopUp";
import Image from "next/image";
import DoubleScrollTable, { DoubleScrollTableRef } from "./DoubleScrollTable";
import ImageCarousel from "./products/ImageCarousel";
import QuantitySelector from "./QuantitySelector";
import { groupProductsByName, ProductGroup, GroupedProducts } from "../../util/groupProducts";

interface SearchResult {
  id?: number;
  _id: string;
  name: string;
  brand: string;
  image_url?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
}

interface ProductsProps {
  label: string;
  selectedProducts: SearchResult[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  customer: any;
  order: any;
  specialMargins: { [key: string]: string };
  totals: { totalGST: number; totalAmount: number };
  onCheckout: () => void;
  isShared: boolean;
  setSort: any;
}

// Memoized desktop product card wrapper to prevent unnecessary re-renders
const MemoizedDesktopProductCard = memo(({
  product,
  selectedProducts,
  temporaryQuantities,
  specialMargins,
  customer,
  order,
  getSellingPrice,
  handleImageClick,
  handleQuantityChange,
  handleRemoveProduct,
  handleAddProducts,
  isShared
}: any) => {
  const productId = product._id;
  const selectedProduct: any = selectedProducts.find((p: any) => p._id === productId);
  const quantity: any = selectedProduct?.quantity || temporaryQuantities[productId] || "";
  const sellingPrice = getSellingPrice(product);
  const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
  const isQuantityExceedingStock = quantity > product.stock;
  const isDisabled =
    order?.status?.toLowerCase().includes("accepted") ||
    order?.status?.toLowerCase().includes("declined");

  return (
    <Box key={productId}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: selectedProduct ? '4px solid' : 'none',
          borderLeftColor: selectedProduct ? 'primary.main' : 'transparent',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          willChange: 'transform',
          '&:hover': {
            boxShadow: 4,
            transform: 'translate3d(0, -4px, 0)',
          },
        }}
      >
        <Box sx={{ p: 2, position: 'relative' }}>
          {product.new && (
            <Chip
              label="New Arrivals"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: 'white',
                color: 'primary.main',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                },
              }}
            />
          )}
          <Box
            sx={{
              width: '100%',
              height: 200,
              position: 'relative',
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageCarousel
              product={product}
              handleImageClick={handleImageClick}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              minHeight: 64,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Brand:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.brand}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Category:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.category || '-'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Sub-Category:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.sub_category || '-'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Series:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.series || '-'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                SKU:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.cf_sku_code || '-'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                MRP:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                ₹{product.rate?.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Stock:
              </Typography>
              <Chip
                label={product.stock}
                size="small"
                color={product.stock > 10 ? 'success' : 'error'}
                variant={product.stock > 10 ? 'filled' : 'outlined'}
              />
            </Box>

            {!isShared && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Margin:
                </Typography>
                <Chip
                  label={specialMargins[productId] || customer?.cf_margin || "40%"}
                  size="small"
                  sx={{
                    backgroundColor: 'info.light',
                    color: 'info.contrastText',
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Selling Price:
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                ₹{sellingPrice?.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                GST:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {product.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
          <Box sx={{ mb: 2 }}>
            <QuantitySelector
              quantity={quantity}
              max={product.stock}
              onChange={(newQuantity: number) => handleQuantityChange(productId, newQuantity)}
              disabled={isDisabled}
            />
            {isQuantityExceedingStock && (
              <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                Exceeds stock!
              </Alert>
            )}
          </Box>

          {selectedProduct && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight={700}>
                ₹{itemTotal?.toLocaleString()}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant={selectedProduct ? "outlined" : "contained"}
            color={selectedProduct ? "error" : "primary"}
            disabled={isDisabled}
            onClick={() => {
              if (selectedProduct) {
                handleRemoveProduct(productId);
              } else {
                handleAddProducts(product);
              }
            }}
            startIcon={selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              willChange: 'transform',
              '&:hover': {
                transform: 'translate3d(0, -1px, 0)',
              },
            }}
          >
            {selectedProduct ? "Remove from Cart" : "Add to Cart"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.selectedProducts.some((p: any) => p._id === prevProps.product._id) ===
      nextProps.selectedProducts.some((p: any) => p._id === nextProps.product._id) &&
    prevProps.temporaryQuantities[prevProps.product._id] === nextProps.temporaryQuantities[nextProps.product._id] &&
    prevProps.specialMargins[prevProps.product._id] === nextProps.specialMargins[nextProps.product._id] &&
    prevProps.order?.status === nextProps.order?.status
  );
});

const Products: React.FC<ProductsProps> = ({
  label = "Search",
  selectedProducts = [],
  setSelectedProducts,
  customer = {},
  order = {},
  specialMargins = {},
  totals = { totalGST: 0, totalAmount: 0 },
  onCheckout,
  isShared = false,
  setSort,
}) => {
  const router = useRouter();
  const { id = "" } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // ------------------ States ------------------
  const [query, setQuery] = useState<string>("");
  const [temporaryQuantities, setTemporaryQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [showUPC, setShowUPC] = useState<boolean>(true);
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex]: any = useState(0);
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { page: number; hasMore: boolean };
  }>({});
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeBrand, setActiveBrand] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [noMoreProducts, setNoMoreProducts] = useState<{
    [key: string]: boolean;
  }>({});
  const [sortOrder, setSortOrder] = useState<string>("default");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [productCounts, setProductCounts] = useState<{
    [brand: string]: { [category: string]: number };
  }>({});
  const [brandList, setBrandList] = useState<{ brand: string; url: string }[]>(
    []
  );
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [cataloguePage, setCataloguePage]: any = useState();
  const [cataloguePages, setCataloguePages] = useState([]);
  const [catalogueEnabled, setCatalogueEnabled] = useState<boolean>(false);
  const [groupByProductName, setGroupByProductName] = useState<boolean>(true);

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const [link, setLink] = useState(
    order?.spreadsheet_created ? order?.spreadsheet_url : ""
  );
  const isFetching = useRef<{ [key: string]: boolean }>({});
  const tableScrollRef = useRef<DoubleScrollTableRef>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);
  const pageBottomRef = useRef<HTMLDivElement>(null);

  // ------------------ Optimized Toast Notifications ------------------
  // Remove debounce from errors (critical feedback) and reduce success debounce
  const debouncedSuccess = useCallback(
    debounce((msg: string) => toast.success(msg), 500), // Reduced from 1000ms
    []
  );
  const debouncedWarn = useCallback(
    debounce((msg: string) => toast.warn(msg), 500), // Reduced from 1000ms
    []
  );
  const showError = useCallback((msg: string) => toast.error(msg), []); // No debounce for errors

  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScrollButtonDisabled, setIsScrollButtonDisabled] = useState(false);
  const lastScrollTimeRef = useRef<number>(0);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, []);

  const COLUMNS = useMemo(() => {
    const baseColumns = isShared
      ? [
        "Image",
        "Name",
        "Sub Category",
        "Series",
        "SKU",
        "MRP",
        "Stock",
        "Selling Price",
        "GST",
        "Quantity",
        "Total",
        "Action",
      ]
      : [
        "Image",
        "Name",
        "Sub Category",
        "Series",
        "SKU",
        "MRP",
        "Stock",
        "Margin",
        "Selling Price",
        "GST",
        "Quantity",
        "Total",
        "Action",
      ];

    // Add UPC/EAN Code column if showUPC/EAN is true
    if (showUPC) {
      // Insert UPC/EAN Code after SKU
      const newColumns = [...baseColumns];
      newColumns.push("UPC/EAN Code");
      return newColumns;
    }

    return baseColumns;
  }, [isShared, showUPC]);

  const upcHeaderRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    return () => {
      debouncedSuccess.cancel();
      debouncedWarn.cancel();
      // Clear scroll timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [debouncedSuccess, debouncedWarn]);
  useEffect(() => {
    if (catalogueEnabled && activeBrand) {
      axios
        .get(
          `${process.env.api_url}/products/catalogue_pages?brand=${activeBrand}`
        )
        .then((response) => {
          const pages = response.data.catalogue_pages;
          setCataloguePages(pages);
          if (pages && pages.length > 0) {
            setCataloguePage(pages[0]); // reset to first available page
          } else {
            setCataloguePage(undefined);
          }
        })
        .catch((error) => showError("Failed to fetch catalogue pages."));
    }
  }, [catalogueEnabled, activeBrand]);
  // ------------------ Price Calculation ------------------
  const getSellingPrice = useCallback(
    (product: SearchResult): number => {
      let marginPercent = 40;
      if (specialMargins[product._id]) {
        marginPercent = parseInt(specialMargins[product._id].replace("%", ""));
      } else if (customer?.cf_margin) {
        marginPercent = parseInt(customer.cf_margin.replace("%", ""));
      }
      const margin = isNaN(marginPercent) ? 0.4 : marginPercent / 100;
      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [specialMargins, customer?.cf_margin]
  );

  // ------------------ API Calls ------------------
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

        // Handle "New Arrivals" brand specially - don't pass brand or category parameter, but pass new_only=true
        const brandParam = brand === "New Arrivals" ? undefined : brand;
        const categoryParam = brand === "New Arrivals" || category === "All Products" ? undefined : category;
        const newOnly = brand === "New Arrivals" ? true : undefined;

        const response = await axios.get(`${process.env.api_url}/products`, {
          params: {
            brand: brandParam,
            category: categoryParam,
            search,
            page,
            per_page: isMobile || isTablet ? 75 : 100, // Optimized for mobile performance
            sort: sortToUse,
            // Pass catalogue_page only in catalogue mode:
            catalogue_page:
              sortToUse === "catalogue" ? cataloguePage : undefined,
            // Pass group_by_name flag from the frontend state
            group_by_name: groupByProductName,
            // Pass new_only flag for "New Arrivals" brand
            new_only: newOnly,
          },
          signal: controller.signal,
        });

        const perPage = isMobile || isTablet ? 75 : 100;

        // Handle both grouped and ungrouped responses
        if (groupByProductName && response.data.items !== undefined) {
          // Backend returned grouped data in ordered format
          const newItems = response.data.items || [];

          // Count actual number of products (groups may contain multiple products)
          const totalProductsFetched = newItems.reduce((count: number, item: any) => {
            if (item.type === 'group') {
              return count + (item.products?.length || 0);
            }
            return count + 1; // Single product
          }, 0);

          const hasMore = totalProductsFetched >= perPage;

          setProductsByBrandCategory((prev: any) => ({
            ...prev,
            [key]: {
              items: page === 1 ? newItems : [...((prev[key] as any)?.items || []), ...newItems],
            },
          }));

          setPaginationState((prev) => ({ ...prev, [key]: { page, hasMore } }));
          if (!hasMore) setNoMoreProducts((prev) => ({ ...prev, [key]: true }));
        } else {
          // Normal ungrouped response
          const newProducts = response.data.products || [];
          const hasMore = newProducts.length >= perPage;
          setProductsByBrandCategory((prev) => ({
            ...prev,
            [key]:
              page === 1 ? newProducts : [...(prev[key] || []), ...newProducts],
          }));
          setPaginationState((prev) => ({ ...prev, [key]: { page, hasMore } }));
          if (!hasMore) setNoMoreProducts((prev) => ({ ...prev, [key]: true }));
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          showError("Failed to fetch products.");
          // Mark as no more products to prevent infinite retry on error
          setPaginationState((prev) => ({ ...prev, [key]: { page, hasMore: false } }));
          setNoMoreProducts((prev) => ({ ...prev, [key]: true }));
        }
      } finally {
        isFetching.current[key] = false;
        setLoadingMore(false);
      }
      return () => controller.abort();
    },
    [sortOrder, showError, cataloguePage, groupByProductName]
  );

  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/products/brands`
      );
      const allBrands: { brand: string; url: string }[] =
        response.data.brands || [];

      // Add "New Arrivals" as the first brand with a professional badge
      const newArrivalsBrand = {
        brand: "New Arrivals",
        url: "https://assets.pupscribe.in/brands/new-arrivals.svg"
      };
      const brandsWithNewArrivals = [newArrivalsBrand, ...allBrands];

      setBrandList(brandsWithNewArrivals);
      if (!activeBrand && brandsWithNewArrivals[0]) {
        setActiveBrand(brandsWithNewArrivals[0].brand);
      }
      setProductsByBrandCategory((prev) =>
        brandsWithNewArrivals.reduce(
          (acc, brandObj) => ({ ...acc, [brandObj.brand]: [] }),
          { ...prev }
        )
      );
    } catch (error) {
      showError("Failed to fetch brands.");
    } finally {
      setLoading(false);
    }
  }, [activeBrand, showError]);
  const resetPaginationAndFetch = useCallback(
    (brand: string, category: string) => {
      let key = "";
      if (sortOrder === "catalogue") {
        key = brand ? `${brand}-catalogue` : "catalogue";
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        // In catalogue mode, we pass the activeBrand and leave category undefined
        fetchProducts(key, brand, undefined, undefined, 1);
      } else if (groupByCategory) {
        key = `all-${category}`;
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
    [groupByCategory, fetchProducts, sortOrder]
  );
  const fetchCategories = useCallback(
    async (brand: string) => {
      try {
        // Handle "New Arrivals" brand specially
        if (brand === "New Arrivals") {
          const categories = ["All Products"];
          setCategoriesByBrand((prev) => ({
            ...prev,
            [brand]: categories,
          }));

          const defaultCategory = categories[0];
          if (!activeCategory && defaultCategory) {
            setActiveCategory(defaultCategory);
            // Immediately trigger the API call for the new category
            setTimeout(() => {
              resetPaginationAndFetch(brand, defaultCategory);
            }, 0);
          }
          return;
        }

        const response = await axios.get(
          `${process.env.api_url}/products/categories`,
          { params: { brand } }
        );
        const categories = response.data.categories || [];
        setCategoriesByBrand((prev) => ({
          ...prev,
          [brand]: categories.sort(),
        }));

        // Set the second category (index 1) as default, or first if second doesn't exist
        const defaultCategory = categories[1] || categories[0] || "";
        if (!activeCategory && defaultCategory) {
          setActiveCategory(defaultCategory);
          // Immediately trigger the API call for the new category
          setTimeout(() => {
            resetPaginationAndFetch(brand, defaultCategory);
          }, 0);
        }
      } catch (error) {
        showError("Failed to fetch categories.");
      }
    },
    [activeCategory, showError, resetPaginationAndFetch]
  );

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/all_categories`
      );
      const categories = response.data.categories || [];
      setAllCategories(categories.sort());

      // Set the second category (index 1) as default, or first if second doesn't exist
      const defaultCategory = categories[1] || categories[0] || "";
      if (defaultCategory) {
        // If activeCategory exists and is in the list, keep it; otherwise use default
        const categoryToUse = activeCategory && categories.includes(activeCategory)
          ? activeCategory
          : defaultCategory;

        if (categoryToUse !== activeCategory) {
          setActiveCategory(categoryToUse);
        }

        // Always trigger the API call for the category when switching to group by category mode
        setTimeout(() => {
          resetPaginationAndFetch("", categoryToUse);
        }, 0);
      }
    } catch (error) {
      showError("Failed to fetch all categories.");
    }
  }, [activeCategory, showError, resetPaginationAndFetch]);



  const fetchProductCounts = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/counts`
      );
      setProductCounts(response.data);
    } catch (error) {
      showError("Failed to fetch product counts.");
    }
  }, [showError]);



  // ------------------ Handlers ------------------
  const handleTabChange = useCallback(
    debounce((newBrand: string) => {
      setActiveBrand(newBrand);
      if (sortOrder !== "catalogue") {
        const categories = categoriesByBrand[newBrand] || [];
        const firstCategory = categories[0] || "";
        setActiveCategory(firstCategory);
        if (firstCategory) resetPaginationAndFetch(newBrand, firstCategory);
      }
    }, 300),
    [categoriesByBrand, resetPaginationAndFetch]
  );

  const handleCategoryTabChange = useCallback(
    debounce((newCategory: string) => {
      setActiveCategory(newCategory);
      resetPaginationAndFetch(groupByCategory ? "" : activeBrand, newCategory);
    }, 300),
    [activeBrand, groupByCategory, resetPaginationAndFetch]
  );

  const handleSearch = useCallback(
    debounce(async (search: string) => { // Optimized 300ms debounce for better UX
      setSearchTerm(search);
      const key =
        search.trim() !== ""
          ? "search"
          : groupByCategory
            ? `all-${activeCategory}`
            : `${activeBrand}-${activeCategory}`;
      if (search.trim() !== "") {
        // setActiveBrand('');
        // setActiveCategory('');
        // Instead of clearing the active filters in the UI,
        // pass undefined for both brand and category so the API call is global.
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        setNoMoreProducts((prev) => ({ ...prev, [key]: false }));
        await fetchProducts(key, undefined, undefined, search, 1);
      } else {
        // When search is empty, use the normal brand/category filters
        if (groupByCategory) {
          const defaultCategory =
            allCategories.length > 0 ? allCategories[0] : "";
          setActiveCategory(defaultCategory);
          const newKey = `all-${defaultCategory}`;
          setPaginationState((prev) => ({
            ...prev,
            [newKey]: { page: 1, hasMore: true },
          }));
          setProductsByBrandCategory((prev) => ({ ...prev, [newKey]: [] }));
          setNoMoreProducts((prev) => ({ ...prev, [newKey]: false }));
          await fetchProducts(newKey, undefined, defaultCategory, undefined, 1);
          const data = productsByBrandCategory[newKey];
          // Handle both grouped format {items: [...]} and plain array format
          if (data && (data as any).items !== undefined) {
            setOptions([]);
          } else {
            setOptions(Array.isArray(data) ? data : []);
          }
        } else {
          const defaultBrand = brandList.length > 0 ? brandList[0].brand : "";
          const defaultCategory =
            (categoriesByBrand[defaultBrand] &&
              categoriesByBrand[defaultBrand][0]) ||
            "";
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
          const data = productsByBrandCategory[newKey];
          // Handle both grouped format {items: [...]} and plain array format
          if (data && (data as any).items !== undefined) {
            setOptions([]);
          } else {
            setOptions(Array.isArray(data) ? data : []);
          }
        }
      }
    }, 300), // Reduced from 500ms to 300ms for more responsive search
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
    (product: any) => {
      if (!product) return;
      const isAlreadySelected = selectedProducts.some(
        (p) => p._id === product._id
      );
      const productId = product._id;
      const quantity = temporaryQuantities[productId] || product.quantity || 1;
      if (!isAlreadySelected) {
        const isShared = new URLSearchParams(window.location.search).has(
          "shared"
        );
        const updatedProducts: any = [
          ...selectedProducts,
          {
            ...product,
            margin: specialMargins[productId]
              ? specialMargins[productId]
              : customer?.cf_margin || "40%",
            quantity,
            added_by: isShared ? "customer" : "sales_person",
          },
        ];

        // Batch all state updates together to prevent multiple re-renders
        startTransition(() => {
          setSelectedProducts(updatedProducts);
          setTemporaryQuantities((prev) => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
          });
          setOptions((prev) => Array.isArray(prev) ? prev.filter((opt) => opt._id !== product._id) : []);
        });

        // Show toast after state update to avoid blocking
        requestAnimationFrame(() => {
          debouncedSuccess(`Added ${product.name} (x${quantity}) to cart.`);
        });
      } else {
        debouncedWarn(`${product.name} is already in the cart.`);
      }
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

      // Batch state updates to prevent multiple re-renders
      startTransition(() => {
        setSelectedProducts(selectedProducts.filter((p) => p._id !== id));
        setOptions((prev) => Array.isArray(prev) ? [...prev, removedProduct] : [removedProduct]);
      });

      // Show toast after state update to avoid blocking
      requestAnimationFrame(() => {
        debouncedSuccess(`Removed ${removedProduct.name} from cart`);
      });
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

        // Use startTransition for non-blocking update
        startTransition(() => {
          setSelectedProducts(updated);
        });

        debouncedSuccess(
          `Updated ${productInCart.name} to quantity ${sanitized}`
        );
      } else {
        const key = searchTerm.trim() !== ""
          ? "search"
          : groupByCategory
            ? `all-${activeCategory}`
            : `${activeBrand}-${activeCategory}`;

        const data = productsByBrandCategory[key];
        let product;

        // Check if data has items array (grouped format) or is a plain array
        if (data && (data as any).items !== undefined) {
          // Grouped format - search through items
          const items = (data as any).items || [];
          for (const item of items) {
            if (item.type === 'product' && item.product._id === id) {
              product = item.product;
              break;
            } else if (item.type === 'group') {
              const foundInGroup = item.products?.find((p: any) => p._id === id);
              if (foundInGroup) {
                product = foundInGroup;
                break;
              }
            }
          }
        } else if (Array.isArray(data)) {
          // Plain array format
          product = data.find((p) => p._id === id);
        }

        if (product) {
          const sanitized = Math.max(1, Math.min(newQuantity, product.stock));
          const isShared = new URLSearchParams(window.location.search).has(
            "shared"
          );
          const updated = [
            ...selectedProducts,
            {
              ...product,
              margin: specialMargins[id]
                ? specialMargins[id]
                : customer?.cf_margin || "40%",
              quantity: sanitized,
              added_by: isShared ? "customer" : "sales_person",
            },
          ];

          // Use startTransition for non-blocking update
          startTransition(() => {
            setSelectedProducts(updated);
          });

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
      debouncedSuccess("Cart cleared successfully.");
      setConfirmModalOpen(false); // Close modal after successful clear
    } catch (error) {
      showError("Failed to clear the cart.");
      setConfirmModalOpen(false); // Close modal even on error
    }
  }, [id, setSelectedProducts, debouncedSuccess, showError]);

  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
  };
  const handleImageClick = useCallback((srcList: any, index: number) => {
    if (Array.isArray(srcList)) {
      // Check if items already have src property (media items with type)
      // Make sure src is a string, not an object
      const formattedImages = srcList[0]?.src && typeof srcList[0].src === 'string'
        ? srcList
        : srcList?.map((src) => ({ src }));
      setPopupImageSrc(formattedImages);
      setPopupImageIndex(index);
      setOpenImagePopup(true);
    } else {
      setPopupImageSrc([{ src: srcList, alt: 'main_image' }]);
      setPopupImageIndex(0);
      setOpenImagePopup(true);
    }

  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  const handleSortChange = (e: any) => {
    const newSort = e.target.value as string;
    setSortOrder(newSort);
    setSort(newSort);
    // In catalogue mode, keep the activeBrand so that tab changes fetch brand‐specific data.
    if (newSort === "catalogue") {
      // Optionally clear the activeCategory if you don't need it
      setActiveCategory("");
      setGroupByCategory(false);
    }
    const key =
      searchTerm.trim() !== ""
        ? "search"
        : newSort === "catalogue"
          ? activeBrand
            ? `${activeBrand}-catalogue`
            : "catalogue"
          : groupByCategory
            ? `all-${activeCategory}`
            : activeBrand && activeCategory
              ? `${activeBrand}-${activeCategory}`
              : "all";
    setPaginationState((prev) => ({
      ...prev,
      [key]: { page: 1, hasMore: true },
    }));
    setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
    setNoMoreProducts((prev) => ({ ...prev, [key]: false }));
    fetchProducts(
      key,
      newSort === "catalogue" ? activeBrand : activeBrand,
      newSort === "catalogue" ? undefined : activeCategory,
      searchTerm.trim() !== "" ? searchTerm : undefined,
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
  const handleCataloguePage = (e: any) => {
    const value = e.target.value;
    setCataloguePage(parseInt(value));
  };

  // ------------------ productsKey must be defined before loadMore ------------------
  const productsKey = useMemo(() => {
    if (searchTerm.trim() !== "") {
      return "search";
    }
    if (sortOrder === "catalogue") {
      return activeBrand ? `${activeBrand}-catalogue` : "catalogue";
    }
    return groupByCategory && activeCategory
      ? `all-${activeCategory}`
      : activeBrand && activeCategory
        ? `${activeBrand}-${activeCategory}`
        : "all";
  }, [searchTerm, activeBrand, activeCategory, groupByCategory, sortOrder]);

  // ------------------ Infinite Scroll with Intersection Observer (Performance Optimized) ------------------
  const loadMore = useCallback(() => {
    // Prevent loading during programmatic scrolls (scroll buttons)
    if (isScrollingRef.current) {
      return;
    }

    // Use productsKey to ensure consistency with intersection observer
    // Check if already fetching for this key
    if (isFetching.current[productsKey]) {
      return;
    }

    if (!loadingMore && paginationState[productsKey]?.hasMore && !noMoreProducts[productsKey]) {
      const nextPage = (paginationState[productsKey]?.page || 1) + 1;

      // Determine brand and category based on current state
      let brandParam: string | undefined = groupByCategory ? undefined : activeBrand;
      let categoryParam: string | undefined = activeCategory;
      let searchParam: string | undefined = searchTerm.trim() !== "" ? searchTerm : undefined;

      // In catalogue mode, category should be undefined
      if (sortOrder === "catalogue") {
        categoryParam = undefined;
      }

      fetchProducts(
        productsKey,
        brandParam,
        categoryParam,
        searchParam,
        nextPage
      );
    }
  }, [
    productsKey,
    activeBrand,
    activeCategory,
    groupByCategory,
    loadingMore,
    paginationState,
    noMoreProducts,
    fetchProducts,
    searchTerm,
    sortOrder,
  ]);

  useEffect(() => {
    if (groupByCategory) {
      fetchAllCategories();
    } else if (activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand);
    } else if (activeBrand && activeCategory && categoriesByBrand[activeBrand]) {
      // Only call this if we have both brand and category set, and categories are already loaded
      resetPaginationAndFetch(activeBrand, activeCategory);
    }
  }, [
    activeBrand,
    activeCategory,
    categoriesByBrand,
    groupByCategory,
    fetchAllCategories,
    fetchCategories,
    resetPaginationAndFetch,
  ]);

  useEffect(() => {
    fetchAllBrands();
    fetchProductCounts();
  }, [fetchAllBrands, fetchProductCounts]);

  useEffect(() => {
    if (!groupByCategory && activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand);
    }
  }, [activeBrand, categoriesByBrand, fetchCategories, groupByCategory]);
  useEffect(() => {
    if (sortOrder === "catalogue") {
      const key = activeBrand ? `${activeBrand}-catalogue` : "catalogue";
      // Reset the product list and pagination for this key
      setPaginationState((prev) => ({
        ...prev,
        [key]: { page: 1, hasMore: true },
      }));
      setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
      // Re-fetch with page set to 1 and include the updated catalogue_page param.
      fetchProducts(
        key,
        activeBrand,
        undefined,
        searchTerm.trim() !== "" ? searchTerm : undefined,
        1,
        sortOrder
      );
    }
  }, [cataloguePage, sortOrder, activeBrand, searchTerm, fetchProducts]);

  // Get items data (ordered mix of groups and products) from backend
  const itemsData = useMemo(() => {
    const data = productsByBrandCategory[productsKey];
    if (groupByProductName && data && (data as any).items !== undefined) {
      return (data as any).items || [];
    }
    return null;
  }, [productsByBrandCategory, productsKey, groupByProductName]);

  const displayedProducts = useMemo(() => {
    // If we have ordered items from backend, extract only the products
    if (itemsData) {
      return itemsData
        .filter((item: any) => item.type === 'product')
        .map((item: any) => item.product);
    }

    const data = productsByBrandCategory[productsKey];
    return data || [];
  }, [productsByBrandCategory, productsKey, itemsData]);

  // Get grouped data - not used when we have itemsData
  const groupedData = useMemo((): GroupedProducts | null => {
    if (!groupByProductName) {
      return null;
    }

    // Fallback to frontend grouping (shouldn't be needed)
    return groupProductsByName(displayedProducts);
  }, [groupByProductName, displayedProducts]);

  const allCategoryCounts = useMemo(() => {
    const counts: { [category: string]: number } = {};
    Object.values(productCounts).forEach((brandCounts) => {
      Object.entries(brandCounts).forEach(([cat, count]) => {
        counts[cat] = (counts[cat] || 0) + count;
      });
    });
    return counts;
  }, [productCounts]);

  // Use Intersection Observer for better scroll performance (added after productsKey is defined)
  const intersectionRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: paginationState[productsKey]?.hasMore && !loadingMore,
    threshold: 0.5,
    rootMargin: '200px', // Start loading when 200px away from trigger
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, md: 3 },
        width: "100%",
        padding: { xs: 1, sm: 1.5, md: 1.5 },
        maxWidth: "100%",
        margin: "0",
        position: "relative",
      }}
    >
      {/* Reference for top of page */}
      <div ref={pageTopRef} />

      {/* Products Section */}
      <Box sx={{ flex: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={isMobile ? "column" : "row"}
          gap={isMobile ? "16px" : "8px"}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Add Products
          </Typography>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenConfirmModal} // Changed to open modal instead
              disabled={
                selectedProducts.length === 0 ||
                !["draft", "sent"].includes(
                  order?.status?.toLowerCase() as string
                )
              }
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "24px",
              }}
            >
              Clear Cart
            </Button>
          </Box>
          <Dialog
            open={confirmModalOpen}
            onClose={handleCloseConfirmModal}
            aria-labelledby="clear-cart-dialog-title"
            aria-describedby="clear-cart-dialog-description"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle id="clear-cart-dialog-title">Clear Cart</DialogTitle>
            <DialogContent>
              <DialogContentText id="clear-cart-dialog-description">
                Are you sure you want to clear all items from the cart? This
                action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={handleCloseConfirmModal}
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "24px",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearCart}
                variant="contained"
                color="error"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "24px",
                }}
                autoFocus
              >
                Clear Cart
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={(option: SearchResult | string) =>
            typeof option === "string" ? option : option.name
          }
          isOptionEqualToValue={(
            option: SearchResult | string,
            value: SearchResult | string
          ) =>
            typeof option === "string" && typeof value === "string"
              ? option === value
              : typeof option !== "string" &&
              typeof value !== "string" &&
              option._id === value._id
          }
          onInputChange={handleInputChange}
          value={query}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Tabs and Sorting Controls */}
        <Box display="flex" flexDirection={"column"} gap="8px" sx={{ mt: 2 }}>
          {!groupByCategory && (
            <>
              {isMobile || isTablet ? (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="brand-select-label">Brand</InputLabel>
                  <Select
                    labelId="brand-select-label"
                    id="brand-select"
                    value={activeBrand}
                    label="Brand"
                    disabled={searchTerm !== ""}
                    onChange={(e) => handleTabChange(e.target.value)}
                    renderValue={(selected) => {
                      const selectedBrand: any = brandList.find(
                        (b) => b.brand === selected
                      );
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {(selectedBrand?.image || selectedBrand?.url) && (
                            <Box
                              component="img"
                              src={selectedBrand.image || selectedBrand.url}
                              alt={selectedBrand.brand}
                              sx={{
                                width: 64,
                                height: 64,
                                objectFit: "contain",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                          <Typography variant="h6">
                            {selectedBrand?.brand}
                          </Typography>
                        </Box>
                      );
                    }}
                  >
                    {brandList.map((b: any) => {
                      const brandCount = productCounts[b.brand]
                        ? Object.values(productCounts[b.brand]).reduce(
                          (a, b) => a + b,
                          0
                        )
                        : 0;
                      return (
                        <MenuItem key={b.brand} value={b.brand}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1.5}
                            width="100%"
                          >
                            {(b.image || b.url) && (
                              <Image
                                src={b.image || b.url}
                                alt={b.brand}
                                width={80}
                                height={80}
                                style={{
                                  objectFit: "contain",
                                  borderRadius: "6px",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Box display="flex" flexDirection="column" flex={1}>
                              <Typography variant="h6" fontWeight="medium">
                                {b.brand}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {brandCount} products
                              </Typography>
                            </Box>
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
                      activeBrand || (brandList[0] ? brandList[0].brand : "")
                    }
                    onChange={(e, newValue) => handleTabChange(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mt: 2,
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: "bold",
                        padding: "12px 20px",
                        minHeight: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          transform: "translateY(-2px)",
                        },
                      },
                      ".Mui-selected": {
                        color: "primary.main",
                        "& .brand-image": {
                          border: "2px solid",
                          borderColor: "primary.main",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        },
                      },
                    }}
                  >
                    {brandList.map((b: any) => {
                      // Calculate brand count for all brands including "New Arrivals"
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
                          label={
                            <Box
                              display="flex"
                              flexDirection="column"
                              alignItems="center"
                              gap={1}
                            >
                              {(b.image || b.url) && (
                                <Image
                                  src={b.image || b.url}
                                  alt={b.brand}
                                  className="brand-image"
                                  width={80}
                                  height={80}
                                  style={{
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    border: "2px solid transparent",
                                    transition: "all 0.2s ease-in-out",
                                    backgroundColor: "background.paper",
                                    padding: "4px",
                                  }}
                                />
                              )}
                              <Box textAlign="center">
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {b.brand}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                    display: "block",
                                    mt: 0.5,
                                  }}
                                >
                                  ({brandCount})
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      );
                    })}
                  </Tabs>
                )
              )}
            </>
          )}
          {/* Category Controls */}
          {sortOrder !== "catalogue" && (
            <Box>
              {isMobile || isTablet ? (
                groupByCategory ? (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      id="category-select"
                      value={activeCategory}
                      label="Category"
                      disabled={searchTerm !== ""}
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
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      id="category-select"
                      value={activeCategory}
                      label="Category"
                      disabled={searchTerm !== ""}
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
              ) : groupByCategory ? (
                <Tabs
                  value={activeCategory || allCategories[0] || ""}
                  onChange={(e, newValue) => handleCategoryTabChange(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    mt: 2,
                    ".MuiTab-root": {
                      textTransform: "none",
                      fontWeight: "bold",
                      padding: "10px 20px",
                    },
                    ".Mui-selected": { color: "primary.main" },
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
                      activeCategory || categoriesByBrand[activeBrand][0] || ""
                    }
                    onChange={(e, newValue) =>
                      handleCategoryTabChange(newValue)
                    }
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mt: 2,
                      mb: 2,
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: "bold",
                        padding: "8px 16px",
                      },
                      ".Mui-selected": { color: "primary.main" },
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
          )}
          {isMobile || isTablet ? (
            <Box
              sx={{
                mt: 2,
                mb: 2,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortOrder}
                  label="Sort By"
                  onChange={handleSortChange}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="catalogue">Catalogue Order</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
              {sortOrder === "catalogue" && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={catalogueEnabled}
                        onChange={(e: any) => {
                          const value = e.target.checked;
                          setCatalogueEnabled(value);
                          if (!value) {
                            setCataloguePage(undefined);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label="Enable Catalogue Page Input"
                  />
                  {catalogueEnabled && (
                    <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                      <Autocomplete
                        freeSolo
                        options={cataloguePages.map((page: any) =>
                          page.toString()
                        )}
                        value={
                          cataloguePage !== undefined
                            ? cataloguePage.toString()
                            : ""
                        }
                        onChange={(event, newValue: any) => {
                          if (newValue && newValue.trim() !== "") {
                            setCataloguePage(parseInt(newValue));
                          } else {
                            setCataloguePage(undefined);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Catalogue Page" />
                        )}
                      />
                    </FormControl>
                  )}
                </>
              )}
            </Box>
          ) : (
            !searchTerm.trim() &&
            activeBrand &&
            (categoriesByBrand[activeBrand] || []).length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  mb: 2,
                  flexDirection: "row",
                  display: "flex",
                  gap: "24px",
                  alignItems: "flex-start",
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="sort-select-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    id="sort-select"
                    value={sortOrder}
                    label="Sort By"
                    onChange={handleSortChange}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="catalogue">Catalogue Order</MenuItem>
                    <MenuItem value="price_asc">Price: Low to High</MenuItem>
                    <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  </Select>
                </FormControl>

                {sortOrder === "catalogue" && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={catalogueEnabled}
                          onChange={(e: any) => {
                            const value = e.target.checked;
                            setCatalogueEnabled(value);
                            if (!value) {
                              setCataloguePage(undefined);
                            }
                          }}
                          color="primary"
                        />
                      }
                      label="Enable Catalogue Page Input"
                    />
                    {catalogueEnabled && (
                      <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                        <Autocomplete
                          freeSolo
                          options={cataloguePages.map((page: any) =>
                            page.toString()
                          )}
                          value={
                            cataloguePage !== undefined
                              ? cataloguePage.toString()
                              : ""
                          }
                          onChange={(event, newValue: any) => {
                            if (newValue && newValue.trim() !== "") {
                              setCataloguePage(parseInt(newValue));
                            } else {
                              setCataloguePage(undefined);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Catalogue Page" />
                          )}
                        />
                      </FormControl>
                    )}
                  </>
                )}
              </Box>
            )
          )}
          {sortOrder !== "catalogue" && (
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={groupByCategory}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setGroupByCategory(newValue);
                      if (!newValue) {
                        const defaultBrand = brandList[0]?.brand || "";
                        const defaultCategory =
                          categoriesByBrand[defaultBrand]?.[0] || "";
                        setActiveBrand(defaultBrand);
                        setActiveCategory(defaultCategory);
                        resetPaginationAndFetch(defaultBrand, defaultCategory);
                      }
                    }}
                    color="primary"
                  />
                }
                label="Group by Category"
              />
            </Box>
          )}
        </Box>

        {/* Products Display */}
        {isMobile || isTablet ? (
          <Box>
            {loading ? (
              // Loading skeletons for mobile/tablet
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 2,
                  width: '100%',
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} variant="card" />
                ))}
              </Box>
            ) : groupByProductName && itemsData ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 2,
                  width: '100%',
                  alignItems: 'stretch',
                }}
              >
                {/* Render items in exact order from backend */}
                {itemsData.map((item: any, index: number) => {
                  if (item.type === 'group') {
                    return (
                      <ProductGroupCard
                        key={item.groupId}
                        baseName={item.baseName}
                        products={item.products}
                        primaryProduct={item.primaryProduct}
                        selectedProducts={selectedProducts}
                        temporaryQuantities={temporaryQuantities}
                        specialMargins={specialMargins}
                        customerMargin={customer?.cf_margin || "40%"}
                        orderStatus={order?.status}
                        getSellingPrice={getSellingPrice}
                        handleImageClick={handleImageClick}
                        handleQuantityChange={handleQuantityChange}
                        handleAddOrRemove={(prod: any) =>
                          selectedProducts.some((p) => p._id === prod._id)
                            ? handleRemoveProduct(prod._id)
                            : handleAddProducts(prod)
                        }
                        index={index}
                        isShared={isShared}
                      />
                    );
                  } else {
                    // item.type === 'product'
                    return (
                      <ProductCard
                        key={item.product._id}
                        product={item.product}
                        selectedProducts={selectedProducts}
                        temporaryQuantities={temporaryQuantities}
                        specialMargins={specialMargins}
                        customerMargin={customer?.cf_margin || "40%"}
                        orderStatus={order?.status}
                        getSellingPrice={getSellingPrice}
                        handleImageClick={handleImageClick}
                        handleQuantityChange={handleQuantityChange}
                        handleAddOrRemove={(prod: any) =>
                          selectedProducts.some((p) => p._id === prod._id)
                            ? handleRemoveProduct(prod._id)
                            : handleAddProducts(prod)
                        }
                        index={index}
                        isShared={isShared}
                      />
                    );
                  }
                })}
              </Box>
            ) : displayedProducts.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 2,
                  width: '100%',
                  alignItems: 'stretch',
                }}
              >
                {displayedProducts.map((product: any, index: number) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    selectedProducts={selectedProducts}
                    temporaryQuantities={temporaryQuantities}
                    specialMargins={specialMargins}
                    customerMargin={customer?.cf_margin || "40%"}
                    orderStatus={order?.status}
                    getSellingPrice={getSellingPrice}
                    handleImageClick={handleImageClick}
                    handleQuantityChange={handleQuantityChange}
                    handleAddOrRemove={(prod: any) =>
                      selectedProducts.some((p) => p._id === prod._id)
                        ? handleRemoveProduct(prod._id)
                        : handleAddProducts(prod)
                    }
                    index={index}
                    isShared={isShared}
                  />
                ))}
              </Box>
            ) : (
              <Box mt={2}>
                <Typography variant="body1" align="center">
                  {loading
                    ? "Loading products..."
                    : sortOrder === "catalogue" && cataloguePage !== ""
                      ? "No products found on this catalogue page"
                      : "No products found."}
                </Typography>
              </Box>
            )}
            {loadingMore && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 2,
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading more products...
                </Typography>
              </Box>
            )}
            {!loadingMore && noMoreProducts[productsKey] && (
              <Box mt={2}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center"
                >
                  No more products for{" "}
                  {searchTerm
                    ? searchTerm
                    : groupByCategory
                      ? activeCategory
                      : activeBrand}{" "}
                  {searchTerm ? "" : activeCategory}.
                </Typography>
              </Box>
            )}
            {/* Intersection Observer target for infinite scroll */}
            <div ref={intersectionRef} style={{ height: '20px', margin: '20px 0' }} />
          </Box>
        ) : isMobile ? (
          <DoubleScrollTable ref={tableScrollRef} tableWidth={3200}>
            <Box sx={{ minWidth: "3200px", width: "3200px" }}>
              <Table stickyHeader sx={{ width: "100%", tableLayout: "auto" }}>
                <TableHead>
                  <TableRow
                    sx={{
                      '& .MuiTableCell-root': {
                        borderBottom: '2px solid',
                        borderBottomColor: 'primary.main',
                      },
                    }}
                  >
                    {COLUMNS.map((header) => (
                      <TableCell
                        key={header}
                        ref={header === "UPC/EAN Code" ? upcHeaderRef : undefined}
                        sx={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1000,
                          backgroundColor: "background.paper",
                          minWidth:
                            header === "Name"
                              ? 300
                              : header === "Sub Category" || header === "Series"
                                ? 220
                                : header === "Image"
                                  ? 150
                                  : header === "SKU" || header === "UPC/EAN Code"
                                    ? 180
                                    : header === "MRP" || header === "Selling Price" || header === "Total"
                                      ? 150
                                      : header === "Quantity"
                                        ? 180
                                        : 140,
                          fontWeight: "bold",
                          fontSize: "0.95rem",
                          whiteSpace: "nowrap",
                          color: "text.primary",
                          paddingY: 2,
                          paddingX: 2.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
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
                      {displayedProducts.map((product: any) => (
                        <ProductRow
                          key={product._id}
                          product={product}
                          selectedProducts={selectedProducts}
                          temporaryQuantities={temporaryQuantities}
                          specialMargins={specialMargins}
                          customerMargin={customer?.cf_margin || "40%"}
                          orderStatus={order?.status}
                          getSellingPrice={getSellingPrice}
                          handleImageClick={handleImageClick}
                          handleQuantityChange={handleQuantityChange}
                          handleAddOrRemove={(prod: any) =>
                            selectedProducts.some((p) => p._id === prod._id)
                              ? handleRemoveProduct(prod._id)
                              : handleAddProducts(prod)
                          }
                          isShared={isShared}
                          showUPC={showUPC}
                        />
                      ))}
                      {!loadingMore && noMoreProducts[productsKey] && (
                        <TableRow>
                          <TableCell colSpan={COLUMNS.length} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No more products for{" "}
                              {searchTerm
                                ? searchTerm
                                : groupByCategory
                                  ? activeCategory
                                  : activeBrand}{" "}
                              {searchTerm ? "" : activeCategory}.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={COLUMNS.length} align="center">
                        <Typography variant="body1">
                          {loading ? "Loading products..." : "No products found."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {loadingMore && (
                    <TableRow>
                      <TableCell colSpan={COLUMNS.length} align="center">
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: 2,
                          }}
                        >
                          <CircularProgress color="primary" />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Loading more products...
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </DoubleScrollTable>
        ) : (
          // Desktop Card Grid View
          <Box ref={cardScrollRef}>
            {loading ? (
              // Loading skeletons for desktop
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                  width: '100%',
                  maxWidth: '100%',
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} variant="card" />
                ))}
              </Box>
            ) : groupByProductName && itemsData ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                  width: '100%',
                  maxWidth: '100%',
                  alignItems: 'stretch',
                }}
              >
                {/* Render items in exact order from backend */}
                {itemsData.map((item: any, index: number) => {
                  if (item.type === 'group') {
                    return (
                      <ProductGroupCard
                        key={item.groupId}
                        baseName={item.baseName}
                        products={item.products}
                        primaryProduct={item.primaryProduct}
                        selectedProducts={selectedProducts}
                        temporaryQuantities={temporaryQuantities}
                        specialMargins={specialMargins}
                        customerMargin={customer?.cf_margin || "40%"}
                        orderStatus={order?.status}
                        getSellingPrice={getSellingPrice}
                        handleImageClick={handleImageClick}
                        handleQuantityChange={handleQuantityChange}
                        handleAddOrRemove={(prod: any) =>
                          selectedProducts.some((p) => p._id === prod._id)
                            ? handleRemoveProduct(prod._id)
                            : handleAddProducts(prod)
                        }
                        index={index}
                        isShared={isShared}
                      />
                    );
                  } else {
                    // item.type === 'product'
                    return (
                      <ProductCard
                        key={item.product._id}
                        product={item.product}
                        selectedProducts={selectedProducts}
                        temporaryQuantities={temporaryQuantities}
                        specialMargins={specialMargins}
                        customerMargin={customer?.cf_margin || "40%"}
                        orderStatus={order?.status}
                        getSellingPrice={getSellingPrice}
                        handleImageClick={handleImageClick}
                        handleQuantityChange={handleQuantityChange}
                        handleAddOrRemove={(prod: any) =>
                          selectedProducts.some((p) => p._id === prod._id)
                            ? handleRemoveProduct(prod._id)
                            : handleAddProducts(prod)
                        }
                        index={index}
                        isShared={isShared}
                      />
                    );
                  }
                })}
              </Box>
            ) : displayedProducts.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                  width: '100%',
                  maxWidth: '100%',
                  alignItems: 'stretch',
                }}
              >
                {displayedProducts.map((product: any) => (
                  <MemoizedDesktopProductCard
                    key={product._id}
                    product={product}
                    selectedProducts={selectedProducts}
                    temporaryQuantities={temporaryQuantities}
                    specialMargins={specialMargins}
                    customer={customer}
                    order={order}
                    getSellingPrice={getSellingPrice}
                    handleImageClick={handleImageClick}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveProduct={handleRemoveProduct}
                    handleAddProducts={handleAddProducts}
                    isShared={isShared}
                  />
                ))}
              </Box>
            ) : (
              <Box mt={2}>
                <Typography variant="body1" align="center">
                  {loading ? "Loading products..." : "No products found."}
                </Typography>
              </Box>
            )}
            {loadingMore && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 3,
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading more products...
                </Typography>
              </Box>
            )}
            {!loadingMore && noMoreProducts[productsKey] && (
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary" align="center">
                  No more products for{" "}
                  {searchTerm
                    ? searchTerm
                    : groupByCategory
                      ? activeCategory
                      : activeBrand}{" "}
                  {searchTerm ? "" : activeCategory}.
                </Typography>
              </Box>
            )}
            {/* Intersection Observer target for infinite scroll - Desktop */}
            <div ref={intersectionRef} style={{ height: '20px', margin: '20px 0' }} />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: theme.spacing(20), sm: theme.spacing(12), md: theme.spacing(16) },
          right: { xs: theme.spacing(1), sm: theme.spacing(3), md: theme.spacing(2) },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
        className='no-pdf'
      >
        <IconButton
          color='primary'
          onClick={scrollToTop}
          disabled={isScrollButtonDisabled}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            boxShadow: 6,
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
              opacity: 0.5,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: 'primary.dark',
              boxShadow: 8,
              transform: isMobile ? 'none' : 'scale3d(1.1, 1.1, 1) translate3d(0, -2px, 0)',
            },
            '&:active:not(:disabled)': {
              transform: isMobile ? 'none' : 'scale3d(0.95, 0.95, 1)',
            },
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          <ArrowUpward fontSize={isMobile ? 'medium' : 'large'} />
        </IconButton>

        <IconButton
          color='primary'
          onClick={scrollToBottom}
          disabled={isScrollButtonDisabled}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            boxShadow: 6,
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
              opacity: 0.5,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: 'primary.dark',
              boxShadow: 8,
              transform: isMobile ? 'none' : 'scale3d(1.1, 1.1, 1) translate3d(0, 2px, 0)',
            },
            '&:active:not(:disabled)': {
              transform: isMobile ? 'none' : 'scale3d(0.95, 0.95, 1)',
            },
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          <ArrowDownward fontSize={isMobile ? 'medium' : 'large'} />
        </IconButton>
      </Box>

      {/* Cart Icon */}
      <IconButton
        color="primary"
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: "fixed",
          bottom: { xs: theme.spacing(10), sm: theme.spacing(4), md: theme.spacing(3) },
          right: { xs: theme.spacing(1), sm: theme.spacing(3), md: theme.spacing(2) },
          backgroundColor: "background.paper",
          color: "primary.main",
          width: { xs: 56, sm: 64 },
          height: { xs: 56, sm: 64 },
          boxShadow: 6,
          "&:hover": {
            backgroundColor: "background.default",
            boxShadow: 8,
            transform: "scale3d(1.1, 1.1, 1)",
          },
          transition: "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
          willChange: 'transform',
          zIndex: 1000,
          pointerEvents: "auto",
        }}
      >
        <Badge
          badgeContent={selectedProducts.length}
          color="error"
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              height: { xs: 18, sm: 20 },
              minWidth: { xs: 18, sm: 20 },
              padding: { xs: "0 4px", sm: "0 6px" },
              fontWeight: 700,
            }
          }}
        >
          <ShoppingCartIcon fontSize="large" />
        </Badge>
      </IconButton>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        selectedProducts={selectedProducts}
        getSellingPrice={getSellingPrice}
        handleImageClick={handleImageClick}
        handleQuantityChange={handleQuantityChange}
        handleRemoveProduct={handleRemoveProduct}
        totals={totals}
        onCheckout={() => {
          setCartDrawerOpen(false);
          onCheckout();
        }}
        orderStatus={order?.status}
        customer={customer}
        isMobile={isMobile}
        handleClearCart={handleClearCart}
        order={order}
      />

      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSources={popupImageSrc}
        initialSlide={popupImageIndex}
        setIndex={(newIndex: number) => {
          setPopupImageIndex(newIndex);
        }}
      />

      {/* Reference for bottom of page */}
      <div ref={pageBottomRef} />
    </Box>
  );
};

export default memo(Products);
