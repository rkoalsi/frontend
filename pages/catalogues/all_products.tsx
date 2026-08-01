import {
  Box,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Close } from '@mui/icons-material';
import ScrollTriangleButtons from '../../src/components/common/ScrollTriangleButtons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  type Product as GroupProduct,
} from '../../src/util/groupProducts';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import { event as trackEvent } from '../../src/util/gtag';
import Image from 'next/image';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import ProductCardSkeleton from '../../src/components/common/ProductCardSkeleton';
import CatalogueProductCard from '../../src/components/OrderForm/products/CatalogueProductCard';
import CatalogueProductGroupCard from '../../src/components/OrderForm/products/CatalogueProductGroupCard';
import CatalogueFilters from '../../src/components/OrderForm/products/CatalogueFilters';
import CatalogueToolbar, { type ViewDensity, type SortOption } from '../../src/components/OrderForm/products/CatalogueToolbar';
import QuickViewModal from '../../src/components/OrderForm/products/QuickViewModal';
import BrandStrip from '../../src/components/OrderForm/products/BrandStrip';
import BrandSpotlight from '../../src/components/OrderForm/products/BrandSpotlight';
import BrandInfoDialog from '../../src/components/OrderForm/products/BrandInfoDialog';
import {
  COLLECTION_COPY,
  getBrandAccent,
  isCollectionKey,
  type BrandRailEntry,
} from '../../src/util/brandAccent';
import { useIntersectionObserver } from '../../src/hooks/useIntersectionObserver';

// The "Clearance" brand is an internal routing/counts key — it surfaces to
// users as "Special Offers", exactly as it does on the order form.
const brandDisplayName = (brand?: string) =>
  brand === 'Clearance' ? 'Special Offers' : brand || '';

// Every brand tab is this wide so the clamped category lines stay aligned.
const TAB_WIDTH = 168;

// What sits under a brand's name on the rail: the categories it stocks. The
// collections file everything under one "All Products" category, so a fixed
// line from COLLECTION_COPY stands in for them.
const RAIL_CATEGORY_LIMIT = 2;

