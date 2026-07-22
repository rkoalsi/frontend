// Products.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  startTransition,
  useContext,
} from "react";
import axios from "axios";
import { useProducts, useBrands, useCategories, useAllCategories, useProductCounts } from "../../hooks/useProducts";
import { ProductCardSkeleton, ProductGroupCardSkeleton } from "../common/ProductCardSkeleton";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import {
  TextField,
  Autocomplete,
  CircularProgress,
  InputAdornment,
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
  Tooltip,
  Fade,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  Sort,
  AddShoppingCart,
  RemoveShoppingCart,
  Search as SearchIcon,
  ShoppingCartCheckout as ShoppingCartCheckoutIcon,
} from "@mui/icons-material";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import ProductCard from "./products/ProductCard";
import ProductGroupCard from "./products/ProductGroupCard";
import CartDrawer from "./products/Cart";
import ImagePopupDialog from "../common/ImagePopUp";
import Image from "next/image";
import ImageCarousel from "./products/ImageCarousel";
import QuantitySelector from "./QuantitySelector";
import ScrollTriangleButtons from "../common/ScrollTriangleButtons";
import { groupProductsByName, ProductGroup, GroupedProducts, getPackStep } from "../../util/groupProducts";
import { getEffectiveMarginPct } from "../../util/margin";
import { getTaxPercentage } from "../../util/tax";
import AuthContext from "../Auth";

// The "Clearance" brand is an internal routing/counts key (see backend
// /products counts). It is surfaced to users as "Special Offers".
const SPECIAL_OFFERS_ICON = "https://assets.pupscribe.in/assets/special_offers.png";
const brandDisplayName = (brand?: string) =>
  brand === "Clearance" ? "Special Offers" : brand;

