// Products.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import axios from "axios";
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
  Grid,
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
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  Sort,
} from "@mui/icons-material";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import ProductRow from "./products/ProductRow";
import ProductCard from "./products/ProductCard";
import CartDrawer from "./products/Cart";
import ImagePopupDialog from "../common/ImagePopUp";
import Image from "next/image";

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
  const [showUPC, setShowUPC] = useState<boolean>(false);
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

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const [link, setLink] = useState(
    order?.spreadsheet_created ? order?.spreadsheet_url : ""
  );
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

  const COLUMNS = useMemo(() => {
    const baseColumns = isShared
      ? [
          "Image",
          "Name",
          "Sub Category",
          "Series",
          "SKU",
          "Price",
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
          "Price",
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
      debouncedError.cancel();
    };
  }, [debouncedSuccess, debouncedWarn, debouncedError]);
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
        .catch((error) => debouncedError("Failed to fetch catalogue pages."));
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
      debouncedError("Failed to fetch brands.");
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
        debouncedError("Failed to fetch categories.");
      }
    },
    [activeCategory, debouncedError]
  );

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/all_categories`
      );
      const categories = response.data.categories || [];
      setAllCategories(categories.sort());
      if (!activeCategory && categories[0]) setActiveCategory(categories[0]);
    } catch (error) {
      debouncedError("Failed to fetch all categories.");
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
            // Pass catalogue_page only in catalogue mode:
            catalogue_page:
              sortToUse === "catalogue" ? cataloguePage : undefined,
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
        if (!axios.isCancel(error)) debouncedError("Failed to fetch products.");
      } finally {
        isFetching.current[key] = false;
        setLoadingMore(false);
      }
      return () => controller.abort();
    },
    [sortOrder, debouncedError, cataloguePage]
  );

  const fetchProductCounts = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.api_url}/products/counts`
      );
      setProductCounts(response.data);
    } catch (error) {
      debouncedError("Failed to fetch product counts.");
    }
  }, [debouncedError]);

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
    debounce(async (search: string) => {
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
          setOptions(productsByBrandCategory[newKey] || []);
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
          searchTerm.trim() !== ""
            ? "search"
            : groupByCategory
            ? `all-${activeCategory}`
            : `${activeBrand}-${activeCategory}`
        ]?.find((p) => p._id === id);
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
      debouncedSuccess("Cart cleared successfully.");
      setConfirmModalOpen(false); // Close modal after successful clear
    } catch (error) {
      debouncedError("Failed to clear the cart.");
      setConfirmModalOpen(false); // Close modal even on error
    }
  }, [id, setSelectedProducts, debouncedSuccess, debouncedError]);

  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
  };
  const handleImageClick = useCallback((srcList: string[], index: number) => {
    const formattedImages = srcList.map((src) => ({ src }));
    setPopupImageSrc(formattedImages);
    setPopupImageIndex(index);
    setOpenImagePopup(true);
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (groupByCategory) {
      fetchAllCategories();
      if (activeCategory) {
        resetPaginationAndFetch("", activeCategory);
      }
    } else if (activeBrand) {
      resetPaginationAndFetch(
        activeBrand,
        categoriesByBrand[activeBrand]?.[0] || ""
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

  const displayedProducts = useMemo(() => {
    return productsByBrandCategory[productsKey] || [];
  }, [productsByBrandCategory, productsKey]);

  const allCategoryCounts = useMemo(() => {
    const counts: { [category: string]: number } = {};
    Object.values(productCounts).forEach((brandCounts) => {
      Object.entries(brandCounts).forEach(([cat, count]) => {
        counts[cat] = (counts[cat] || 0) + count;
      });
    });
    return counts;
  }, [productCounts]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        padding: 1.5,
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
      }}
    >
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
                          {selectedBrand?.image && (
                            <Box
                              component="img"
                              src={selectedBrand.image}
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
                            {b.image && (
                              <Image
                                src={b.image}
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
                              {b.image && (
                                <Image
                                  src={b.image}
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
            <Box display="flex" justifyContent="flex-end">
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
          <Box display="flex" justifyContent="flex-end">
            <FormControlLabel
              control={
                <Checkbox
                  checked={showUPC}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setShowUPC(isChecked);

                    // Scroll to UPC/EAN column when enabled
                    if (isChecked) {
                      setTimeout(() => {
                        upcHeaderRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                          inline: "end",
                        });
                      }, 100);
                    }
                  }}
                  color="primary"
                />
              }
              label="Show UPC/EAN Code"
            />
          </Box>
        </Box>

        {/* Products Display */}
        {isMobile || isTablet ? (
          <Box>
            {displayedProducts.length > 0 ? (
              <Box display={"flex"} flexDirection={"column"}>
                {displayedProducts.map((product, index) => (
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
                    showUPC={showUPC}
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
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              width: "100%",
              maxWidth: "100vw",
              boxShadow: 2,
            }}
          >
            <Table stickyHeader sx={{ width: "100%", tableLayout: "auto" }}>
              <TableHead>
                <TableRow>
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
                          header === "Name" || header === "Sub Category"
                            ? 140
                            : 0,
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
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
          </TableContainer>
        )}
      </Box>
      <Box
        sx={{
          position: "fixed",
          bottom: isMobile || isTablet ? theme.spacing(20) : theme.spacing(12),
          right: isMobile || isTablet ? theme.spacing(2) : theme.spacing(4),
          display: "flex",
          flexDirection: "column",
          gap: 1,
          zIndex: 1000,
        }}
      >
        <IconButton
          color="primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{
            backgroundColor: "background.paper",
            boxShadow: 3,
            "&:hover": { backgroundColor: "background.default" },
          }}
        >
          <ArrowUpward fontSize={isMobile ? "medium" : "large"} />
        </IconButton>

        <IconButton
          color="primary"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth",
            })
          }
          sx={{
            backgroundColor: "background.paper",
            boxShadow: 3,
            "&:hover": { backgroundColor: "background.default" },
          }}
        >
          <ArrowDownward fontSize={isMobile ? "medium" : "large"} />
        </IconButton>
      </Box>

      {/* Cart Icon */}
      <IconButton
        color="primary"
        onClick={() => setCartDrawerOpen(true)}
        sx={{
          position: "fixed",
          bottom: isMobile || isTablet ? theme.spacing(10) : theme.spacing(4),
          right: isMobile || isTablet ? theme.spacing(2) : theme.spacing(4),
          backgroundColor: "background.paper",
          boxShadow: 3,
          "&:hover": { backgroundColor: "background.default" },
          zIndex: 1000,
        }}
      >
        <ShoppingCartIcon fontSize="large" />
        {selectedProducts.length > 0 && (
          <Badge
            badgeContent={selectedProducts.length}
            color="secondary"
            sx={{ position: "absolute", top: -4, right: -4 }}
          />
        )}
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
    </Box>
  );
};

export default memo(Products);
