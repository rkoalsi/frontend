import {
  Box,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, ArrowDownward, ArrowUpward, Close } from '@mui/icons-material';
import axios from 'axios';
import {
  type Product as GroupProduct,
  type ProductGroup as GroupProductGroup
} from '../../src/util/groupProducts';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import Image from 'next/image';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import ProductCardSkeleton from '../../src/components/common/ProductCardSkeleton';
import CatalogueProductCard from '../../src/components/OrderForm/products/CatalogueProductCard';
import CatalogueProductGroupCard from '../../src/components/OrderForm/products/CatalogueProductGroupCard';
import CatalogueFilters from '../../src/components/OrderForm/products/CatalogueFilters';
import CatalogueToolbar, { type ViewDensity, type SortOption } from '../../src/components/OrderForm/products/CatalogueToolbar';
import QuickViewModal from '../../src/components/OrderForm/products/QuickViewModal';

interface Product extends GroupProduct {
  category: string;
  brand?: string;
  item_tax_preferences: any;
}

interface ProductGroup extends Omit<GroupProductGroup, 'products' | 'primaryProduct'> {
  products: Product[];
  primaryProduct: Product;
}

interface CatalogueResponse {
  products?: Product[];
  items?: Array<{
    type: 'group' | 'product';
    groupId?: string;
    baseName?: string;
    products?: Product[];
    primaryProduct?: Product;
    product?: Product;
  }>;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  brands: string[];
  brand?: string;
  category?: string;
  search?: string;
}


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
export default function AllProductsCatalouge() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const pageTopRef = useRef<HTMLDivElement>(null);
  const pageBottomRef = useRef<HTMLDivElement>(null);
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const getUrlParam = (key: string) =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get(key) || "").replace(/-/g, " ")
      : "";
  const [searchTerm, setSearchTerm] = useState(() => getUrlParam("search"));
  const [inputValue, setInputValue] = useState(() => getUrlParam("search")); // Local state for input to prevent re-renders
  const [brandList, setBrandList] = useState<{ brand: string; url: string }[]>(
    []
  );
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex]: any = useState(0);
  const [groupByProductName, setGroupByProductName] = useState<boolean>(true);
  const [activeBrand, setActiveBrand] = useState<string>(() => getUrlParam("brand"));
  const [activeCategory, setActiveCategory] = useState<string>(() => getUrlParam("category"));
  const [categoriesByBrand, setCategoriesByBrand] = useState<{
    [key: string]: string[];
  }>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [noMoreProducts, setNoMoreProducts] = useState<{
    [key: string]: boolean;
  }>({});
  const [sortOrder, setSortOrder] = useState<string>("default");
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { page: number; hasMore: boolean };
  }>({});
  const [searchExpanded, setSearchExpanded] = useState<boolean>(false);
  const activeCategoryRef = useRef(activeCategory);

  // Catalogue-specific state
  const [viewDensity, setViewDensity] = useState<ViewDensity>('4x4');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<string[]>([]);
  const [selectedFilterBrands, setSelectedFilterBrands] = useState<string[]>([]);
  const [showNewOnly, setShowNewOnly] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<Product[]>([]);
  const [showQuickView, setShowQuickView] = useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [loadingOutOfStock, setLoadingOutOfStock] = useState<boolean>(false);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const handleImageClick = useCallback((srcList: string[], index: number) => {
    if (Array.isArray(srcList)) {
      const formattedImages = srcList?.map((src) => ({ src }));
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
    if (searchTerm.trim() !== "") {
      return "search";
    }
    return groupByCategory && activeCategory
      ? `all-${activeCategory}`
      : activeBrand && activeCategory
        ? `${activeBrand}-${activeCategory}`
        : "all";
  }, [searchTerm, activeBrand, activeCategory, groupByCategory]);
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

  // Get all unique categories and brands for filters
  const allFilterCategories = useMemo(() => {
    const categories = new Set<string>();
    if (itemsData) {
      itemsData.forEach((item: any) => {
        const product = item.type === 'group' ? item.primaryProduct : item.product;
        if (product?.category) categories.add(product.category);
      });
    }
    return Array.from(categories).sort();
  }, [itemsData]);

  const allFilterBrands = useMemo(() => {
    const brands = new Set<string>();
    if (itemsData) {
      itemsData.forEach((item: any) => {
        const product = item.type === 'group' ? item.primaryProduct : item.product;
        if (product?.brand) brands.add(product.brand);
      });
    }
    return Array.from(brands).sort();
  }, [itemsData]);

  // Calculate max price for filter slider
  const maxPrice = useMemo(() => {
    if (!itemsData || itemsData.length === 0) return 100000;
    let max = 0;
    itemsData.forEach((item: any) => {
      const product = item.type === 'group' ? item.primaryProduct : item.product;
      if (product?.rate && product.rate > max) max = product.rate;
    });
    return Math.ceil(max / 1000) * 1000; // Round up to nearest 1000
  }, [itemsData]);

  // Update price range when max price changes
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // Display brand list - replace "New Arrivals" with "Out Of Stock" when viewing out of stock products
  // Also filter out brands without out of stock products

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!itemsData) return [];

    // Apply filters
    let filtered = itemsData.filter((item: any) => {
      const product = item.type === 'group' ? item.primaryProduct : item.product;
      if (!product) return false;

      // Price filter
      if (product.rate < priceRange[0] || product.rate > priceRange[1]) return false;

      // Category filter
      if (selectedFilterCategories.length > 0 && !selectedFilterCategories.includes(product.category)) return false;

      // Brand filter
      if (selectedFilterBrands.length > 0 && !selectedFilterBrands.includes(product.brand)) return false;

      // New only filter
      if (showNewOnly && !product.new) return false;

      return true;
    });

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const productA = a.type === 'group' ? a.primaryProduct : a.product;
      const productB = b.type === 'group' ? b.primaryProduct : b.product;

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
          // New products first
          if (productA?.new && !productB?.new) return -1;
          if (!productA?.new && productB?.new) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [itemsData, priceRange, selectedFilterCategories, selectedFilterBrands, showNewOnly, sortOption]);

  // Calculate total product count including all variants
  const totalProductCount = useMemo(() => {
    if (!filteredAndSortedItems) return 0;
    return filteredAndSortedItems.reduce((total: number, item: any) => {
      if (item.type === 'group') {
        // For groups, count all products in the group
        return total + (item.products?.length || 1);
      } else {
        // For individual products, count as 1
        return total + 1;
      }
    }, 0);
  }, [filteredAndSortedItems]);
  const [productCounts, setProductCounts] = useState<{
    [brand: string]: { [category: string]: number };
  }>({});
  const showError = useCallback((msg: string) => toast.error(msg), []); // No debounce for errors
  const debouncedSuccess = useCallback((msg: string) => {
    toast.success(msg);
  }, []);

  const fetchOutOfStockProducts = useCallback(async () => {
    try {
      setLoadingOutOfStock(true);

      // Handle "New Arrivals" brand specially - don't pass brand parameter
      const brandParam = activeBrand === "New Arrivals" ? undefined : activeBrand;
      const categoryParam = (activeBrand === "New Arrivals" || activeCategory === "All Products") ? undefined : activeCategory;

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

  // No pre-order/notify on catalogue page - display only

  const fetchAllBrands = useCallback(async () => {
    try {
      setLoading(true);
      // Use the combined init endpoint — returns brands + counts + categories + first-page products in one shot
      const initialBrand = activeBrand || "New Arrivals";
      const response = await axios.get(
        `${process.env.api_url}/products/catalogue/init`,
        { params: { brand: initialBrand } }
      );

      const allBrands: { brand: string; url: string }[] = response.data.brands || [];
      const newArrivalsBrand = {
        brand: "New Arrivals",
        url: "https://assets.pupscribe.in/brands/new-arrivals.svg",
      };
      const brandsWithNewArrivals = [newArrivalsBrand, ...allBrands];

      setBrandList(brandsWithNewArrivals);
      setProductCounts(response.data.counts || {});

      const resolvedBrand = activeBrand || brandsWithNewArrivals[0]?.brand || "New Arrivals";
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
      const key = resolvedBrand === "New Arrivals" ? "New Arrivals-All Products" : `${resolvedBrand}-${cats[0] || ""}`;
      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: { items } as any,
        // Also store under the standard productsKey pattern used elsewhere
        ...(resolvedBrand === "New Arrivals" ? { all: { items } as any } : {}),
        [`${resolvedBrand}-${cats[0] || ""}`]: { items } as any,
      }));

      setTotal(items.length);

      setProductsByBrandCategory((prev) =>
        brandsWithNewArrivals.reduce(
          (acc, brandObj) => ({ ...acc, [brandObj.brand]: acc[brandObj.brand] || [] }),
          { ...prev }
        )
      );
    } catch (error) {
      showError("Failed to fetch catalogue data.");
    } finally {
      setLoading(false);
    }
  }, [activeBrand, showError]);

  const fetchProductCounts = useCallback(async () => {
    // Counts are now fetched inside fetchAllBrands via the init endpoint.
    // This stub is kept so existing call-sites don't need updating.
  }, []);

  // Keep ref in sync so fetchCategoriesForBrand can read it without being in deps
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  const fetchCategoriesForBrand = useCallback(async (brand: string) => {
    if (brand === "New Arrivals") {
      const categories = ["All Products"];
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
      showError("Failed to fetch categories.");
    }
  }, [showError]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all products by making multiple requests if needed
      let totalPages = 1;

      const firstParams: any = {
        page: 1,
        per_page: 200,
        group_by_name: true, // Request backend grouping
        sort: sortOrder, // Pass sort order to prioritize new products
      };

      // When searching, search across all brands (don't filter by brand/category)
      // Otherwise, handle "New Arrivals" specially - don't pass brand, pass new_only instead
      if (searchTerm) {
        firstParams.search = searchTerm;
      } else {
        const brandParam = activeBrand === "New Arrivals" ? undefined : activeBrand;
        const categoryParam = activeBrand === "New Arrivals" || activeCategory === "All Products" ? undefined : activeCategory;
        const newOnly = activeBrand === "New Arrivals" ? true : undefined;

        if (brandParam) firstParams.brand = brandParam;
        if (categoryParam) firstParams.category = categoryParam;
        if (newOnly) firstParams.new_only = newOnly;
      }

      const firstResponse = await axios.get<CatalogueResponse>(
        `${process.env.api_url}/products/catalogue/all_products`,
        { params: firstParams }
      );

      let allItems = firstResponse.data.items || [];
      totalPages = firstResponse.data.total_pages;
      setBrands(firstResponse.data.brands);

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        const remainingRequests = [];
        for (let page = 2; page <= totalPages; page++) {
          const params: any = {
            page,
            per_page: 200,
            group_by_name: true,
            sort: sortOrder, // Pass sort order to maintain consistency
          };
          // When searching, search across all brands (don't filter by brand/category)
          if (searchTerm) {
            params.search = searchTerm;
          } else {
            const brandParam = activeBrand === "New Arrivals" ? undefined : activeBrand;
            const categoryParam = activeBrand === "New Arrivals" || activeCategory === "All Products" ? undefined : activeCategory;
            const newOnly = activeBrand === "New Arrivals" ? true : undefined;

            if (brandParam) params.brand = brandParam;
            if (categoryParam) params.category = categoryParam;
            if (newOnly) params.new_only = newOnly;
          }

          remainingRequests.push(
            axios.get<CatalogueResponse>(
              `${process.env.api_url}/products/catalogue/all_products`,
              { params }
            )
          );
        }

        const remainingResponses = await Promise.all(remainingRequests);
        remainingResponses.forEach(response => {
          if (response.data.items) {
            allItems = [...allItems, ...response.data.items];
          }
        });
      }

      // Store the items in productsByBrandCategory for the rendering logic
      // Sort items to prioritize new products first
      const sortedItems = [...allItems].sort((a, b) => {
        // Extract the product from the item (handle both group and product types)
        const getProduct = (item: any) => {
          if (item.type === 'group') return item.primaryProduct;
          if (item.type === 'product') return item.product;
          return null;
        };

        const productA = getProduct(a);
        const productB = getProduct(b);

        // If both products exist, prioritize new products
        if (productA && productB) {
          const isNewA = productA.new === true;
          const isNewB = productB.new === true;

          // New products come first
          if (isNewA && !isNewB) return -1;
          if (!isNewA && isNewB) return 1;
        }

        // Keep original order if both are new or both are not new
        return 0;
      });

      const key = searchTerm.trim() !== ""
        ? "search"
        : groupByCategory
          ? `all-${activeCategory}`
          : activeBrand && activeCategory
            ? `${activeBrand}-${activeCategory}`
            : "all";

      setProductsByBrandCategory((prev) => ({
        ...prev,
        [key]: { items: sortedItems } as any
      }));

      setTotal(sortedItems.length);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [activeBrand, searchTerm, groupByCategory, activeCategory, sortOrder]);




  // Infinite scroll disabled - we fetch all products at once
  // const loadMore = useCallback(() => {
  //   const key = groupByCategory
  //     ? `all-${activeCategory}`
  //     : `${activeBrand}-${activeCategory}`;

  //   if (!loadingMore && paginationState[key]?.hasMore) {
  //     const nextPage = (paginationState[key]?.page || 1) + 1;
  //     fetchProducts();
  //   }
  // }, [
  //   activeBrand,
  //   activeCategory,
  //   groupByCategory,
  //   loadingMore,
  //   paginationState,
  //   fetchProducts,
  // ]);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  // Catalogue handlers
  const handleQuickView = useCallback((product: Product, variants: Product[] = []) => {
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
    setSelectedFilterCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleBrandFilterChange = useCallback((brand: string) => {
    setSelectedFilterBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setPriceRange([0, maxPrice]);
    setSelectedFilterCategories([]);
    setSelectedFilterBrands([]);
    setShowNewOnly(false);
  }, [maxPrice]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
  };

  const scrollToTop = useCallback(() => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    pageBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pupscribe New Arrivals',
          text: 'Check out our latest products!',
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  useEffect(() => {
    fetchAllBrands();
    fetchProductCounts();
  }, []); // Only run once on mount

  // Keep URL in sync with active brand and search
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    activeBrand ? params.set("brand", activeBrand.replace(/\s+/g, "-")) : params.delete("brand");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeBrand]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    searchTerm ? params.set("search", searchTerm) : params.delete("search");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    activeCategory ? params.set("category", activeCategory.replace(/\s+/g, "-")) : params.delete("category");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeCategory]);

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

  const resetPaginationAndFetch = useCallback(
    (brand: string, category: string) => {
      let key = "";
      if (groupByCategory) {
        key = `all-${category}`;
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        fetchProducts();
      } else {
        key = `${brand}-${category}`;
        setPaginationState((prev) => ({
          ...prev,
          [key]: { page: 1, hasMore: true },
        }));
        setProductsByBrandCategory((prev) => ({ ...prev, [key]: [] }));
        fetchProducts();
      }
    },
    [groupByCategory, fetchProducts]
  );

  const handleTabChange = useCallback(
    debounce((newBrand: string) => {
      setActiveBrand(newBrand);
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
  const allCategoryCounts = useMemo(() => {
    const counts: { [category: string]: number } = {};
    Object.values(productCounts).forEach((brandCounts) => {
      Object.entries(brandCounts).forEach(([cat, count]) => {
        counts[cat] = (counts[cat] || 0) + count;
      });
    });
    return counts;
  }, [productCounts]);


  // Create a stable debounced search function using useRef
  const debouncedSearch = useRef(
    debounce((search: string) => {
      setSearchTerm(search);
    }, 500) // 500ms debounce
  ).current;

  const handleInputChange = useCallback(
    (event: any, value: string) => {
      // Update input value immediately for responsive typing
      setInputValue(value);
      // Debounce the actual search
      debouncedSearch(value);
    },
    [debouncedSearch]
  );




  return (
    <>
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
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)'
          : 'radial-gradient(circle, rgba(0,0,0,0.038) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Reference for top of page */}
      <div ref={pageTopRef} />

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
                  ? 'linear-gradient(135deg, #9c92d8 0%, #7c6fcd 100%)'
                  : 'linear-gradient(135deg, #2a4a6b 0%, #456089 100%)',
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
              onChange={(e) => handleInputChange(e, e.target.value)}
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
                    onClick={() => {
                      setInputValue('');
                      setSearchTerm('');
                    }}
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
                        (b: any) => b.brand === selected
                      );
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {(selectedBrand?.image || selectedBrand?.url) && (
                            <Box
                              sx={{
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
                              }}
                            >
                              <Box
                                component="img"
                                src={selectedBrand.image || selectedBrand.url}
                                alt={selectedBrand.brand}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          )}
                          <Typography variant="h6">
                            {selectedBrand?.brand}
                          </Typography>
                        </Box>
                      );
                    }}
                  >
                    {brandList.map((b: any) => {
                      const actualBrand = b.brand === "Out Of Stock" ? "New Arrivals" : b.brand;
                      const brandCount = productCounts[actualBrand]
                        ? Object.values(productCounts[actualBrand]).reduce((a, b) => a + b, 0)
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
                    value={activeBrand || (brandList[0] ? brandList[0].brand : "")}
                    onChange={(e, newValue) => handleTabChange(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                      bgcolor: "background.paper",
                      borderRadius: 3,
                      p: 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: "1px solid",
                      borderColor: "divider",
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        padding: "10px 16px",
                        minHeight: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.75,
                        color: "text.secondary",
                        opacity: 1,
                        borderRadius: 2,
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          color: "text.primary",
                          "& .brand-logo": {
                            boxShadow: "0 0 0 2px rgba(42,74,107,0.2)",
                          },
                        },
                      },
                      ".Mui-selected": {
                        color: "primary.main !important" as any,
                        "& .brand-logo": {
                          boxShadow: theme.palette.mode === 'dark'
                            ? "0 0 0 2.5px #7fa8cc"
                            : "0 0 0 2.5px #2a4a6b",
                        },
                        "& .MuiTypography-root": {
                          color: "primary.main !important" as any,
                          fontWeight: 700,
                        },
                      },
                      ".MuiTabs-indicator": { display: "none" },
                    }}
                  >
                    {brandList.map((b: any) => {
                      const actualBrand = b.brand === "Out Of Stock" ? "New Arrivals" : b.brand;
                      const brandCount = productCounts[actualBrand]
                        ? Object.values(productCounts[actualBrand]).reduce((a, b) => a + b, 0)
                        : 0;
                      return (
                        <Tab
                          key={b.brand}
                          value={b.brand}
                          label={
                            <Box display="flex" flexDirection="column" alignItems="center" gap={0.75}>
                              {(b.image || b.url) && (
                                <Box
                                  className="brand-logo"
                                  sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '50%',
                                    backgroundColor: '#ffffff',
                                    transition: 'box-shadow 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    p: '3px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Image
                                    src={b.image || b.url}
                                    alt={b.brand}
                                    width={46}
                                    height={46}
                                    style={{ objectFit: "contain", borderRadius: '50%' }}
                                  />
                                </Box>
                              )}
                              <Box textAlign="center">
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.78rem', lineHeight: 1.2, display: 'block' }}
                                >
                                  {b.brand}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{ fontSize: '0.65rem', display: "block" }}
                                >
                                  {brandCount}
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
                        const actualBrand = activeBrand === "Out Of Stock" ? "New Arrivals" : activeBrand;
                        const catCount = productCounts[actualBrand]?.[cat] || 0;
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
                    {allCategories.map((cat) => (
                      <Chip
                        key={cat}
                        label={`${cat} (${allCategoryCounts[cat] || 0})`}
                        onClick={() => handleCategoryTabChange(cat)}
                        color={(activeCategory || allCategories[0]) === cat ? 'primary' : 'default'}
                        variant={(activeCategory || allCategories[0]) === cat ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { boxShadow: 1 },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                !searchTerm.trim() &&
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
                        const actualBrand = activeBrand === "Out Of Stock" ? "New Arrivals" : activeBrand;
                        const catCount = productCounts[actualBrand]?.[cat] || 0;
                        const isActive = (activeCategory || categoriesByBrand[activeBrand][0]) === cat;
                        return (
                          <Chip
                            key={cat}
                            label={`${cat} (${catCount})`}
                            onClick={() => handleCategoryTabChange(cat)}
                            color={isActive ? 'primary' : 'default'}
                            variant={isActive ? 'filled' : 'outlined'}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': { boxShadow: 1 },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )
              )}
            </Box>
          )}
          {/* Catalogue Toolbar */}
          <CatalogueToolbar
            totalProducts={totalProductCount}
            sortBy={sortOption}
            onSortChange={setSortOption}
            viewDensity={viewDensity}
            onViewDensityChange={setViewDensity}
            onToggleFilters={() => setFiltersOpen(true)}
            showFilterButton={isMobile || isTablet}
          />

          {/* Main Content with Filters and Products */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {/* Filters Sidebar - Desktop */}
            {!isMobile && !isTablet && (
              <CatalogueFilters
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceChange={setPriceRange}
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
              />
            )}

            {/* Filters Drawer - Mobile */}
            {(isMobile || isTablet) && (
              <CatalogueFilters
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceChange={setPriceRange}
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
            )}

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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        lg: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        xl: viewDensity === '5x5' ? 'repeat(5, 1fr)' : viewDensity === '4x4' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                      },
                      gap: { xs: 2, sm: 2, md: viewDensity === '5x5' ? 2 : 2.5 },
                      width: '100%',
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <ProductCardSkeleton key={i} variant="card" />
                    ))}
                  </Box>
                ) : filteredAndSortedItems.length > 0 ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        lg: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        xl: viewDensity === '5x5' ? 'repeat(5, 1fr)' : viewDensity === '4x4' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                      },
                      gap: { xs: 2, sm: 2, md: viewDensity === '5x5' ? 2 : 2.5 },
                      width: '100%',
                    }}
                  >
                    {filteredAndSortedItems.map((item: any, index: number) => {
                      const animDelay = `${Math.min(index * 35, 560)}ms`;
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
                              baseName={item.baseName}
                              products={item.products}
                              primaryProduct={item.primaryProduct}
                              onQuickView={(product, variants) => handleQuickView(product, variants)}
                              viewDensity={viewDensity}
                            />
                          </Box>
                        );
                      } else {
                        return (
                          <Box key={item.product._id} sx={animStyle}>
                            <CatalogueProductCard
                              product={item.product}
                              onQuickView={(product) => handleQuickView(product, [])}
                              viewDensity={viewDensity}
                            />
                          </Box>
                        );
                      }
                    })}
                  </Box>
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
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                          lg: viewDensity === '5x5' ? 'repeat(4, 1fr)' : viewDensity === '4x4' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                          xl: viewDensity === '5x5' ? 'repeat(5, 1fr)' : viewDensity === '4x4' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                        },
                        gap: { xs: 2, sm: 2, md: viewDensity === '5x5' ? 2 : 2.5 },
                        width: '100%',
                      }}
                    >
                      {outOfStockItems.length > 0 ? (
                        outOfStockItems.map((item: any, index: number) => {
                          if (item.type === 'group') {
                            return (
                              <CatalogueProductGroupCard
                                key={item.groupId}
                                baseName={item.baseName}
                                products={item.products}
                                primaryProduct={item.primaryProduct}
                                onQuickView={(product, variants) => handleQuickView(product, variants)}
                                viewDensity={viewDensity}
                                isOutOfStock={true}
                              />
                            );
                          } else {
                            const product = item.product;
                            return (
                              <CatalogueProductCard
                                key={product._id}
                                product={product}
                                onQuickView={(p) => handleQuickView(p, [])}
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
                            product={product}
                            onQuickView={(p) => handleQuickView(p, [])}
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
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: theme.spacing(3), sm: theme.spacing(4), md: theme.spacing(5) },
            right: { xs: theme.spacing(1.5), sm: theme.spacing(2), md: theme.spacing(3) },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1, sm: 1.5 },
            zIndex: 1000,
            pointerEvents: 'none',
          }}
          className='no-pdf'
        >
          <Tooltip title="Scroll to top" placement="left">
            <IconButton
              color='primary'
              onClick={scrollToTop}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                width: { xs: 44, sm: 52, md: 56 },
                height: { xs: 44, sm: 52, md: 56 },
                boxShadow: { xs: 4, md: 6 },
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  boxShadow: 8,
                  transform: 'scale(1.1) translateY(-3px)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'auto',
              }}
            >
              <ArrowUpward fontSize={isMobile ? 'medium' : 'large'} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Scroll to bottom" placement="left">
            <IconButton
              color='primary'
              onClick={scrollToBottom}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                width: { xs: 44, sm: 52, md: 56 },
                height: { xs: 44, sm: 52, md: 56 },
                boxShadow: { xs: 4, md: 6 },
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  boxShadow: 8,
                  transform: 'scale(1.1) translateY(3px)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'auto',
              }}
            >
              <ArrowDownward fontSize={isMobile ? 'medium' : 'large'} />
            </IconButton>
          </Tooltip>
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

        {/* Reference for bottom of page */}
        <div ref={pageBottomRef} />
      </Box>
    </Box>
    </>
  )
}