// ── Stale-while-revalidate cache for the default catalogue init payload ──
// Brands/counts/categories/first-page-of-New-Arrivals change rarely, so we
// persist the last /products/catalogue/init response and paint from it
// instantly on the next load while revalidating in the background. This is the
// big perceived-speed win for repeat visits on slow networks.
const CATALOGUE_INIT_CACHE_KEY = "of_catalogue_init_v1";
const CATALOGUE_INIT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const readCatalogueInitCache = (): any | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOGUE_INIT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CATALOGUE_INIT_CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCatalogueInitCache = (data: any): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CATALOGUE_INIT_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    /* quota / private-mode — cache is best-effort */
  }
};

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
  pre_order?: boolean;
  clearance?: boolean;
  clearance_margin?: number;
  upcoming_stock?: number;
  inward_date?: string;
  eta_port_date?: string;
  quantity?: number;
  pre_order_quantity?: number;
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
  isShared,
  isPreOrderTab,
}: any) => {
  const productId = product._id;
  const packStep = getPackStep(product.name);
  const selectedProduct: any = selectedProducts.find((p: any) => p._id === productId);
  const splitProdDesktop = product.pre_order === true && (product.stock ?? 0) > 0;
  const isPreOrderCartDesktop = isPreOrderTab && splitProdDesktop;
  const showAsPreOrderLabelDesktop = isPreOrderTab && product.pre_order === true;
  // Hide the Sale / Special Offer chip inside the Pre Orders tab only.
  const showSaleChipDesktop = product.clearance && !isPreOrderTab;
  // Admin/internal-only logistics dates for pre-order products
  const fmtDate = (v?: string) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const preOrderDatesDesktop = (!isShared && product.pre_order && (product.inward_date || product.eta_port_date)) ? (
    <>
      {product.eta_port_date && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">ETA Port:</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{fmtDate(product.eta_port_date)}</Typography>
        </Box>
      )}
      {product.inward_date && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Inward:</Typography>
          <Typography variant="caption" color="warning.main" fontWeight={700}>{fmtDate(product.inward_date)}</Typography>
        </Box>
      )}
    </>
  ) : null;
  const quantity: any = isPreOrderCartDesktop
    ? (selectedProduct?.pre_order_quantity || temporaryQuantities[`${productId}-pre`] || "")
    : (selectedProduct?.quantity || temporaryQuantities[productId] || "");
  const isInCartDesktop = isPreOrderCartDesktop
    ? (selectedProduct?.pre_order_quantity ?? 0) > 0
    : !!selectedProduct && (selectedProduct?.quantity ?? 0) > 0;
  const sellingPrice = getSellingPrice(product);
  const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
  const isQuantityExceedingStock = !isPreOrderCartDesktop && (product.stock ?? 0) > 0 && quantity > product.stock;
  const isDisabled = ['accepted', 'declined', 'invoiced'].includes(
    order?.status?.toLowerCase()
  );

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
          {product.pre_order && (
            <Chip
              label="Pre Order"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: 'white',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.warning.main : theme.palette.warning.dark,
                animation: 'preOrderPulse 1.8s ease-in-out infinite',
                '@keyframes preOrderPulse': {
                  '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,167,38,0.55)' },
                  '50%': { boxShadow: '0 0 10px 3px rgba(255,167,38,0.85)' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            />
          )}
          {showSaleChipDesktop && (
            <Chip
              label={(product.clearance_margin ?? 0) > 0 ? `Sale +${product.clearance_margin}%` : 'Sale'}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: 'error.main',
                color: 'white',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          )}
          {product.new && (
            <Chip
              label="New Arrivals"
              size="small"
              sx={{
                position: 'absolute',
                top: showSaleChipDesktop ? 44 : 8,
                right: 8,
                zIndex: 1,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: 'background.paper' as any,
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

            {!isShared && (splitProdDesktop && !isPreOrderTab ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Stock:</Typography>
                  <Chip
                    label={product.stock}
                    size="small"
                    color={product.stock > 10 ? 'success' : 'error'}
                    variant={product.stock > 10 ? 'filled' : 'outlined'}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Upcoming:</Typography>
                  <Chip label={product.upcoming_stock ?? '—'} size="small" color="warning" variant="outlined" />
                </Box>
                {preOrderDatesDesktop}
              </>
            ) : (
              <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {(isPreOrderTab || (product.pre_order && !product.stock)) ? 'Upcoming:' : 'Stock:'}
                </Typography>
                {(isPreOrderTab || (product.pre_order && !product.stock)) ? (
                  <Chip
                    label={product.upcoming_stock ?? '—'}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    label={product.stock}
                    size="small"
                    color={product.stock > 10 ? 'success' : 'error'}
                    variant={product.stock > 10 ? 'filled' : 'outlined'}
                  />
                )}
              </Box>
              {(isPreOrderTab || (product.pre_order && !product.stock)) && preOrderDatesDesktop}
              </>
            ))}

            {!isShared && (() => {
              const baseMarginStr = specialMargins[productId] || customer?.cf_margin || "40%";
              const basePct = parseInt(String(baseMarginStr).replace('%', ''), 10) || 40;
              const totalPct = getEffectiveMarginPct(baseMarginStr, product);
              const hasClearance = product.clearance && totalPct > basePct;
              return (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Margin:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {hasClearance && (
                      <Typography variant="caption" color="text.secondary">
                        {basePct}% + {totalPct - basePct}% sale =
                      </Typography>
                    )}
                    <Chip
                      label={`${totalPct}%`}
                      size="small"
                      color={hasClearance ? "error" : "warning"}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Box>
              );
            })()}

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
                {getTaxPercentage(product)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
          <Box sx={{ mb: 2 }}>
            <QuantitySelector
              quantity={quantity}
              max={isPreOrderCartDesktop ? (product.upcoming_stock || Infinity) : (product.pre_order && (product.stock ?? 0) <= 0 ? (product.upcoming_stock || Infinity) : product.stock)}
              step={packStep}
              onChange={(newQuantity: number) => handleQuantityChange(productId, newQuantity, isPreOrderCartDesktop)}
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
            variant={isInCartDesktop ? "outlined" : "contained"}
            color={isInCartDesktop ? "error" : "primary"}
            disabled={isDisabled}
            onClick={() => {
              if (isInCartDesktop) {
                handleRemoveProduct(productId, isPreOrderCartDesktop);
              } else {
                handleAddProducts(product, isPreOrderCartDesktop);
              }
            }}
            startIcon={isInCartDesktop ? <RemoveShoppingCart /> : <AddShoppingCart />}
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
            {isInCartDesktop
              ? (showAsPreOrderLabelDesktop ? "Remove Pre-Order" : "Remove from Cart")
              : (showAsPreOrderLabelDesktop ? "Add as Pre-Order" : "Add to Cart")}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}, (prevProps, nextProps) => {
  if (prevProps.product._id !== nextProps.product._id) return false;
  if (prevProps.isPreOrderTab !== nextProps.isPreOrderTab) return false;
  if (prevProps.order?.status !== nextProps.order?.status) return false;
  if (prevProps.temporaryQuantities[prevProps.product._id] !== nextProps.temporaryQuantities[nextProps.product._id]) return false;
  if (prevProps.temporaryQuantities[`${prevProps.product._id}-pre`] !== nextProps.temporaryQuantities[`${nextProps.product._id}-pre`]) return false;
  if (prevProps.specialMargins[prevProps.product._id] !== nextProps.specialMargins[nextProps.product._id]) return false;
  const prevSel = prevProps.selectedProducts.find((p: any) => p._id === prevProps.product._id);
  const nextSel = nextProps.selectedProducts.find((p: any) => p._id === nextProps.product._id);
  if ((prevSel?.quantity ?? 0) !== (nextSel?.quantity ?? 0)) return false;
  if ((prevSel?.pre_order_quantity ?? 0) !== (nextSel?.pre_order_quantity ?? 0)) return false;
  return true;
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
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const { user }: any = useContext(AuthContext);
  // ------------------ States ------------------
  const getUrlParam = (key: string) => {
    if (typeof window === "undefined") return "";
    const urlParams = new URLSearchParams(window.location.search);
    // When a shared link has a search param, ignore brand/category from URL
    if ((key === "brand" || key === "category") &&
      urlParams.get("shared") === "true" &&
      urlParams.get("search")) {
      return "";
    }
    const val = urlParams.get(key) || "";
    if (key === "search") {
      // Normalize whitespace for search terms (avoids double-space issues from URL encoding)
      return val.replace(/\s+/g, " ").trim();
    }
    return val.replace(/-/g, " ");
  };
  const [query, setQuery] = useState<string>(() =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("search") || "").replace(/\s+/g, " ").trim()
      : ""
  );
  const [temporaryQuantities, setTemporaryQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex]: any = useState(0);
  const [options, setOptions] = useState<SearchResult[]>([]);
  // Lookup of every rendered product by id so handleQuantityChange can auto-add
  // an item to the cart the moment a quantity is entered (no separate "Add" click).
  const productLookupRef = useRef<Map<string, any>>(new Map());
  // Guards against the live-commit auto-add (fired on blur) and the "Add to
  // Cart" button click racing within the same tap gesture off stale closures —
  // without this the trailing click re-runs handleAddProducts on a stale cart
  // and overwrites the typed quantity back to the pack default (e.g. 1).
  const recentAddRef = useRef<Record<string, number>>({});
  const RECENT_ADD_MS = 900;
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { page: number; hasMore: boolean };
  }>({});
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(() => getUrlParam("search"));
  const [activeBrand, setActiveBrand] = useState<string>(() => getUrlParam("brand"));
  const [activeCategory, setActiveCategory] = useState<string>(() => getUrlParam("category"));
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
  const [brandList, setBrandList] = useState<{ brand: string; url: string | null }[]>(
    []
  );
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [cataloguePage, setCataloguePage]: any = useState();
  const [cataloguePages, setCataloguePages] = useState([]);
  const [catalogueEnabled, setCatalogueEnabled] = useState<boolean>(false);
  const [groupByProductName, setGroupByProductName] = useState<boolean>(true);

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<SearchResult[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [loadingOutOfStock, setLoadingOutOfStock] = useState<boolean>(false);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const [outOfStockQuantities, setOutOfStockQuantities] = useState<Record<string, number>>({});

  const [link, setLink] = useState(
    order?.spreadsheet_created ? order?.spreadsheet_url : ""
  );
  const isFetching = useRef<{ [key: string]: boolean }>({});
  // One-time marker: the productsKey that catalogue/init already seeded, so the
  // trigger effect can skip the immediate redundant refetch of that view.
  const initSeededKeyRef = useRef<string | null>(null);
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
      } else if (order?.customer_margin) {
        // Customer margin embedded on the order by the backend — used by
        // unauthenticated shared-link visitors (no customer object)
        marginPercent = parseInt(String(order.customer_margin).replace("%", ""));
      } else if ((product as any).margin) {
        // Margin stored on the order line when added — last-resort fallback
        marginPercent = parseInt(String((product as any).margin).replace("%", ""));
      }
      if (isNaN(marginPercent)) marginPercent = 40;
      // Clearance items add their bonus margin on top of the base margin.
      const effectivePercent = getEffectiveMarginPct(marginPercent, product);
      const margin = effectivePercent / 100;
      return parseFloat((product.rate - product.rate * margin).toFixed(2));
    },
    [specialMargins, customer?.cf_margin, order?.customer_margin]
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

        // Handle "New Arrivals", "Pre Orders" and "Clearance" brands specially
        const isSpecialBrand = brand === "New Arrivals" || brand === "Pre Orders" || brand === "Clearance";
        const brandParam = isSpecialBrand ? undefined : brand;
        const categoryParam = (isSpecialBrand || category === "All Products") ? undefined : category;
        const newOnly = brand === "New Arrivals" ? true : undefined;
        const preOrder = brand === "Pre Orders" ? true : undefined;
        const clearance = brand === "Clearance" ? true : undefined;

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
            new_only: newOnly,
            pre_order: preOrder,
            clearance: clearance,
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

  const fetchOutOfStockProducts = useCallback(async () => {
    try {
      setLoadingOutOfStock(true);

      // Handle "New Arrivals", "Pre Orders" and "Clearance" brands specially - don't pass brand parameter
      const isSpecialBrand = activeBrand === "New Arrivals" || activeBrand === "Pre Orders" || activeBrand === "Clearance";
      const brandParam = isSpecialBrand ? undefined : activeBrand;
      const categoryParam = (isSpecialBrand || activeCategory === "All Products") ? undefined : activeCategory;
      const preOrder = activeBrand === "Pre Orders" ? true : undefined;

      const response = await axios.get(`${process.env.api_url}/products/out-of-stock`, {
        params: {
          brand: brandParam,
          category: categoryParam,
          group_by_name: true,
          pre_order: preOrder,
        },
      });

      // Handle grouped response (items) or legacy flat response (products)
      if (response.data.items) {
        setOutOfStockItems(response.data.items);
        // Also extract flat list for backward compatibility
        const flatProducts: SearchResult[] = [];
        response.data.items.forEach((item: any) => {
          if (item.type === 'group') {
            flatProducts.push(...item.products);
          } else {
            flatProducts.push(item.product);
          }
        });
        setOutOfStockProducts(flatProducts);
      } else {
        setOutOfStockProducts(response.data.products || []);
        setOutOfStockItems([]);
      }
    } catch (error) {
      showError("Failed to fetch out of stock products.");
    } finally {
      setLoadingOutOfStock(false);
    }
  }, [activeBrand, activeCategory, showError]);

  const handleOutOfStockQuantityChange = useCallback((productId: string, qty: number) => {
    setOutOfStockQuantities(prev => ({ ...prev, [productId]: qty }));
  }, []);

  const handleNotifyMe = useCallback(async (productId: string, productName: string) => {
    try {
      const quantity = outOfStockQuantities[productId] || 1;
      await axios.post(`${process.env.api_url}/products/notify-me`, {
        product_id: productId,
        customer_id: customer?._id || customer?.id,
        order_id: order?._id || order?.id,
        quantity,
      });
      debouncedSuccess(`Pre-order for ${quantity} unit(s) of ${productName} placed successfully.`);
    } catch (error) {
      showError("Failed to place pre-order.");
    }
  }, [customer, order, outOfStockQuantities, debouncedSuccess, showError]);

  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/products/brands`
      );
      const allBrands: { brand: string; url: string | null }[] =
        response.data.brands || [];

      // Add "New Arrivals", "Pre Orders" and "Clearance" as the first brands.
      // Pre Orders / Clearance are filtered out by filteredBrandList when empty.
      const newArrivalsBrand = {
        brand: "New Arrivals",
        url: "https://assets.pupscribe.in/brands/new-arrivals.svg"
      };
      const preOrdersBrand = {
        brand: "Pre Orders",
        url: null
      };
      const clearanceBrand = {
        brand: "Clearance",
        url: null
      };
      const brandsWithNewArrivals = [newArrivalsBrand, preOrdersBrand, clearanceBrand, ...allBrands];

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
        // Handle "New Arrivals", "Pre Orders" and "Clearance" brands specially — no category sub-navigation
        if (brand === "New Arrivals" || brand === "Pre Orders" || brand === "Clearance") {
          const categories = ["All Products"];
          setCategoriesByBrand((prev) => ({
            ...prev,
            [brand]: categories,
          }));

          const defaultCategory = categories[0];
          if (!activeCategory && defaultCategory) {
            setActiveCategory(defaultCategory);
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

  // Seed component state from a /products/catalogue/init payload for the default
  // (New Arrivals) landing view. Used both for the SWR cache paint and the live
  // network response. Only handles the New Arrivals default — for that view the
  // init endpoint's category=None / grouped items map exactly to the
  // "New Arrivals-All Products" key, so we can seed products with no mismatch.
  const applyNewArrivalsInit = useCallback((data: any) => {
    const allBrands: { brand: string; url: string | null }[] = (data.brands || []).map(
      (b: any) => ({ brand: b.brand, url: b.image ?? b.url ?? null })
    );
    const newArrivalsBrand = {
      brand: "New Arrivals",
      url: "https://assets.pupscribe.in/brands/new-arrivals.svg",
    };
    const preOrdersBrand = { brand: "Pre Orders", url: null };
    const clearanceBrand = { brand: "Clearance", url: null };
    const brandsWithNewArrivals = [newArrivalsBrand, preOrdersBrand, clearanceBrand, ...allBrands];

    setBrandList(brandsWithNewArrivals);
    if (data.counts) setProductCounts(data.counts);
    setActiveBrand((prev) => prev || "New Arrivals");
    setActiveCategory((prev) => prev || "All Products");
    setCategoriesByBrand((prev) => ({ ...prev, "New Arrivals": ["All Products"] }));

    const items = data.items || [];
    const key = "New Arrivals-All Products";
    setProductsByBrandCategory((prev: any) =>
      brandsWithNewArrivals.reduce(
        (acc: any, b) => ({ ...acc, [b.brand]: prev[b.brand] ?? [] }),
        { ...prev, [key]: { items } }
      )
    );
    setPaginationState((prev) => ({
      ...prev,
      [key]: { page: 1, hasMore: items.length >= 200 },
    }));
    // Tell the trigger effect this key is already loaded — skip the immediate refetch.
    initSeededKeyRef.current = key;
  }, []);

  // Combined initial load: one request for brands + counts + categories +
  // first page of products, replacing the brands→categories→products waterfall.
  // Only used for the default landing (no URL brand/search); any preselected
  // brand/search falls back to the original independent fetches so their
  // (different) default-category logic is untouched.
  const fetchCatalogueInit = useCallback(async () => {
    const urlBrand = getUrlParam("brand");
    const urlSearch = getUrlParam("search");
    if (urlBrand || urlSearch) {
      fetchAllBrands();
      fetchProductCounts();
      return;
    }
    try {
      setLoading(true);
      // Paint instantly from cache (stale-while-revalidate).
      const cached = readCatalogueInitCache();
      if (cached) applyNewArrivalsInit(cached);
      const response = await axios.get(
        `${process.env.api_url}/products/catalogue/init`,
        { params: { brand: "New Arrivals" } }
      );
      writeCatalogueInitCache(response.data);
      applyNewArrivalsInit(response.data);
    } catch (error) {
      // Fall back to the original independent calls on failure.
      fetchAllBrands();
      fetchProductCounts();
    } finally {
      setLoading(false);
    }
  }, [applyNewArrivalsInit, fetchAllBrands, fetchProductCounts]);



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
          setOptions([]);
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
          setOptions([]);
        }
      }
    }, 300),
    [
      activeBrand,
      activeCategory,
      groupByCategory,
      fetchProducts,
      brandList,
      categoriesByBrand,
      allCategories,
    ]
  );

  const handleInputChange = useCallback(
    (event: any, value: string) => {
      setQuery(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  // A "split product" has pre_order=true but also has physical stock.
  // It can be ordered both ways: stock units (quantity) and pre-order units (pre_order_quantity).
  const isSplitProduct = (p: any) => p.pre_order === true && (p.stock ?? 0) > 0;

  const handleAddProducts = useCallback(
    (product: any, isPreOrder = false, explicitQty?: number) => {
      if (!product) return;
      const productId = product._id;
      const packStep = getPackStep(product.name);
      const splitProd = isSplitProduct(product);

      if (isPreOrder && splitProd) {
        // Adding the pre-order portion for a split product
        const existing = selectedProducts.find((p) => p._id === productId);
        // A button click with no explicit qty landing right after a live-commit
        // auto-add is the tail of one gesture — ignore it so it can't clobber
        // the just-typed quantity with a stale closure.
        if (!explicitQty && Date.now() - (recentAddRef.current[`${productId}-pre`] || 0) < RECENT_ADD_MS) {
          return;
        }
        if (existing && (existing.pre_order_quantity ?? 0) > 0) {
          debouncedWarn(`${product.name} pre-order is already in the cart.`);
          return;
        }
        recentAddRef.current[`${productId}-pre`] = Date.now();
        const qty = (explicitQty && explicitQty > 0 ? explicitQty : 0) || temporaryQuantities[`${productId}-pre`] || packStep;
        startTransition(() => {
          if (existing) {
            setSelectedProducts(selectedProducts.map((p) =>
              p._id === productId ? { ...p, pre_order_quantity: qty } : p
            ));
          } else {
            const isSharedParam = new URLSearchParams(window.location.search).has("shared");
            setSelectedProducts([...selectedProducts, {
              ...product,
              margin: specialMargins[productId] || customer?.cf_margin || order?.customer_margin || "40%",
              quantity: 0,
              pre_order_quantity: qty,
              added_by: isSharedParam ? "customer" : user?.role || 'sales_person',
            }]);
            setOptions((prev) => Array.isArray(prev) ? prev.filter((o) => o._id !== productId) : []);
          }
          setTemporaryQuantities((prev) => {
            const next = { ...prev };
            delete next[`${productId}-pre`];
            return next;
          });
        });
        requestAnimationFrame(() => {
          debouncedSuccess(`Added ${product.name} (x${qty}) as pre-order to cart.`);
        });
        return;
      }

      // Normal (in-stock) add
      const existing = selectedProducts.find((p) => p._id === productId);
      // Same-gesture guard: a no-explicit-qty click trailing a live-commit
      // auto-add would otherwise re-add on a stale cart and reset the quantity.
      if (!explicitQty && Date.now() - (recentAddRef.current[productId] || 0) < RECENT_ADD_MS) {
        return;
      }
      if (existing && ((existing.quantity ?? 0) > 0 || !splitProd)) {
        debouncedWarn(`${product.name} is already in the cart.`);
        return;
      }
      recentAddRef.current[productId] = Date.now();
      const quantity = (explicitQty && explicitQty > 0 ? explicitQty : 0) || temporaryQuantities[productId] || product.quantity || packStep;
      const isSharedParam = new URLSearchParams(window.location.search).has("shared");
      const updatedProducts: any = existing
        // Split product exists only as pre-order; now adding its stock qty
        ? selectedProducts.map((p) => p._id === productId ? { ...p, quantity } : p)
        : [
            ...selectedProducts,
            {
              ...product,
              margin: specialMargins[productId] || customer?.cf_margin || order?.customer_margin || "40%",
              quantity,
              added_by: isSharedParam ? "customer" : user?.role || 'sales_person',
            },
          ];

      startTransition(() => {
        setSelectedProducts(updatedProducts);
        setTemporaryQuantities((prev) => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
        setOptions((prev) => Array.isArray(prev) ? prev.filter((opt) => opt._id !== product._id) : []);
      });
      requestAnimationFrame(() => {
        debouncedSuccess(`Added ${product.name} (x${quantity}) to cart.`);
      });
    },
    [
      selectedProducts,
      temporaryQuantities,
      specialMargins,
      customer,
      order?.customer_margin,
      debouncedSuccess,
      debouncedWarn,
    ]
  );

  const handleRemoveProduct = useCallback(
    (id: string, isPreOrder = false) => {
      // Clear the same-gesture add guard so a quick remove → re-add isn't blocked.
      delete recentAddRef.current[isPreOrder ? `${id}-pre` : id];
      if (isPreOrder) {
        // Clear only pre_order_quantity; remove item entirely if no stock qty remains
        const item = selectedProducts.find((p) => p._id === id);
        startTransition(() => {
          setSelectedProducts(
            selectedProducts
              .map((p) => p._id === id ? { ...p, pre_order_quantity: 0 } : p)
              .filter((p) => p._id !== id || (p.quantity ?? 0) > 0)
          );
        });
        requestAnimationFrame(() => {
          if (item) debouncedSuccess(`Removed ${item.name} pre-order from cart`);
        });
        return;
      }

      const removedProduct = selectedProducts.find((p) => p._id === id);
      if (!removedProduct) return;
      startTransition(() => {
        setSelectedProducts(selectedProducts.filter((p) => p._id !== id));
        setOptions((prev) => Array.isArray(prev) ? [...prev, removedProduct] : [removedProduct]);
      });
      requestAnimationFrame(() => {
        debouncedSuccess(`Removed ${removedProduct.name} from cart`);
      });
    },
    [selectedProducts, debouncedSuccess, setSelectedProducts]
  );

  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number, isPreOrder = false) => {
      if (isPreOrder) {
        const productInCart = selectedProducts.find((p) => p._id === id);
        if (productInCart) {
          startTransition(() => {
            setSelectedProducts((prev) => prev.map((p) => {
              if (p._id !== id) return p;
              const minQty = getPackStep(p.name);
              const sanitized = Math.max(minQty, Math.min(newQuantity, p.upcoming_stock || Infinity));
              // No toast on in-place quantity edits — the card/cart totals update
              // live, so a toast per keystroke-commit would just be noise.
              return { ...p, pre_order_quantity: sanitized };
            }));
          });
        } else {
          // Not in cart yet — entering a quantity adds it straight to the cart
          // as a pre-order instead of requiring a separate "Add as Pre-Order" click.
          const product = productLookupRef.current.get(id);
          if (product && newQuantity > 0) {
            handleAddProducts(product, true, newQuantity);
          } else {
            setTemporaryQuantities((prev) => ({ ...prev, [`${id}-pre`]: newQuantity }));
          }
        }
        return;
      }

      const productInCart = selectedProducts.find((p) => p._id === id);
      if (productInCart) {
        const minQty = getPackStep(productInCart.name);
        const sanitized = Math.max(
          minQty,
          (productInCart.pre_order && (productInCart.stock ?? 0) <= 0) ? Math.min(newQuantity, productInCart.upcoming_stock || Infinity) : Math.min(newQuantity, productInCart.stock)
        );
        const updated = selectedProducts.map((p) =>
          p._id === id ? { ...p, quantity: sanitized } : p
        );
        startTransition(() => {
          setSelectedProducts(updated);
        });
        // No toast on in-place quantity edits (see pre-order branch above).
      } else {
        // Not in cart yet — entering a quantity adds it straight to the cart
        // instead of requiring a separate "Add to Cart" click.
        const product = productLookupRef.current.get(id);
        if (product && newQuantity > 0) {
          handleAddProducts(product, false, newQuantity);
        } else {
          setTemporaryQuantities((prev) => ({ ...prev, [id]: newQuantity }));
        }
      }
    },
    [selectedProducts, debouncedSuccess, handleAddProducts]
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
  // Stable add/remove handler — refs break the selectedProducts/activeBrand
  // dependency so the callback identity never changes and memo'd cards
  // stop re-rendering on every keystroke/cart change.
  const selectedProductsRefPerf = useRef(selectedProducts);
  useEffect(() => { selectedProductsRefPerf.current = selectedProducts; }, [selectedProducts]);
  const activeBrandRefPerf = useRef(activeBrand);
  useEffect(() => { activeBrandRefPerf.current = activeBrand; }, [activeBrand]);
  const handleAddOrRemove = useCallback((prod: any) => {
    const _isPreCtx = activeBrandRefPerf.current === "Pre Orders" && prod.pre_order === true && (prod.stock ?? 0) > 0;
    const _inCart: any = selectedProductsRefPerf.current.find((p: any) => p._id === prod._id);
    if (_isPreCtx) {
      (_inCart?.pre_order_quantity ?? 0) > 0
        ? handleRemoveProduct(prod._id, true)
        : handleAddProducts(prod, true);
    } else {
      _inCart ? handleRemoveProduct(prod._id) : handleAddProducts(prod);
    }
  }, [handleAddProducts, handleRemoveProduct]);

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
    // Consume the one-time catalogue/init seed: if this exact view was just
    // seeded, skip the immediate refetch that would overwrite it. Once the user
    // navigates to a different view the seed is spent.
    if (initSeededKeyRef.current) {
      if (initSeededKeyRef.current === productsKey && productsByBrandCategory[productsKey]) {
        return;
      }
      initSeededKeyRef.current = null;
    }
    if (groupByCategory) {
      fetchAllCategories();
    } else if (activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand);
    } else if (activeBrand && activeCategory && categoriesByBrand[activeBrand]) {
      // Only call this if we have both brand and category set, and categories are already loaded
      resetPaginationAndFetch(activeBrand, activeCategory);
    }
    // productsKey is read for the init-seed guard only; intentionally not a dep
    // so this effect keeps its original brand/category-driven trigger cadence
    // (adding it would also fire on search/sort changes — a regression).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // One combined request (brands + counts + categories + first page) for the
    // default landing view; falls back to independent fetches for preselected
    // brand/search inside fetchCatalogueInit.
    fetchCatalogueInit();
  }, [fetchCatalogueInit]);

  // Keep URL in sync with active brand, category, and search (combined into one effect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    activeBrand ? params.set("brand", activeBrand.replace(/\s+/g, "-")) : params.delete("brand");
    searchTerm ? params.set("search", searchTerm) : params.delete("search");
    activeCategory ? params.set("category", activeCategory.replace(/\s+/g, "-")) : params.delete("category");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeBrand, searchTerm, activeCategory]);

  // Trigger search on first mount if URL contains a search param
  const didInitialSearch = useRef(false);
  useEffect(() => {
    const initialSearch =
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("search") || "").replace(/\s+/g, " ").trim()
        : "";
    if (!initialSearch || didInitialSearch.current) return;
    didInitialSearch.current = true;
    handleSearch(initialSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!groupByCategory && activeBrand && !categoriesByBrand[activeBrand]) {
      fetchCategories(activeBrand);
    }
  }, [activeBrand, categoriesByBrand, fetchCategories, groupByCategory]);

  // Re-fetch out of stock products when brand or category changes
  useEffect(() => {
    if (activeBrand) {
      fetchOutOfStockProducts();
    }
  }, [activeBrand, activeCategory, fetchOutOfStockProducts]);
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

  // Keep a flat id→product lookup of everything currently renderable so that
  // entering a quantity can resolve the full product and add it to the cart.
  useEffect(() => {
    const map = productLookupRef.current;
    const add = (p: any) => {
      if (p && p._id) map.set(p._id, p);
    };
    if (Array.isArray(itemsData)) {
      itemsData.forEach((item: any) => {
        if (item?.type === 'group') {
          (item.products || []).forEach(add);
          add(item.primaryProduct);
        } else {
          add(item?.product);
        }
      });
    }
    displayedProducts.forEach(add);
    options.forEach(add);
    outOfStockProducts.forEach(add);
    selectedProducts.forEach(add);
  }, [itemsData, displayedProducts, options, outOfStockProducts, selectedProducts]);

  // Get grouped data - only when backend doesn't already send grouped itemsData
  const groupedData = useMemo((): GroupedProducts | null => {
    if (!groupByProductName || itemsData) {
      return null;
    }
    // Fallback to frontend grouping (shouldn't be needed when backend sends itemsData)
    return groupProductsByName(displayedProducts);
  }, [groupByProductName, itemsData, displayedProducts]);


  const filteredBrandList = useMemo(() => {
    const preOrderCount = productCounts["Pre Orders"]
      ? Object.values(productCounts["Pre Orders"]).reduce((a, b) => a + b, 0)
      : 0;
    const clearanceCount = productCounts["Clearance"]
      ? Object.values(productCounts["Clearance"]).reduce((a, b) => a + b, 0)
      : 0;
    return brandList.filter((b) => {
      if (b.brand === "Pre Orders") return preOrderCount > 0;
      if (b.brand === "Clearance") return clearanceCount > 0;
      return true;
    });
  }, [brandList, productCounts]);

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

      {/* Locked-order banner */}
      {['accepted', 'declined', 'invoiced'].includes(order?.status?.toLowerCase()) && (
        <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 500 }}>
          Products cannot be added to an order that is <strong>{order.status.toLowerCase()}</strong>.
        </Alert>
      )}

      {/* Products Section */}
      <Box sx={{ flex: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={{ xs: "column", sm: "row" }}
          gap={{ xs: 1.5, sm: 1 }}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Add Products
          </Typography>
          {/* Toolbar: out-of-stock toggle + clear cart share one row */}
          <Box
            display="flex"
            justifyContent={{ xs: "stretch", sm: "flex-end" }}
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Tooltip
              title={hideOutOfStock
                ? "Show products that are currently out of stock at the bottom of the list"
                : "Hide products that are currently unavailable to simplify browsing"
              }
              arrow
            >
              <Button
                variant={hideOutOfStock ? "outlined" : "contained"}
                color="secondary"
                size="small"
                onClick={() => setHideOutOfStock(!hideOutOfStock)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '24px',
                  px: 2.5,
                  height: 40,
                  whiteSpace: 'nowrap',
                  fontSize: '0.8rem',
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                {hideOutOfStock ? "Show Out of Stock" : "Hide Out of Stock"}
              </Button>
            </Tooltip>
            <Tooltip title="Remove all products from your cart and start fresh" arrow>
              <Box
                component="span"
                sx={{ display: 'flex', flex: { xs: 1, sm: '0 0 auto' } }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleOpenConfirmModal} // Changed to open modal instead
                  disabled={
                    selectedProducts.length === 0 ||
                    !["draft", "sent"].includes(
                      order?.status?.toLowerCase() as string
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "24px",
                    px: 2.5,
                    height: 40,
                    whiteSpace: "nowrap",
                    fontSize: "0.8rem",
                    flex: 1,
                  }}
                >
                  Clear Cart
                </Button>
              </Box>
            </Tooltip>
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
        {/* Sticky on phones/tablets so users deep in a long product list can
            search or clear without scrolling back up. Requires the parent
            Card's overflow to be 'visible' (set in orders/new/[id].tsx). */}
        <Box
          sx={{
            position: { xs: 'sticky', md: 'static' },
            top: 0,
            zIndex: 5,
            bgcolor: 'background.paper',
            py: { xs: 1, md: 0 },
            mx: { xs: -0.5, md: 0 },
            px: { xs: 0.5, md: 0 },
          }}
        >
        <TextField
          label={label}
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            handleSearch(val);
          }}
          placeholder="Search by name, SKU, or brand…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress color="inherit" size={20} />
              </InputAdornment>
            ) : query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => { setQuery(''); handleSearch(''); }}
                  edge="end"
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: { xs: '1rem', sm: '0.95rem' },
              transition: 'box-shadow 0.2s ease',
              backgroundColor: 'background.paper',
              '&:focus-within': {
                boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
              },
            },
          }}
        />
        </Box>

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
                      const iconBoxSx = {
                        width: 64,
                        height: 64,
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        p: '2px',
                      } as const;
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {selectedBrand?.brand === "Pre Orders" ? (
                            <Box sx={iconBoxSx}>
                              <ShoppingCartCheckoutIcon sx={{ fontSize: 34, color: '#d97706' }} />
                            </Box>
                          ) : selectedBrand?.brand === "Clearance" ? (
                            <Box sx={iconBoxSx}>
                              <Box
                                component="img"
                                src={SPECIAL_OFFERS_ICON}
                                alt="Special Offers"
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          ) : (selectedBrand?.image || selectedBrand?.url) && (
                            <Box sx={iconBoxSx}>
                              <Box
                                component="img"
                                src={selectedBrand.image || selectedBrand.url}
                                alt={selectedBrand.brand}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          )}
                          <Typography variant="h6">
                            {brandDisplayName(selectedBrand?.brand)}
                          </Typography>
                        </Box>
                      );
                    }}
                  >
                    {filteredBrandList.map((b: any) => {
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
                            {b.brand === "Pre Orders" ? (
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: '6px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <ShoppingCartCheckoutIcon sx={{ fontSize: 30, color: '#d97706' }} />
                              </Box>
                            ) : b.brand === "Clearance" ? (
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: '6px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Box
                                  component="img"
                                  src={SPECIAL_OFFERS_ICON}
                                  alt="Special Offers"
                                  sx={{ width: '100%', height: '100%', objectFit: 'contain', p: '6px' }}
                                />
                              </Box>
                            ) : (b.image || b.url) && (
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: '6px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                  p: '4px',
                                }}
                              >
                                <Image
                                  src={b.image || b.url}
                                  alt={b.brand}
                                  width={48}
                                  height={48}
                                  style={{ objectFit: "contain" }}
                                />
                              </Box>
                            )}
                            <Box display="flex" flexDirection="column" flex={1}>
                              <Typography variant="h6" fontWeight="medium">
                                {brandDisplayName(b.brand)}
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
                    textColor="inherit"
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
                        color: "text.primary",
                        opacity: 1,
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
                    {filteredBrandList.map((b: any) => {
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
                              {b.brand === "Pre Orders" ? (
                                <Box
                                  className="brand-image"
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '8px',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ShoppingCartCheckoutIcon sx={{ fontSize: 40, color: '#d97706' }} />
                                </Box>
                              ) : b.brand === "Clearance" ? (
                                <Box
                                  className="brand-image"
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '8px',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={SPECIAL_OFFERS_ICON}
                                    alt="Special Offers"
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: '6px' }}
                                  />
                                </Box>
                              ) : (b.image || b.url) && (
                                <Box
                                  className="brand-image"
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '8px',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    p: '4px',
                                  }}
                                >
                                  <Image
                                    src={b.image || b.url}
                                    alt={b.brand}
                                    width={72}
                                    height={72}
                                    style={{ objectFit: "contain" }}
                                  />
                                </Box>
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
                                  {brandDisplayName(b.brand)}
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
                  textColor="inherit"
                  sx={{
                    mt: 2,
                    ".MuiTab-root": {
                      textTransform: "none",
                      fontWeight: "bold",
                      padding: "10px 20px",
                      color: "text.primary",
                      opacity: 1,
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
                    textColor="inherit"
                    sx={{
                      mt: 2,
                      mb: 2,
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: "bold",
                        padding: "8px 16px",
                        color: "text.primary",
                        opacity: 1,
                      },
                      ".Mui-selected": { color: "primary.main" },
                    }}
                  >
                    {categoriesByBrand[activeBrand].map((cat) => {
                      const actualBrand = activeBrand === "Out Of Stock" ? "New Arrivals" : activeBrand;
                      const catCount = productCounts[actualBrand]?.[cat] || 0;
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
                  <Tooltip
                    title="Enable to jump to a specific page in the printed catalogue. Enter the page number to view products from that page."
                    arrow
                  >
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
                  </Tooltip>
                  {catalogueEnabled && (
                    <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                      <Tooltip title="Enter a catalogue page number to view products from that specific page" arrow>
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
                          onChange={(_, newValue: any) => {
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
                      </Tooltip>
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
                    <Tooltip
                      title="Enable to jump to a specific page in the printed catalogue. Enter the page number to view products from that page."
                      arrow
                    >
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
                    </Tooltip>
                    {catalogueEnabled && (
                      <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                        <Tooltip title="Enter a catalogue page number to view products from that specific page" arrow>
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
                            onChange={(_, newValue: any) => {
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
                        </Tooltip>
                      </FormControl>
                    )}
                  </>
                )}
              </Box>
            )
          )}
          {sortOrder !== "catalogue" && activeBrand !== "Pre Orders" && (
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Tooltip
                title="View all products organized by category instead of by brand. Useful for finding products across different brands in the same category."
                arrow
              >
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
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Products Display */}
        {isMobile || isTablet ? (
          <Fade in key={productsKey} timeout={250}>
          <Box>
            {loading || loadingOutOfStock ? (
              // Loading skeletons for mobile/tablet
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: { xs: 1.25, sm: 2 },
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
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: { xs: 1.25, sm: 2 },
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
                        handleAddOrRemove={handleAddOrRemove}
                        index={index}
                        isShared={isShared}
                        isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
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
                        handleAddOrRemove={handleAddOrRemove}
                        index={index}
                        isShared={isShared}
                        isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
                      />
                    );
                  }
                })}
              </Box>
            ) : displayedProducts.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: { xs: 1.25, sm: 2 },
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
                    handleAddOrRemove={handleAddOrRemove}
                    index={index}
                    isShared={isShared}
                    isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
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

            {/* Out of Stock Products Section - exclude from New Arrivals and Pre Orders */}
            {!hideOutOfStock && outOfStockProducts.length > 0 && activeBrand !== "New Arrivals" && activeBrand !== "Pre Orders" && activeBrand !== "Clearance" && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Out of Stock Products
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                    width: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {outOfStockItems.length > 0 ? (
                    outOfStockItems.map((item: any, index: number) => {
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
                            handleAddOrRemove={handleAddOrRemove}
                            index={index}
                            isShared={isShared}
                            isOutOfStock={true}
                            handleNotifyMe={handleNotifyMe}
                            outOfStockQuantities={outOfStockQuantities}
                            onOutOfStockQuantityChange={handleOutOfStockQuantityChange}
                          />
                        );
                      } else {
                        const product = item.product;
                        return (
                          <Card key={product._id} sx={{ p: 2, opacity: 0.8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  position: 'relative',
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
                                <Chip
                                  label="OUT OF STOCK"
                                  size="small"
                                  color="error"
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    fontWeight: 'bold',
                                  }}
                                />
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {product.name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Brand:</Typography>
                                  <Typography variant="body2" fontWeight={500}>{product.brand}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">MRP:</Typography>
                                  <Typography variant="body1" fontWeight={600}>₹{product.rate?.toLocaleString()}</Typography>
                                </Box>
                              </Box>
                            </Box>
                            {!isShared && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                  Pre-order Quantity
                                </Typography>
                                <QuantitySelector
                                  quantity={outOfStockQuantities[product._id] || 1}
                                  onChange={(newQty: number) => handleOutOfStockQuantityChange(product._id, newQty)}
                                  max={999}
                                />
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  fullWidth
                                  onClick={() => handleNotifyMe(product._id, product.name)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '24px',
                                  }}
                                >
                                  Notify when available
                                </Button>
                              </Box>
                            )}
                          </Card>
                        );
                      }
                    })
                  ) : (
                    // Fallback for non-grouped response
                    outOfStockProducts.map((product: any) => (
                      <Card key={product._id} sx={{ p: 2, opacity: 0.8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 200,
                              position: 'relative',
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
                            <Chip
                              label="OUT OF STOCK"
                              size="small"
                              color="error"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Brand:</Typography>
                              <Typography variant="body2" fontWeight={500}>{product.brand}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">MRP:</Typography>
                              <Typography variant="body1" fontWeight={600}>₹{product.rate?.toLocaleString()}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        {!isShared && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              Pre-order Quantity
                            </Typography>
                            <QuantitySelector
                              quantity={outOfStockQuantities[product._id] || 1}
                              onChange={(newQty: number) => handleOutOfStockQuantityChange(product._id, newQty)}
                              max={999}
                            />
                            <Button
                              variant="outlined"
                              color="secondary"
                              fullWidth
                              onClick={() => handleNotifyMe(product._id, product.name)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '24px',
                              }}
                            >
                              Notify when available
                            </Button>
                          </Box>
                        )}
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            )}

            {/* Intersection Observer target for infinite scroll */}
            <div ref={intersectionRef} style={{ height: '20px', margin: '20px 0' }} />
          </Box>
          </Fade>
        ) : (
          // Desktop Card Grid View
          <Fade in key={productsKey} timeout={250}>
          <Box ref={cardScrollRef}>
            {loading || loadingOutOfStock ? (
              // Loading skeletons for desktop
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)',
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
                    xl: 'repeat(4, 1fr)',
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
                        handleAddOrRemove={handleAddOrRemove}
                        index={index}
                        isShared={isShared}
                        isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
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
                        handleAddOrRemove={handleAddOrRemove}
                        index={index}
                        isShared={isShared}
                        isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
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
                    xl: 'repeat(4, 1fr)',
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
                    isPreOrderTab={activeBrand === "Pre Orders" && !searchTerm.trim()}
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

            {/* Out of Stock Products Section - exclude from New Arrivals and Pre Orders */}
            {!hideOutOfStock && outOfStockProducts.length > 0 && activeBrand !== "New Arrivals" && activeBrand !== "Pre Orders" && activeBrand !== "Clearance" && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Out of Stock Products
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(3, 1fr)',
                      xl: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                    width: '100%',
                    maxWidth: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {outOfStockItems.length > 0 ? (
                    outOfStockItems.map((item: any, index: number) => {
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
                            handleAddOrRemove={handleAddOrRemove}
                            index={index}
                            isShared={isShared}
                            isOutOfStock={true}
                            handleNotifyMe={handleNotifyMe}
                            outOfStockQuantities={outOfStockQuantities}
                            onOutOfStockQuantityChange={handleOutOfStockQuantityChange}
                          />
                        );
                      } else {
                        const product = item.product;
                        return (
                          <Card key={product._id} sx={{ p: 2, opacity: 0.8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  position: 'relative',
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
                                <Chip
                                  label="OUT OF STOCK"
                                  size="small"
                                  color="error"
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    fontWeight: 'bold',
                                  }}
                                />
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {product.name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Brand:</Typography>
                                  <Typography variant="body2" fontWeight={500}>{product.brand}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                                  <Typography variant="body2" fontWeight={500}>{product.category || '-'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">MRP:</Typography>
                                  <Typography variant="body1" fontWeight={600}>₹{product.rate?.toLocaleString()}</Typography>
                                </Box>
                              </Box>
                            </Box>
                            {!isShared && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                  Pre-order Quantity
                                </Typography>
                                <QuantitySelector
                                  quantity={outOfStockQuantities[product._id] || 1}
                                  onChange={(newQty: number) => handleOutOfStockQuantityChange(product._id, newQty)}
                                  max={999}
                                />
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  fullWidth
                                  onClick={() => handleNotifyMe(product._id, product.name)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '24px',
                                  }}
                                >
                                  Notify when available
                                </Button>
                              </Box>
                            )}
                          </Card>
                        );
                      }
                    })
                  ) : (
                    // Fallback for non-grouped response
                    outOfStockProducts.map((product: any) => (
                      <Card key={product._id} sx={{ p: 2, opacity: 0.8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 200,
                              position: 'relative',
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
                            <Chip
                              label="OUT OF STOCK"
                              size="small"
                              color="error"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Brand:</Typography>
                              <Typography variant="body2" fontWeight={500}>{product.brand}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Category:</Typography>
                              <Typography variant="body2" fontWeight={500}>{product.category || '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">MRP:</Typography>
                              <Typography variant="body1" fontWeight={600}>₹{product.rate?.toLocaleString()}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        {!isShared && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              Pre-order Quantity
                            </Typography>
                            <QuantitySelector
                              quantity={outOfStockQuantities[product._id] || 1}
                              onChange={(newQty: number) => handleOutOfStockQuantityChange(product._id, newQty)}
                              max={999}
                            />
                            <Button
                              variant="outlined"
                              color="secondary"
                              fullWidth
                              onClick={() => handleNotifyMe(product._id, product.name)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '24px',
                              }}
                            >
                              Notify when available
                            </Button>
                          </Box>
                        )}
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            )}

            {/* Intersection Observer target for infinite scroll - Desktop */}
            <div ref={intersectionRef} style={{ height: '20px', margin: '20px 0' }} />
          </Box>
          </Fade>
        )}
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: theme.spacing(20), sm: theme.spacing(19), md: theme.spacing(23) },
          right: { xs: theme.spacing(1), sm: theme.spacing(3), md: theme.spacing(2) },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
        className='no-pdf'
      >
        <ScrollTriangleButtons
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
          disabled={isScrollButtonDisabled}
          isMobile={isMobile}
        />
      </Box>

      {/* Cart Icon */}
      <IconButton
        color="primary"
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: "fixed",
          bottom: { xs: theme.spacing(10), sm: theme.spacing(10), md: theme.spacing(10) },
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
          badgeContent={selectedProducts.reduce((n: number, p: any) => {
            const isSplit = p.pre_order === true && (p.stock ?? 0) > 0;
            if (isSplit) return n + ((p.quantity ?? 0) > 0 ? 1 : 0) + ((p.pre_order_quantity ?? 0) > 0 ? 1 : 0);
            return n + 1;
          }, 0)}
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