const categorySummary = (
  brand: string,
  counts: { [category: string]: number } | undefined
): string => {
  if (isCollectionKey(brand)) return COLLECTION_COPY[brand]?.short || '';
  const names = Object.entries(counts || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
  if (!names.length) return '';
  const shown = names.slice(0, RAIL_CATEGORY_LIMIT).join(' · ');
  const rest = names.length - RAIL_CATEGORY_LIMIT;
  return rest > 0 ? `${shown} +${rest}` : shown;
};

interface Product extends GroupProduct {
  category: string;
  brand?: string;
  item_tax_preferences: any;
}

interface CatalogueItem {
  type: 'group' | 'product';
  groupId?: string;
  baseName?: string;
  products?: Product[];
  primaryProduct?: Product;
  product?: Product;
}

interface CatalogueResponse {
  items?: CatalogueItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  brands: string[];
}

const getItemProduct = (item: CatalogueItem): Product | undefined =>
  item.type === 'group' ? item.primaryProduct : item.product;

// How many cards to mount per scroll chunk — keeps the DOM small while
// client-side filters still operate on the full in-memory dataset.
const RENDER_CHUNK = 48;

// Brand/category URL params encode spaces as hyphens (legacy shared-link format).
const toUrlValue = (v: string) => v.replace(/\s+/g, '-');
const fromUrlValue = (v: string) => v.replace(/-/g, ' ');

const getUrlParam = (key: string) =>
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get(key) || ''
    : '';

export default function AllProductsCatalouge() {
  const theme = useTheme();
  const router = useRouter();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  // Search term is stored raw (not hyphen-encoded) so searches containing "-" work.
  const [searchTerm, setSearchTerm] = useState(() => getUrlParam('search'));
  const [inputValue, setInputValue] = useState(() => getUrlParam('search'));
  const [brandList, setBrandList] = useState<BrandRailEntry[]>([]);
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: { items: CatalogueItem[] };
  }>({});
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex]: any = useState(0);
  const [activeBrand, setActiveBrand] = useState<string>(() => fromUrlValue(getUrlParam('brand')));
  const [activeCategory, setActiveCategory] = useState<string>(() => fromUrlValue(getUrlParam('category')));
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({});
  const activeCategoryRef = useRef(activeCategory);
  // Set when a state change came from a user click (vs programmatic init),
  // so the URL write below uses push (back-button friendly) instead of replace.
  const userNavRef = useRef(false);

  // Catalogue-specific state
  const [viewDensity, setViewDensity] = useState<ViewDensity>('4x4');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const priceTouchedRef = useRef(false);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<string[]>([]);
  const [selectedFilterBrands, setSelectedFilterBrands] = useState<string[]>([]);
  const [showNewOnly, setShowNewOnly] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<Product[]>([]);
  const [showQuickView, setShowQuickView] = useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<CatalogueItem[]>([]);
  const [loadingOutOfStock, setLoadingOutOfStock] = useState<boolean>(false);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const [productCounts, setProductCounts] = useState<{
    [brand: string]: { [category: string]: number };
  }>({});

  const showError = useCallback((msg: string) => toast.error(msg), []);

  const handleImageClick = useCallback((srcList: any, index: number) => {
    if (Array.isArray(srcList)) {
      // ImageCarousel already passes media items shaped as { src, type }; only
      // wrap when we were handed a bare list of URL strings.
      const formattedImages = srcList[0]?.src && typeof srcList[0].src === 'string'
        ? srcList
        : srcList?.map((src: any) => ({ src }));
      setPopupImageSrc(formattedImages);
      setPopupImageIndex(index);
      setOpenImagePopup(true);
    } else {
      setPopupImageSrc([{ src: srcList, alt: 'main_image' }]);
      setPopupImageIndex(0);
      setOpenImagePopup(true);
    }
  }, []);

  const productsKey = useMemo(() => {
    if (searchTerm.trim() !== '') return 'search';
    return activeBrand && activeCategory
      ? `${activeBrand}-${activeCategory}`
      : 'all';
  }, [searchTerm, activeBrand, activeCategory]);

  const itemsData = useMemo(
    () => productsByBrandCategory[productsKey]?.items ?? null,
    [productsByBrandCategory, productsKey]
  );

  // Get all unique categories and brands for filters
  const allFilterCategories = useMemo(() => {
    const categories = new Set<string>();
    itemsData?.forEach((item) => {
      const product = getItemProduct(item);
      if (product?.category) categories.add(product.category);
    });
    return Array.from(categories).sort();
  }, [itemsData]);

  const allFilterBrands = useMemo(() => {
    const brands = new Set<string>();
    itemsData?.forEach((item) => {
      const product = getItemProduct(item);
      if (product?.brand) brands.add(product.brand);
    });
    return Array.from(brands).sort();
  }, [itemsData]);

  // Calculate max price for filter slider
  const maxPrice = useMemo(() => {
    if (!itemsData || itemsData.length === 0) return 100000;
    let max = 0;
    itemsData.forEach((item) => {
      const product = getItemProduct(item);
      if (product?.rate && product.rate > max) max = product.rate;
    });
    return Math.ceil(max / 1000) * 1000; // Round up to nearest 1000
  }, [itemsData]);

  // Auto-fit the price range to the data, but never clobber a range the user set.
  useEffect(() => {
    priceTouchedRef.current = false;
  }, [productsKey]);

  useEffect(() => {
    if (!priceTouchedRef.current) setPriceRange([0, maxPrice]);
  }, [maxPrice, productsKey]);

  const handlePriceChange = useCallback((range: [number, number]) => {
    priceTouchedRef.current = true;
    setPriceRange(range);
  }, []);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!itemsData) return [];

    const filtered = itemsData.filter((item) => {
      const product = getItemProduct(item);
      if (!product) return false;

      if (product.rate < priceRange[0] || product.rate > priceRange[1]) return false;
      if (selectedFilterCategories.length > 0 && !selectedFilterCategories.includes(product.category)) return false;
      if (selectedFilterBrands.length > 0 && !selectedFilterBrands.includes(product.brand || '')) return false;
      if (showNewOnly && !product.new) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const productA = getItemProduct(a);
      const productB = getItemProduct(b);

      switch (sortOption) {
        case 'price-low':
          return (productA?.rate || 0) - (productB?.rate || 0);
        case 'price-high':
          return (productB?.rate || 0) - (productA?.rate || 0);
        case 'name-asc':
          return (productA?.name || '').localeCompare(productB?.name || '');
        case 'name-desc':
          return (productB?.name || '').localeCompare(productA?.name || '');
        case 'newest':
          if (productA?.new && !productB?.new) return -1;
          if (!productA?.new && productB?.new) return 1;
          return 0;
        default:
          return 0;
      }
    });
  }, [itemsData, priceRange, selectedFilterCategories, selectedFilterBrands, showNewOnly, sortOption]);

  // Calculate total product count including all variants
  const totalProductCount = useMemo(
    () =>
      filteredAndSortedItems.reduce(
        (total, item) =>
          total + (item.type === 'group' ? item.products?.length || 1 : 1),
        0
      ),
    [filteredAndSortedItems]
  );

  // Render the grid in chunks as the user scrolls so hundreds of cards
  // don't mount at once. Filters/sort still see the full dataset.
  const [visibleCount, setVisibleCount] = useState(RENDER_CHUNK);

  useEffect(() => {
    setVisibleCount(RENDER_CHUNK);
  }, [filteredAndSortedItems]);

  const visibleItems = useMemo(
    () => filteredAndSortedItems.slice(0, visibleCount),
    [filteredAndSortedItems, visibleCount]
  );
  const hasMoreToRender = visibleCount < filteredAndSortedItems.length;

  const loadMoreRef = useIntersectionObserver({
    onIntersect: () => setVisibleCount((c) => c + RENDER_CHUNK),
    enabled: hasMoreToRender && !loading,
    threshold: 0,
    rootMargin: '900px',
  });

  const fetchOutOfStockProducts = useCallback(async () => {
    try {
      setLoadingOutOfStock(true);

      // Handle "New Arrivals" brand specially - don't pass brand parameter
      const brandParam = activeBrand === 'New Arrivals' ? undefined : activeBrand;
      const categoryParam = (activeBrand === 'New Arrivals' || activeCategory === 'All Products') ? undefined : activeCategory;

      const response = await axios.get(`${process.env.api_url}/products/out-of-stock`, {
        params: {
          brand: brandParam,
          category: categoryParam,
          group_by_name: true,
        },
      });

      // Handle grouped response (items) or legacy flat response (products)
      if (response.data.items) {
        setOutOfStockItems(response.data.items);
        // Also extract flat list for backward compatibility
        const flatProducts: Product[] = [];
        response.data.items.forEach((item: CatalogueItem) => {
          if (item.type === 'group') {
            flatProducts.push(...(item.products || []));
          } else if (item.product) {
            flatProducts.push(item.product);
          }
        });
        setOutOfStockProducts(flatProducts);
      } else {
        setOutOfStockProducts(response.data.products || []);
        setOutOfStockItems([]);
      }
    } catch (error) {
      showError('Failed to fetch out of stock products.');
    } finally {
      setLoadingOutOfStock(false);
    }
  }, [activeBrand, activeCategory, showError]);

  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      // Use the combined init endpoint — returns brands + counts + categories + first-page products in one shot
      const initialBrand = activeBrand || 'New Arrivals';
      const response = await axios.get(
        `${process.env.api_url}/products/catalogue/init`,
        { params: { brand: initialBrand } }
      );

      const allBrands: BrandRailEntry[] = response.data.brands || [];
      const newArrivalsBrand = {
        brand: 'New Arrivals',
        url: 'https://assets.pupscribe.in/brands/new-arrivals.svg',
      };
      const brandsWithNewArrivals = [newArrivalsBrand, ...allBrands];

      setBrandList(brandsWithNewArrivals);
      setProductCounts(response.data.counts || {});

      const resolvedBrand = activeBrand || brandsWithNewArrivals[0]?.brand || 'New Arrivals';
      if (!activeBrand) setActiveBrand(resolvedBrand);

      // Seed categories for the active brand from init response
      const cats: string[] = response.data.categories || [];
      setCategoriesByBrand((prev) => ({ ...prev, [resolvedBrand]: cats }));
      if (cats.length > 0) {
        const cur = activeCategoryRef.current;
        if (!cur || !cats.includes(cur)) setActiveCategory(cats[0]);
      }

      // Seed products for the active brand — avoids a second round-trip
      const items = response.data.items || [];
      const key = resolvedBrand === 'New Arrivals' ? 'New Arrivals-All Products' : `${resolvedBrand}-${cats[0] || ''}`;
      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: { items },
        ...(resolvedBrand === 'New Arrivals' ? { all: { items } } : {}),
        [`${resolvedBrand}-${cats[0] || ''}`]: { items },
      }));
    } catch (error) {
      showError('Failed to fetch catalogue data.');
    } finally {
      setLoading(false);
    }
  }, [activeBrand, showError]);

  // Keep ref in sync so fetchCategoriesForBrand can read it without being in deps
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  const fetchCategoriesForBrand = useCallback(async (brand: string) => {
    if (brand === 'New Arrivals') {
      const categories = ['All Products'];
      setCategoriesByBrand((prev) => ({ ...prev, [brand]: categories }));
      const cur = activeCategoryRef.current;
      if (!cur || !categories.includes(cur)) {
        setActiveCategory(categories[0]);
      }
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.api_url}/products/categories`,
        { params: { brand } }
      );
      const cats = response.data.categories || [];
      setCategoriesByBrand((prev) => ({ ...prev, [brand]: cats }));
      const cur = activeCategoryRef.current;
      if (cats.length > 0 && (!cur || !cats.includes(cur))) {
        setActiveCategory(cats[0]);
      }
    } catch (error) {
      showError('Failed to fetch categories.');
    }
  }, [showError]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // When searching, search across all brands (don't filter by brand/category).
      // Otherwise, handle "New Arrivals" specially - don't pass brand, pass new_only instead.
      const buildParams = (page: number) => {
        const params: Record<string, any> = {
          page,
          per_page: 200,
          group_by_name: true, // Request backend grouping
        };
        if (searchTerm) {
          params.search = searchTerm;
        } else {
          if (activeBrand && activeBrand !== 'New Arrivals') params.brand = activeBrand;
          if (activeBrand !== 'New Arrivals' && activeCategory && activeCategory !== 'All Products') {
            params.category = activeCategory;
          }
          if (activeBrand === 'New Arrivals') params.new_only = true;
        }
        return params;
      };

      const firstResponse = await axios.get<CatalogueResponse>(
        `${process.env.api_url}/products/catalogue/all_products`,
        { params: buildParams(1) }
      );

      let allItems = firstResponse.data.items || [];
      const totalPages = firstResponse.data.total_pages;

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        const remainingRequests = [];
        for (let page = 2; page <= totalPages; page++) {
          remainingRequests.push(
            axios.get<CatalogueResponse>(
              `${process.env.api_url}/products/catalogue/all_products`,
              { params: buildParams(page) }
            )
          );
        }

        const remainingResponses = await Promise.all(remainingRequests);
        remainingResponses.forEach((response) => {
          if (response.data.items) {
            allItems = [...allItems, ...response.data.items];
          }
        });
      }

      // Sort items to prioritize new products first
      const sortedItems = [...allItems].sort((a, b) => {
        const isNewA = getItemProduct(a)?.new === true;
        const isNewB = getItemProduct(b)?.new === true;
        if (isNewA && !isNewB) return -1;
        if (!isNewA && isNewB) return 1;
        return 0;
      });

      const key = searchTerm.trim() !== ''
        ? 'search'
        : activeBrand && activeCategory
          ? `${activeBrand}-${activeCategory}`
          : 'all';

      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: { items: sortedItems },
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [activeBrand, searchTerm, activeCategory]);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  // Catalogue handlers
  const handleQuickView = useCallback((product: Product, variants: Product[] = []) => {
    trackEvent('view_item', {
      item_name: product?.name,
      item_brand: product?.brand,
      item_category: product?.category,
    });
    setQuickViewProduct(product);
    setQuickViewVariants(variants);
    setShowQuickView(true);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setShowQuickView(false);
    setQuickViewProduct(null);
    setQuickViewVariants([]);
  }, []);

  const handleCategoryFilterChange = useCallback((category: string) => {
    setSelectedFilterCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleBrandFilterChange = useCallback((brand: string) => {
    setSelectedFilterBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    priceTouchedRef.current = false;
    setPriceRange([0, maxPrice]);
    setSelectedFilterCategories([]);
    setSelectedFilterBrands([]);
    setShowNewOnly(false);
  }, [maxPrice]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchAllBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Keep the URL in sync via shallow routing so brand/category/search are
  // shareable AND the browser back button works. User-initiated brand changes
  // push a history entry; programmatic updates replace.
  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;
    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value: string) =>
      value ? params.set(key, value) : params.delete(key);
    setOrDelete('brand', activeBrand ? toUrlValue(activeBrand) : '');
    setOrDelete('category', activeCategory ? toUrlValue(activeCategory) : '');
    setOrDelete('search', searchTerm);
    const qs = params.toString();
    if (qs === window.location.search.replace(/^\?/, '')) return;
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    const navigate = userNavRef.current ? router.push : router.replace;
    userNavRef.current = false;
    navigate(url, undefined, { shallow: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand, activeCategory, searchTerm, router.isReady]);

  // Restore state on back/forward navigation
  useEffect(() => {
    if (!router.isReady) return;
    const read = (key: string) => {
      const v = router.query[key];
      return typeof v === 'string' ? v : '';
    };
    const qBrand = fromUrlValue(read('brand'));
    const qCategory = fromUrlValue(read('category'));
    const qSearch = read('search');
    if (qBrand && qBrand !== activeBrand) setActiveBrand(qBrand);
    if (qCategory && qCategory !== activeCategory) setActiveCategory(qCategory);
    if (qSearch !== searchTerm) {
      setSearchTerm(qSearch);
      setInputValue(qSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  useEffect(() => {
    // Fetch categories when brand changes
    if (activeBrand) {
      fetchCategoriesForBrand(activeBrand);
    }
  }, [activeBrand, fetchCategoriesForBrand]);

  // Fetch out of stock products only when the toggle is enabled
  useEffect(() => {
    if (activeBrand && !hideOutOfStock) {
      fetchOutOfStockProducts();
    }
  }, [activeBrand, activeCategory, hideOutOfStock, fetchOutOfStockProducts]);

  useEffect(() => {
    // Fetch products when brand, category, or search changes
    // Fetch if we have a brand OR if we have a search term (search across all brands)
    if (activeBrand || searchTerm) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand, activeCategory, searchTerm]);

  const handleBrandTabChange = useCallback((newBrand: string) => {
    userNavRef.current = true;
    setActiveBrand(newBrand);
  }, []);

  const handleCategoryTabChange = useCallback((newCategory: string) => {
    setActiveCategory(newCategory);
  }, []);

  // Create a stable debounced search function using useRef
  const debouncedSearch = useRef(
    debounce((search: string) => {
      setSearchTerm(search);
    }, 500) // 500ms debounce
  ).current;

  useEffect(() => () => { debouncedSearch.cancel(); }, [debouncedSearch]);

  const handleInputChange = useCallback(
    (value: string) => {
      // Update input value immediately for responsive typing
      setInputValue(value);
      // Debounce the actual search
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleClearSearch = useCallback(() => {
    debouncedSearch.cancel();
    setInputValue('');
    setSearchTerm('');
  }, [debouncedSearch]);

  // Shared grid template for skeletons, main grid and out-of-stock grid
  const gridSx = useMemo(() => {
    const cols = (n5: number, n4: number, n3: number) =>
      viewDensity === '5x5'
        ? `repeat(${n5}, 1fr)`
        : viewDensity === '4x4'
          ? `repeat(${n4}, 1fr)`
          : `repeat(${n3}, 1fr)`;
    return {
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: cols(4, 3, 2),
        lg: cols(4, 3, 2),
        xl: cols(5, 4, 3),
      },
      gap: { xs: 2, sm: 2, md: viewDensity === '5x5' ? 2 : 2.5 },
      width: '100%',
    };
  }, [viewDensity]);

  const themeMode = theme.palette.mode === 'dark' ? 'dark' : 'light';

  // Product count for a rail entry, summed across its categories.
  const brandCountOf = useCallback(
    (brand: string) =>
      productCounts[brand]
        ? Object.values(productCounts[brand]).reduce((a, c) => a + c, 0)
        : 0,
    [productCounts]
  );

  // The entry the spotlight describes. Falls back to the first rail entry so
  // the card is populated on the very first paint, before a tab is touched.
  const selectedBrandEntry = useMemo(
    () => brandList.find((b) => b.brand === activeBrand) || brandList[0],
    [brandList, activeBrand]
  );

  // Index of the first real brand — the rail draws a divider here so the
  // collections read as a separate group rather than odd brands.
  const firstBrandIndex = useMemo(
    () => brandList.findIndex((b) => !isCollectionKey(b.brand)),
    [brandList]
  );

  const [brandInfoOpen, setBrandInfoOpen] = useState(false);
  const openBrandInfo = useCallback(() => setBrandInfoOpen(true), []);
  const closeBrandInfo = useCallback(() => setBrandInfoOpen(false), []);

  const isPriceFiltered = priceRange[0] > 0 || priceRange[1] < maxPrice;
  const activeFilterCount =
    selectedFilterCategories.length +
    selectedFilterBrands.length +
    (showNewOnly ? 1 : 0) +
    (!hideOutOfStock ? 1 : 0) +
    (isPriceFiltered ? 1 : 0);

  const isSearching = searchTerm.trim() !== '';
  const headTitle = isSearching
    ? `Search: ${searchTerm} | Pupscribe Catalogue`
    : activeBrand
      ? `${activeBrand} | Pupscribe Catalogue`
      : 'Product Catalogue | Pupscribe';
  const headDescription =
    activeBrand && activeBrand !== 'New Arrivals'
      ? `Browse ${activeBrand} products in the Pupscribe product catalogue.`
      : 'Browse the latest pet products in the Pupscribe product catalogue.';

  return (
    <>
    <Head>
      <title>{headTitle}</title>
      <meta name='description' content={headDescription} />
      <meta property='og:title' content={headTitle} />
      <meta property='og:description' content={headDescription} />
      <meta property='og:type' content='website' />
    </Head>
    {/* Global keyframe for card stagger animation */}
    <style>{`
      @keyframes catalogueFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // Fill the Layout container (which already spans the viewport minus the
        // sticky header) rather than forcing an extra full 100vh on top of it —
        // the latter left empty scrollable space below the grid, which the
        // scroll-to-bottom button would jump into.
        flexGrow: 1,
        width: "100%",
        bgcolor: "background.default",
        backgroundImage: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)'
          : 'radial-gradient(circle, rgba(0,0,0,0.038) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Compact sticky header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{
            maxWidth: '1400px',
            margin: '0 auto',
            px: { xs: 2, md: 3 },
            py: { xs: 1.25, md: 1.5 },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, md: 3 },
          }}
        >
          {/* Brand / Title */}
          <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { sm: '1.05rem', md: '1.15rem' },
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #A796FF 0%, #8D7BF2 100%)'
                  : 'linear-gradient(135deg, #4633B8 0%, #6A5AD1 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              Product Catalogue
            </Typography>
          </Box>

          {/* Search — always visible */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 560 }, mx: 'auto' }}>
            <TextField
              placeholder="Search products by name or SKU..."
              variant="outlined"
              fullWidth
              size="small"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: 'text.secondary', mr: 0.5, fontSize: '1.1rem' }} />
                ),
                endAdornment: inputValue ? (
                  <IconButton
                    size="small"
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    sx={{ p: 0.25 }}
                  >
                    <Close sx={{ fontSize: '1rem' }} />
                  </IconButton>
                ) : loading ? (
                  <CircularProgress color="inherit" size={16} />
                ) : null,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: "1400px", margin: "0 auto", width: "100%", p: { xs: 2, sm: 2.5, md: 3 } }}>

        {/* Tabs and Sorting Controls */}
        <Box display="flex" flexDirection={"column"} gap={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
          {/* Search results header */}
          {isSearching && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {loading
                  ? `Searching for “${searchTerm}”…`
                  : `${totalProductCount.toLocaleString('en-IN')} result${totalProductCount === 1 ? '' : 's'} for “${searchTerm}” across all brands`}
              </Typography>
              <Button size="small" onClick={handleClearSearch}>
                Clear search
              </Button>
            </Box>
          )}

          {isMobile || isTablet ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="brand-select-label">Brand</InputLabel>
              <Select
                labelId="brand-select-label"
                id="brand-select"
                value={activeBrand}
                label="Brand"
                disabled={isSearching}
                onChange={(e) => handleBrandTabChange(e.target.value)}
                sx={{ '& .MuiSelect-select': { whiteSpace: 'normal', py: 1 } }}
                renderValue={(selected) => {
                  const selectedBrand = brandList.find((b) => b.brand === selected);
                  const selectedAccent = getBrandAccent(
                    selectedBrand?.brand,
                    selectedBrand?.color,
                    themeMode
                  );
                  const selectedCount = brandCountOf(selectedBrand?.brand || '');
                  return (
                    <Box display="flex" alignItems="center" gap={1.25} minWidth={0} width="100%">
                      {(selectedBrand?.image || selectedBrand?.url) ? (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            p: '2px',
                          }}
                        >
                          <Box
                            component="img"
                            src={selectedBrand.image || selectedBrand.url || ''}
                            alt={selectedBrand.brand}
                            loading="lazy"
                            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '6px',
                            backgroundColor: selectedAccent.soft,
                            color: selectedAccent.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: 800,
                          }}
                        >
                          {brandDisplayName(selectedBrand?.brand).slice(0, 2).toUpperCase()}
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.25,
                            // Two lines before ellipsis — the longer brand names
                            // need the second one.
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {brandDisplayName(selectedBrand?.brand)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: selectedAccent.main,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {selectedCount} products
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              >
                {brandList.map((b, index) => {
                  const brandCount = brandCountOf(b.brand);
                  const accent = getBrandAccent(b.brand, b.color, themeMode);
                  // Same collections/brands split as the desktop rail.
                  const startsBrands = firstBrandIndex > 0 && index === firstBrandIndex;
                  return (
                    <MenuItem
                      key={b.brand}
                      value={b.brand}
                      sx={{
                        py: 1,
                        whiteSpace: 'normal',
                        ...(startsBrands && {
                          borderTop: '1px solid',
                          borderTopColor: 'divider',
                          mt: 0.5,
                          pt: 1.5,
                        }),
                        '&&.Mui-selected': {
                          backgroundColor: accent.soft,
                          boxShadow: `inset 3px 0 0 ${accent.main}`,
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} width="100%" minWidth={0}>
                        {(b.image || b.url) ? (
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
                              src={(b.image || b.url) as string}
                              alt={b.brand}
                              width={48}
                              height={48}
                              style={{ objectFit: 'contain' }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '6px',
                              backgroundColor: accent.soft,
                              color: accent.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 800,
                              fontSize: '1.05rem',
                            }}
                          >
                            {brandDisplayName(b.brand).slice(0, 2).toUpperCase()}
                          </Box>
                        )}
                        <Box display="flex" flexDirection="column" flex={1} minWidth={0}>
                          <Typography variant="h6" fontWeight="medium">
                            {brandDisplayName(b.brand)}
                          </Typography>
                          {/* No description here — the dropdown stays a compact
                              picker, and the spotlight below carries the copy. */}
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.25,
                              color: accent.main,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {brandCount} products
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
              {isSearching && (
                <FormHelperText>
                  Search spans all brands — clear the search to browse by brand.
                </FormHelperText>
              )}
            </FormControl>
          ) : (
            !isSearching && (
              <Tabs
                value={activeBrand || (brandList[0] ? brandList[0].brand : "")}
                onChange={(e, newValue) => handleBrandTabChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="inherit"
                // The selection indicator is drawn per-tab in the brand's own
                // accent colour, so the shared one is suppressed.
                TabIndicatorProps={{ sx: { display: "none" } }}
                sx={{
                  mt: 2,
                  ".MuiTab-root": {
                    textTransform: "none",
                    fontWeight: "bold",
                    padding: "12px 14px",
                    minHeight: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    transition: "all 0.2s ease-in-out",
                    color: "text.primary",
                    opacity: 1,
                    borderBottom: "3px solid transparent",
                    // Fixed width keeps the clamped category lines aligned and
                    // stops a long brand name from stretching one tab.
                    width: TAB_WIDTH,
                    minWidth: TAB_WIDTH,
                    maxWidth: TAB_WIDTH,
                    alignSelf: "stretch",
                    "&:hover": {
                      backgroundColor: "action.hover",
                      transform: "translateY(-2px)",
                    },
                  },
                  ".MuiTabs-flexContainer": { alignItems: "stretch" },
                }}
              >
                {brandList.map((b, index) => {
                  const brandCount = brandCountOf(b.brand);
                  const accent = getBrandAccent(b.brand, b.color, themeMode);
                  // First real brand after the collections carries the group
                  // divider on its left edge.
                  const startsBrands = firstBrandIndex > 0 && index === firstBrandIndex;
                  const tabDescription = isCollectionKey(b.brand)
                    ? COLLECTION_COPY[b.brand]?.description
                    : b.description || '';
                  const tabCategories = categorySummary(b.brand, productCounts[b.brand]);
                  return (
                    <Tab
                      key={b.brand}
                      value={b.brand}
                      title={tabDescription || undefined}
                      sx={{
                        ...(startsBrands && {
                          borderLeft: "1px solid",
                          borderLeftColor: "divider",
                          ml: 1.5,
                          pl: "26px !important",
                        }),
                        // Doubled ampersand so the per-brand accent outranks the
                        // shared ".MuiTab-root" rules on the Tabs sx.
                        "&&.Mui-selected": {
                          color: accent.main,
                          borderBottomColor: accent.main,
                          backgroundColor: accent.soft,
                        },
                        "&&.Mui-selected .brand-image": {
                          boxShadow: `0 0 0 2px ${accent.main}`,
                        },
                      }}
                      label={
                        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                          {(b.image || b.url) ? (
                            <Box
                              className="brand-image"
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                p: '4px',
                              }}
                            >
                              <Image
                                src={(b.image || b.url) as string}
                                alt={b.brand}
                                width={72}
                                height={72}
                                style={{ objectFit: "contain" }}
                              />
                            </Box>
                          ) : (
                            // Brands with no logo yet still need a tile the same
                            // size, or the rail height jumps.
                            <Box
                              className="brand-image"
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '8px',
                                backgroundColor: accent.soft,
                                color: accent.main,
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontWeight: 800,
                                fontSize: '1.4rem',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {brandDisplayName(b.brand).slice(0, 2).toUpperCase()}
                            </Box>
                          )}
                          <Box textAlign="center">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.2 }}
                            >
                              {brandDisplayName(b.brand)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                display: 'block',
                                mt: 0.5,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              ({brandCount})
                            </Typography>
                            {/* The categories this brand stocks. The description
                                is too long to clamp usefully here — it rides in
                                the hover tooltip and the brand dialog instead. */}
                            {tabCategories && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  fontSize: '0.68rem',
                                  lineHeight: 1.35,
                                  fontWeight: 400,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  whiteSpace: 'normal',
                                }}
                              >
                                {tabCategories}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
            )
          )}

          {/* Says what the selected entry actually is — the rail is for
              choosing, this is for telling. Desktop gets the compact strip
              (the rail above already shows every brand); phones and tablets,
              where the rail is a one-at-a-time dropdown, get the swipeable
              spotlight. Hidden while searching, where brand context is
              meaningless. */}
          {!isSearching &&
            (isMobile || isTablet ? (
              <BrandSpotlight
                entries={brandList}
                activeBrand={selectedBrandEntry?.brand || activeBrand}
                onSelectBrand={handleBrandTabChange}
                countsByBrand={productCounts}
                displayNameOf={brandDisplayName}
                onSelectCategory={handleCategoryTabChange}
                onOpenDetails={openBrandInfo}
              />
            ) : (
              <BrandStrip
                entry={selectedBrandEntry}
                count={brandCountOf(selectedBrandEntry?.brand || '')}
                displayName={brandDisplayName(selectedBrandEntry?.brand)}
                onOpenDetails={openBrandInfo}
              />
            ))}

          <BrandInfoDialog
            open={brandInfoOpen}
            onClose={closeBrandInfo}
            entries={brandList}
            activeBrand={selectedBrandEntry?.brand || activeBrand}
            onSelectBrand={handleBrandTabChange}
            countsByBrand={productCounts}
            displayNameOf={brandDisplayName}
            onCategorySelect={handleCategoryTabChange}
          />

          {/* Category Controls */}
          <Box>
            {isMobile || isTablet ? (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={activeCategory}
                  label="Category"
                  disabled={isSearching}
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
            ) : (
              !isSearching &&
              activeBrand &&
              (categoriesByBrand[activeBrand] || []).length > 0 && (
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      mb: 1,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: 'text.secondary',
                    }}
                  >
                    Categories
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    {categoriesByBrand[activeBrand].map((cat) => {
                      const catCount = productCounts[activeBrand]?.[cat] || 0;
                      const isActive = (activeCategory || categoriesByBrand[activeBrand][0]) === cat;
                      // Categories inherit the selected brand's accent, so the
                      // whole brand→category path reads as one colour.
                      const accent = getBrandAccent(
                        selectedBrandEntry?.brand,
                        selectedBrandEntry?.color,
                        themeMode
                      );
                      return (
                        <Chip
                          key={cat}
                          label={`${cat} (${catCount})`}
                          onClick={() => handleCategoryTabChange(cat)}
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderColor: isActive ? accent.main : 'divider',
                            color: isActive ? accent.main : 'text.primary',
                            bgcolor: isActive ? accent.soft : 'transparent',
                            '&:hover': {
                              boxShadow: 1,
                              bgcolor: accent.soft,
                              borderColor: accent.main,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )
            )}
          </Box>

          {/* Catalogue Toolbar */}
          <CatalogueToolbar
            totalProducts={totalProductCount}
            sortBy={sortOption}
            onSortChange={setSortOption}
            viewDensity={viewDensity}
            onViewDensityChange={setViewDensity}
            onToggleFilters={() => setFiltersOpen(true)}
            showFilterButton={isMobile || isTablet}
            activeFilterCount={activeFilterCount}
          />

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {isPriceFiltered && (
                <Chip
                  size="small"
                  label={`Price: ₹${priceRange[0].toLocaleString('en-IN')} – ₹${priceRange[1].toLocaleString('en-IN')}`}
                  onDelete={() => {
                    priceTouchedRef.current = false;
                    setPriceRange([0, maxPrice]);
                  }}
                />
              )}
              {selectedFilterCategories.map((cat) => (
                <Chip
                  key={cat}
                  size="small"
                  label={`Category: ${cat}`}
                  onDelete={() => handleCategoryFilterChange(cat)}
                />
              ))}
              {selectedFilterBrands.map((brand) => (
                <Chip
                  key={brand}
                  size="small"
                  label={`Brand: ${brand}`}
                  onDelete={() => handleBrandFilterChange(brand)}
                />
              ))}
              {showNewOnly && (
                <Chip
                  size="small"
                  label="New products only"
                  onDelete={() => setShowNewOnly(false)}
                />
              )}
              {!hideOutOfStock && (
                <Chip
                  size="small"
                  label="Including out of stock"
                  onDelete={() => setHideOutOfStock(true)}
                />
              )}
              <Button size="small" onClick={handleClearFilters}>
                Clear all
              </Button>
            </Box>
          )}

          {/* Main Content with Filters and Products */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {/* Filters — sidebar on desktop, drawer on mobile (handled internally) */}
            <CatalogueFilters
              priceRange={priceRange}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
              selectedCategories={selectedFilterCategories}
              allCategories={allFilterCategories}
              onCategoryChange={handleCategoryFilterChange}
              selectedBrands={selectedFilterBrands}
              allBrands={allFilterBrands}
              onBrandChange={handleBrandFilterChange}
              showNewOnly={showNewOnly}
              onNewOnlyChange={setShowNewOnly}
              hideOutOfStock={hideOutOfStock}
              onHideOutOfStockChange={setHideOutOfStock}
              onClearFilters={handleClearFilters}
              activeBrand={activeBrand}
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            />

            {/* Products Grid */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: { xs: 2, md: 3 },
                  boxShadow: { xs: 2, md: 3 },
                  p: { xs: 2, sm: 2.5, md: 3 },
                  minHeight: '400px',
                  width: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {loading || loadingOutOfStock ? (
                  // Loading skeletons
                  <Box sx={gridSx}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <ProductCardSkeleton key={i} variant="card" />
                    ))}
                  </Box>
                ) : filteredAndSortedItems.length > 0 ? (
                  <>
                    <Box sx={gridSx}>
                      {visibleItems.map((item, index) => {
                        const animDelay = `${Math.min((index % RENDER_CHUNK) * 35, 560)}ms`;
                        const animStyle = {
                          animation: 'catalogueFadeUp 0.42s ease both',
                          animationDelay: animDelay,
                          display: 'flex',
                          flexDirection: 'column' as const,
                          height: '100%',
                        };
                        if (item.type === 'group') {
                          return (
                            <Box key={item.groupId} sx={animStyle}>
                              <CatalogueProductGroupCard
                                baseName={item.baseName || ""}
                                products={(item.products || []) as any}
                                primaryProduct={item.primaryProduct as any}
                                onQuickView={(product, variants) => handleQuickView(product, variants)}
                                viewDensity={viewDensity}
                              />
                            </Box>
                          );
                        } else {
                          return (
                            <Box key={item.product?._id} sx={animStyle}>
                              <CatalogueProductCard
                                product={item.product as any}
                                onQuickView={(product) => handleQuickView(product as Product, [])}
                                viewDensity={viewDensity}
                              />
                            </Box>
                          );
                        }
                      })}
                    </Box>
                    {hasMoreToRender && (
                      <Box
                        ref={loadMoreRef}
                        sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      mt: 4,
                      p: 6,
                      width: '100%',
                      borderRadius: 3,
                      border: '2px dashed',
                      borderColor: 'divider',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No products found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or search criteria
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{ mt: 2 }}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                )}

                {/* Out of Stock Products Section - exclude from New Arrivals */}
                {!hideOutOfStock && outOfStockProducts.length > 0 && activeBrand !== "New Arrivals" && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Out of Stock Products
                    </Typography>
                    <Box sx={gridSx}>
                      {outOfStockItems.length > 0 ? (
                        outOfStockItems.map((item) => {
                          if (item.type === 'group') {
                            return (
                              <CatalogueProductGroupCard
                                key={item.groupId}
                                baseName={item.baseName || ""}
                                products={(item.products || []) as any}
                                primaryProduct={item.primaryProduct as any}
                                onQuickView={(product, variants) => handleQuickView(product, variants)}
                                viewDensity={viewDensity}
                                isOutOfStock={true}
                              />
                            );
                          } else {
                            const product = item.product as Product;
                            return (
                              <CatalogueProductCard
                                key={product._id}
                                product={product as any}
                                onQuickView={(p) => handleQuickView(p as Product, [])}
                                viewDensity={viewDensity}
                                isOutOfStock={true}
                              />
                            );
                          }
                        })
                      ) : (
                        // Fallback for non-grouped response
                        outOfStockProducts.map((product: Product) => (
                          <CatalogueProductCard
                            key={product._id}
                            product={product as any}
                            onQuickView={(p) => handleQuickView(p as Product, [])}
                            viewDensity={viewDensity}
                            isOutOfStock={true}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

        </Box>

        {/* Scroll to top / bottom — same control as the order-form Products step */}
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: theme.spacing(3), sm: theme.spacing(4), md: theme.spacing(5) },
            right: { xs: theme.spacing(1.5), sm: theme.spacing(2), md: theme.spacing(3) },
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
            isMobile={isMobile}
          />
        </Box>

        <ImagePopupDialog
          open={openImagePopup}
          onClose={handleClosePopup}
          imageSources={popupImageSrc}
          initialSlide={popupImageIndex}
          setIndex={(newIndex: number) => {
            setPopupImageIndex(newIndex);
          }}
        />

        {/* Quick View Modal */}
        <QuickViewModal
          open={showQuickView}
          onClose={handleCloseQuickView}
          product={quickViewProduct}
          allVariants={quickViewVariants}
          handleImageClick={handleImageClick}
        />
      </Box>
    </Box>
    </>
  )
}
