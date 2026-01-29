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
  Autocomplete,
  CircularProgress,
  Tab,
  Tabs,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  Table,
  Card,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, ArrowDownward, ArrowUpward } from '@mui/icons-material';
import axios from 'axios';
import {
  type Product as GroupProduct,
  type ProductGroup as GroupProductGroup
} from '../../src/util/groupProducts';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import Image from 'next/image';
import { useIntersectionObserver } from '../../src/hooks/useIntersectionObserver';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import ProductCardSkeleton from '../../src/components/common/ProductCardSkeleton';
import ImageCarousel from '../../src/components/OrderForm/products/ImageCarousel';
import ProductCard from '../../src/components/OrderForm/products/ProductCard';
import ProductGroupCard from '../../src/components/OrderForm/products/ProductGroupCard';
import ProductRow from '../../src/components/OrderForm/products/ProductRow';
import DoubleScrollTable, { DoubleScrollTableRef } from '../../src/components/OrderForm/DoubleScrollTable';
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
  const [displayedGroups, setDisplayedGroups] = useState<ProductGroup[]>([]);
  const [displayedUngrouped, setDisplayedUngrouped] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [openImagePopup, setOpenImagePopup] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(''); // Local state for input to prevent re-renders
  const [brandList, setBrandList] = useState<{ brand: string; url: string }[]>(
    []
  );
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [productsByBrandCategory, setProductsByBrandCategory] = useState<{
    [key: string]: SearchResult[];
  }>({});
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex]: any = useState(0);
  const [groupByProductName, setGroupByProductName] = useState<boolean>(true);
  const [activeBrand, setActiveBrand] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
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
  const tableScrollRef = useRef<DoubleScrollTableRef>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const [searchExpanded, setSearchExpanded] = useState<boolean>(false);

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

  const handleNotifyMe = useCallback(async (productId: string, productName: string) => {
    try {
      await axios.post(`${process.env.api_url}/products/notify-me`, {
        product_id: productId,
      });
      debouncedSuccess(`You will be notified when ${productName} is back in stock.`);
    } catch (error) {
      showError("Failed to register for notification.");
    }
  }, [debouncedSuccess, showError]);

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

  const fetchCategoriesForBrand = useCallback(async (brand: string) => {
    if (brand === "New Arrivals") {
      // For New Arrivals, show "All Products" category
      const categories = ["All Products"];
      setCategoriesByBrand((prev) => ({ ...prev, [brand]: categories }));
      setActiveCategory(categories[0]);
      return;
    }

    // For other brands, fetch brand-specific categories
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/categories`,
        { params: { brand } }
      );
      const cats = response.data.categories || [];
      setCategoriesByBrand((prev) => ({ ...prev, [brand]: cats }));
      if (cats.length > 0) {
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

      // Convert sorted backend-grouped items to frontend format
      const groups: ProductGroup[] = [];
      const ungrouped: Product[] = [];

      sortedItems.forEach(item => {
        if (item.type === 'group' && item.products && item.primaryProduct) {
          groups.push({
            groupId: item.groupId || '',
            baseName: item.baseName || '',
            products: item.products as Product[],
            primaryProduct: item.primaryProduct as Product,
          });
        } else if (item.type === 'product' && item.product) {
          ungrouped.push(item.product as Product);
        }
      });

      setTotal(sortedItems.length);
      setDisplayedGroups(groups);
      setDisplayedUngrouped(ungrouped);
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

  useEffect(() => {
    // Fetch categories when brand changes
    if (activeBrand) {
      fetchCategoriesForBrand(activeBrand);
    }
  }, [activeBrand, fetchCategoriesForBrand]);

  // Fetch out of stock products when brand or category changes
  useEffect(() => {
    if (activeBrand) {
      fetchOutOfStockProducts();
    }
  }, [activeBrand, activeCategory, fetchOutOfStockProducts]);

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
  const COLUMNS = [
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
    "UPC/EAN Code"
  ];




  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Reference for top of page */}
      <div ref={pageTopRef} />

      {/* Header Section with Title and Search */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: { xs: 2, md: 1 },
          backdropFilter: "blur(8px)",
          backgroundColor: { xs: "rgba(255, 255, 255, 0.98)", md: "white" },
        }}
      >
        <Box sx={{ maxWidth: "1400px", margin: "0 auto", p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          {/* Page Title */}
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: { xs: 0.25, sm: 0.5 },
                letterSpacing: '-0.5px',
              }}
            >
              All Products
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 400,
              }}
            >
              Browse our complete product catalogue across all brands
            </Typography>
          </Box>

          {/* Compact Search Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '600px', margin: '0 auto' }}>
            {/* Animated Search Icon */}
            <IconButton
              onClick={() => setSearchExpanded(!searchExpanded)}
              sx={{
                color: 'primary.main',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1) rotate(90deg)',
                },
                transform: searchExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                flexShrink: 0,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
              }}
              aria-label="toggle search"
            >
              <Search fontSize={isMobile ? "small" : "medium"} />
            </IconButton>

            {/* Expandable Search Bar */}
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                maxWidth: searchExpanded ? '100%' : { xs: 0, md: '100%' },
                opacity: searchExpanded ? 1 : { xs: 0, md: 1 },
              }}
            >
              <Autocomplete
                freeSolo
                options={options}
                value={null}
                inputValue={inputValue}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.name
                }
                onInputChange={handleInputChange}
                loading={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by name or SKU..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading && <CircularProgress color="inherit" size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: "1400px", margin: "0 auto", width: "100%", p: { xs: 2, sm: 2.5, md: 3 } }}>

        {/* Hide/Show Out of Stock Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant={hideOutOfStock ? "outlined" : "contained"}
            color="secondary"
            size="small"
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '24px',
              px: 3,
            }}
          >
            {hideOutOfStock ? "Show Out of Stock Products" : "Hide Out of Stock Products"}
          </Button>
        </Box>

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
                      bgcolor: "white",
                      borderRadius: 3,
                      p: 1.5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "1px solid",
                      borderColor: "grey.200",
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        padding: "16px 24px",
                        minHeight: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        color: "grey.700",
                        borderRadius: 2,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor: "grey.100",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      },
                      ".Mui-selected": {
                        backgroundColor: "#f0f9ff !important",
                        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)",
                        transform: "scale(1.02)",
                        "& .brand-image": {
                          boxShadow: "0 2px 8px rgba(2, 132, 199, 0.2)",
                        },
                        "& .MuiTypography-root": {
                          color: "#0c4a6e !important",
                          fontWeight: 700,
                        },
                      },
                      ".MuiTabs-indicator": {
                        display: "none",
                      },
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
                <Tabs
                  value={activeCategory || allCategories[0] || ""}
                  onChange={(e, newValue) => handleCategoryTabChange(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    bgcolor: "white",
                    borderRadius: 2,
                    p: 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid",
                    borderColor: "grey.200",
                    ".MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 600,
                      padding: "12px 24px",
                      color: "grey.700",
                      borderRadius: 2,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        backgroundColor: "grey.100",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      },
                    },
                    ".Mui-selected": {
                      backgroundColor: "#f0f9ff !important",
                      border: "2px solid #0284c7 !important",
                      color: "#0c4a6e !important",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(2, 132, 199, 0.15)",
                    },
                    ".MuiTabs-indicator": {
                      display: "none",
                    },
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
                      bgcolor: "white",
                      borderRadius: 2,
                      p: 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "1px solid",
                      borderColor: "grey.200",
                      mb: 2,
                      ".MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        padding: "12px 24px",
                        color: "grey.700",
                        borderRadius: 2,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor: "grey.100",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        },
                      },
                      ".Mui-selected": {
                        backgroundColor: "#f0f9ff !important",
                        border: "2px solid #0284c7 !important",
                        color: "#0c4a6e !important",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.15)",
                      },
                      ".MuiTabs-indicator": {
                        display: "none",
                      },
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
                  bgcolor: 'white',
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
                      if (item.type === 'group') {
                        return (
                          <CatalogueProductGroupCard
                            key={item.groupId}
                            baseName={item.baseName}
                            products={item.products}
                            primaryProduct={item.primaryProduct}
                            onQuickView={(product, variants) => handleQuickView(product, variants)}
                            viewDensity={viewDensity}
                          />
                        );
                      } else {
                        return (
                          <CatalogueProductCard
                            key={item.product._id}
                            product={item.product}
                            onQuickView={(product) => handleQuickView(product, [])}
                            viewDensity={viewDensity}
                          />
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
                      borderColor: 'grey.300',
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
                                onNotifyMe={handleNotifyMe}
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
                                handleImageClick={handleImageClick as any}
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
                          <Button
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={() => handleNotifyMe(product._id, product.name)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: '24px',
                              mt: 2,
                            }}
                          >
                            Notify Me When Available
                          </Button>
                        </Card>
                            );
                          }
                        })
                      ) : (
                        // Fallback for non-grouped response
                        outOfStockProducts.map((product: Product) => (
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
                                  handleImageClick={handleImageClick as any}
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
                            <Button
                              variant="outlined"
                              color="secondary"
                              fullWidth
                              onClick={() => handleNotifyMe(product._id, product.name)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '24px',
                                mt: 2,
                              }}
                            >
                              Notify Me When Available
                            </Button>
                          </Card>
                        ))
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Keep old display for reference - can be removed later */}
          <Box sx={{ display: 'none' }}>
          {isMobile || isTablet ? (
            <Box>
              {loading ? (
                // Loading skeletons for mobile/tablet
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: { xs: 1.5, sm: 2 },
                    width: '100%',
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} variant="card" />
                  ))}
                </Box>
              ) : groupByProductName && itemsData && itemsData.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: { xs: 2, sm: 2.5 },
                    width: '100%',
                    alignItems: 'stretch',
                    // Override MRP label margin-bottom and card padding-bottom for this page only
                    '& .MuiCardContent-root': {
                      pb: 0,
                      '& .MuiTypography-caption': {
                        mb: 0,
                      },
                    },
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
                          selectedProducts={[]}
                          temporaryQuantities={{}}
                          specialMargins={{}}
                          customerMargin={null as any}
                          orderStatus={''}
                          getSellingPrice={() => { }}
                          handleImageClick={handleImageClick}
                          handleQuantityChange={() => { }}
                          handleAddOrRemove={(prod: any) => { }
                          }
                          index={index}
                          isShared={true}
                        />
                      );
                    } else {
                      // item.type === 'product'
                      return (
                        <ProductCard
                          key={item.product._id}
                          product={item.product}
                          selectedProducts={[]}
                          temporaryQuantities={{}}
                          specialMargins={{}}
                          customerMargin={null as any}
                          orderStatus={''}
                          getSellingPrice={() => { }}
                          handleImageClick={handleImageClick}
                          handleQuantityChange={() => { }}
                          handleAddOrRemove={(prod: any) => { }
                          }
                          index={index}
                          isShared={true}
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
                    gap: { xs: 2, sm: 2.5 },
                    width: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {displayedProducts.map((product: any, index: number) => (
                    <ProductCard
                      key={product.product._id}
                      product={product.product}
                      selectedProducts={[]}
                      temporaryQuantities={{}}
                      specialMargins={{}}
                      customerMargin={null as any}
                      orderStatus={''}
                      getSellingPrice={() => { }}
                      handleImageClick={handleImageClick}
                      handleQuantityChange={() => { }}
                      handleAddOrRemove={(prod: any) => { }
                      }
                      index={index}
                      isShared={true}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    p: 4,
                    width: '100%',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <Typography variant="body1" align="center" color="text.secondary">
                    {loading
                      ? "Loading products..."
                      : searchTerm
                        ? `No products found with the name "${searchTerm}"`
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
                          sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1000,
                            backgroundColor: "background.paper",
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
                            selectedProducts={[]}
                            temporaryQuantities={{}}
                            specialMargins={{}}
                            customerMargin={null as any}
                            orderStatus={''}
                            getSellingPrice={() => { }}
                            handleImageClick={handleImageClick}
                            handleQuantityChange={() => { }}
                            handleAddOrRemove={(prod: any) => { }
                            }
                            isShared={true}
                            showUPC={true}
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
                          <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                            {loading
                              ? "Loading products..."
                              : searchTerm
                                ? `No products found with the name "${searchTerm}"`
                                : "No products found."}
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
                      lg: 'repeat(4, 1fr)',
                    },
                    gap: { xs: 1.5, sm: 2, md: 2.5 },
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <ProductCardSkeleton key={i} variant="card" />
                  ))}
                </Box>
              ) : groupByProductName && itemsData && itemsData.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                      xl: 'repeat(5, 1fr)',
                    },
                    gap: { xs: 2, sm: 2, md: 2.5, lg: 3 },
                    width: '100%',
                    maxWidth: '100%',
                    alignItems: 'stretch',
                    // Override MRP label margin-bottom and card padding-bottom for this page only
                    '& .MuiCardContent-root': {
                      pb: 0,
                      '& .MuiTypography-caption': {
                        mb: 0,
                      },
                    },
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
                          selectedProducts={[]}
                          temporaryQuantities={{}}
                          specialMargins={{}}
                          customerMargin={null as any}
                          orderStatus={''}
                          getSellingPrice={() => { }}
                          handleImageClick={handleImageClick}
                          handleQuantityChange={() => { }}
                          handleAddOrRemove={(prod: any) => { }
                          }
                          index={index}
                          isShared={true}
                        />
                      );
                    } else {
                      // item.type === 'product'
                      return (
                        <ProductCard
                          key={item.product._id}
                          product={item.product}
                          selectedProducts={[]}
                          temporaryQuantities={{}}
                          specialMargins={{}}
                          customerMargin={null as any}
                          orderStatus={''}
                          getSellingPrice={() => { }}
                          handleImageClick={handleImageClick}
                          handleQuantityChange={() => { }}
                          handleAddOrRemove={(prod: any) => { }
                          }
                          index={index}
                          isShared={true}
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
                      lg: 'repeat(4, 1fr)',
                      xl: 'repeat(5, 1fr)',
                    },
                    gap: { xs: 2, sm: 2, md: 2.5, lg: 3 },
                    width: '100%',
                    maxWidth: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {displayedProducts.map((product: any) => {
                    const productId = product._id;
                    return (
                      <Box key={productId}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: product.new ? '4px solid' : 'none',
                            borderLeftColor: product.new ? 'primary.main' : 'transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              boxShadow: 6,
                              transform: 'translateY(-4px)',
                            },
                            '&::before': product.new ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: 'linear-gradient(90deg, #3F51B5, #2196F3)',
                            } : {},
                          }}
                        >
                          <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: 0, position: 'relative' }}>
                            {product.new && (
                              <Chip
                                label="NEW"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: { xs: 8, sm: 12 },
                                  right: { xs: 8, sm: 12 },
                                  zIndex: 2,
                                  fontFamily: 'Poppins, sans-serif',
                                  fontWeight: 800,
                                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                  background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                                  color: 'white',
                                  letterSpacing: '0.8px',
                                  textTransform: 'uppercase',
                                  boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)',
                                  border: '2px solid white',
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%': { boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)' },
                                    '50%': { boxShadow: '0 3px 12px rgba(63, 81, 181, 0.6)' },
                                    '100%': { boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)' },
                                  },
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                width: '100%',
                                height: { xs: 160, sm: 180, md: 200 },
                                position: 'relative',
                                mb: { xs: 1.5, sm: 2 },
                                borderRadius: { xs: 1.5, sm: 2 },
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.50',
                              }}
                            >
                              <ImageCarousel
                                product={product}
                                handleImageClick={handleImageClick as any}
                              />
                            </Box>

                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                mb: { xs: 1, sm: 1.5 },
                                minHeight: { xs: 48, sm: 56 },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.3,
                                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                                color: product.new ? 'primary.dark' : 'text.primary',
                              }}
                            >
                              {product.name}
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 } }}>
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
                                  GST:
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {product.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  UPC/EAN:
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {product.upc_code || '-'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    p: 4,
                    width: '100%',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <Typography variant="body1" align="center" color="text.secondary">
                    {loading
                      ? "Loading products..."
                      : searchTerm
                        ? `No products found with the name "${searchTerm}"`
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
            </Box>
          )}
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
  )
}
