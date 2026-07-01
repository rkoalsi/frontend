import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { Alert, Box, Paper, TextField, Typography } from '@mui/material';
import { Download, FilterAlt, Sync } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import ProductTable from '../../src/components/admin/products/ProductsTable';
import FilterDrawerComponent from '../../src/components/admin/products/FilterDrawer';
import ProductDialog from '../../src/components/admin/products/ProductDialog';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';

// Define a more complete Product interface to ensure type safety for images
interface Product {
  _id: string;
  item_id: string; // Crucial for S3 filename in backend
  item_name: string;
  images: string[]; // This is the new array of image URLs
  status: 'active' | 'inactive';
  category: string;
  sub_category: string;
  series: string;
  brand: string;
  rate: number;
  cf_sku_code: string;
  upc_code: string;
  cf_item_code: string;
  stock: number;
  hsn_or_sac: string;
  manufacturer?: string;
  catalogue_order?: number;
  catalogue_page?: number;
  pre_order?: boolean;
  clearance?: boolean;
  clearance_margin?: number;
}

const Products = () => {
  // States for products, pagination, filtering, editing, etc.
  const [products, setProducts] = useState<Product[]>([]); // Type assertion
  const [totalCount, setTotalCount] = useState(0);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [skipPage, setSkipPage] = useState('');

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterNewArrivals, setFilterNewArrivals] = useState(false);
  const [filterPreOrder, setFilterPreOrder] = useState(false);
  const [filterClearance, setFilterClearance] = useState(false);
  const [missingInfoProducts, setMissingInfoProducts] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');

  // Dropdown options for filters
  const [brandOptions, setBrandOptions] = useState<{ name: string; hidden?: boolean }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  // UI states for modals/drawers
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImagePopup, setOpenImagePopup] = useState(false);

  // States for the currently selected product and its editable fields
  const [selectedProduct, setSelectedProduct]: any = useState<any>(null); // Type assertion
  const [editableFields, setEditableFields] = useState({
    category: '',
    sub_category: '',
    series: '',
    upc_code: '',
    brand: '',
    catalogue_order: '',
    catalogue_page: '',
  });
  const [updating, setUpdating] = useState(false); // Indicates an ongoing API call for any action
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex] = useState(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  /* ----------------------- Fetch Filter Options ----------------------- */
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const brands = await axiosInstance.get('/admin/brands_with_images');
        const categories = await axiosInstance.get('/admin/categories');
        const sub_categories = await axiosInstance.get('/admin/sub_categories');

        setBrandOptions(
          (brands.data.brands || []).map((b: any) => ({ name: b.name, hidden: !!b.hidden }))
        );
        setCategoryOptions(categories.data.categories);
        setSubCategoryOptions(sub_categories.data.sub_categories);
      } catch (error) {
        console.error('Error fetching filter options', error);
      }
    };
    fetchFilterOptions();
  }, []);

  /* ----------------------- Data Fetching & Search ----------------------- */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (debouncedSearchQuery.trim() !== '') {
        params.search = debouncedSearchQuery.trim();
      }
      if (filterStatus) params.status = filterStatus;
      if (filterStock) params.stock = filterStock;
      if (filterSortBy) params.sort_by = filterSortBy;
      if (filterNewArrivals) params.new_arrivals = true;
      if (filterPreOrder) params.pre_order = true;
      if (filterClearance) params.clearance = true;
      if (missingInfoProducts) params.missing_info_products = true;
      if (filterBrand) params.brand = filterBrand;
      if (filterCategory) params.category = filterCategory;
      if (filterSubCategory) params.sub_category = filterSubCategory;

      const response = await axiosInstance.get('/admin/products', { params });
      setProducts(response.data.products);
      setTotalCount(response.data.total_count);
      setTotalPageCount(response.data.total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [
    page,
    rowsPerPage,
    debouncedSearchQuery,
    filterStatus,
    filterStock,
    filterNewArrivals,
    filterPreOrder,
    filterClearance,
    filterBrand,
    filterCategory,
    filterSubCategory,
    filterSortBy,
    missingInfoProducts,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
    setSkipPage('');
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    if (requestedPage > totalPages) {
      toast.error(`Page number exceeds total pages (${totalPages})`);
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  /* ----------------------- Toggle & Edit Handlers ----------------------- */
 const handleToggleActive = async (product: Product) => {
  try {
    setUpdating(true);
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    
    // Create FormData instead of JSON object
    const formData = new FormData();
    formData.append('status', newStatus);
    
    const resp = await axiosInstance.put(`/admin/products/${product._id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Rest of your code remains the same...
    setProducts((prev: any) =>
      prev.map((p: any) =>
        p._id === product._id ? { ...p, status: newStatus } : p
      )
    );
    // ... rest of the function
  } catch (error) {
    console.error(error);
    toast.error('Failed to update product status.');
  } finally {
    setUpdating(false);
  }
};
  const handleTogglePreOrder = async (product: Product) => {
    try {
      setUpdating(true);
      const newPreOrder = !product.pre_order;
      const formData = new FormData();
      formData.append('pre_order', String(newPreOrder));
      await axiosInstance.put(`/admin/products/${product._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Product marked as ${newPreOrder ? 'Pre Order' : 'not Pre Order'}.`);
      await getData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update pre-order status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleClearance = async (product: Product) => {
    try {
      setUpdating(true);
      const newClearance = !product.clearance;
      const formData = new FormData();
      formData.append('clearance', String(newClearance));
      // Default to 0 additional margin when turning on; clear it when turning off
      formData.append('clearance_margin', String(newClearance ? (product.clearance_margin ?? 0) : 0));
      await axiosInstance.put(`/admin/products/${product._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Product ${newClearance ? 'added to Special Offers' : 'removed from Special Offers'}.`);
      await getData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update clearance status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateClearanceMargin = async (product: Product, margin: number) => {
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('clearance_margin', String(margin));
      await axiosInstance.put(`/admin/products/${product._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Clearance margin updated.');
      await getData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update clearance margin.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setOpenEditModal(true);
    setEditableFields({
      category: product.category || '',
      sub_category: product.sub_category || '',
      series: product.series || '',
      upc_code: product?.upc_code || '',
      brand: product?.brand || '',
      catalogue_order: product?.catalogue_order?.toString() || '', // Convert to string for TextField
      catalogue_page: product?.catalogue_page?.toString() || '', // Convert to string for TextField
    });
  };

  const handleCloseEditModal = () => {
    setSelectedProduct(null);
    setOpenEditModal(false);
    setEditableFields({
      category: '',
      sub_category: '',
      series: '',
      upc_code: '',
      brand: '',
      catalogue_order: '',
      catalogue_page: '',
    });
    // Re-fetch products to ensure latest image changes are reflected in the table
    getData();
  };

  // --- NEW: handleImageUpload now expects an array of files ---
const handleImageUpload = async (files: File[] | File) => {
  // Ensure files is always an array
  const filesArray = Array.isArray(files) ? files : [files];
  
  if (!selectedProduct || filesArray.length === 0) {
    toast.error('No product selected or no files provided.');
    return;
  }

  setUpdating(true);
  const formData = new FormData();
  formData.append('product_id', selectedProduct._id);

  try {
    let response;
    if (filesArray.length === 1) {
      // Single file upload
      formData.append('file', filesArray[0]); // 'file' matches backend @router.post("/upload-image")
      response = await axiosInstance.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      // Multiple file upload
      filesArray.forEach((file) => {
        formData.append('files', file); // 'files' matches backend @router.post("/upload-multiple-images")
      });
      response = await axiosInstance.post(
        '/admin/upload-multiple-images',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
    }

    const responseData = response.data;

    // Handle different response formats
    let updatedImages: string[] = [];
    
    if (responseData.images && Array.isArray(responseData.images)) {
      // Standard case - backend returns images array
      updatedImages = responseData.images;
    } else if (responseData.image_url) {
      // Single image upload case - construct array from current product images + new image
      const currentImages = selectedProduct.images || [];
      updatedImages = [...currentImages, responseData.image_url];
    } else if (responseData.uploaded_images && Array.isArray(responseData.uploaded_images)) {
      // Multiple upload case - construct array from current + uploaded
      const currentImages = selectedProduct.images || [];
      updatedImages = [...currentImages, ...responseData.uploaded_images];
    } else {
      // Fallback - keep existing images
      updatedImages = selectedProduct.images || [];
    }

    // Update the selected product's images array
    setSelectedProduct((prev: any) =>
      prev ? { ...prev, images: updatedImages } : prev
    );

    // Also update the product in the main products list if it's there
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p._id === selectedProduct._id
          ? { ...p, images: updatedImages }
          : p
      )
    );

    toast.success(responseData.message || 'Image(s) uploaded successfully.');
  } catch (error: any) {
    console.error(
      'Error uploading image(s):',
      error.response?.data?.detail || error.message
    );
    toast.error(error.response?.data?.detail || 'Failed to upload image(s).');
  } finally {
    setUpdating(false);
  }
};


  // --- NEW: handleImageReorder ---
  const handleImageReorder = async (reorderedImages: string[]) => {
    if (!selectedProduct) return;

    setUpdating(true);
    const formData = new FormData();
    formData.append('product_id', selectedProduct._id);
    formData.append('images', JSON.stringify(reorderedImages)); // Backend expects JSON string

    try {
      const response = await axiosInstance.post(
        '/admin/reorder-images',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const responseData = response.data;

      setSelectedProduct((prev: any) =>
        prev ? { ...prev, images: responseData.images } : prev
      );
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: responseData.images }
            : p
        )
      );
      toast.success(responseData.message || 'Images reordered successfully!');
    } catch (error: any) {
      console.error(
        'Error reordering images:',
        error.response?.data?.detail || error.message
      );
      toast.error(error.response?.data?.detail || 'Failed to reorder images.');
    } finally {
      setUpdating(false);
    }
  };

  // --- NEW: handleImageDelete ---
  const handleImageDelete = async (indexToDelete: number) => {
    if (!selectedProduct || !selectedProduct.images) return;

    const imageUrlToDelete = selectedProduct.images[indexToDelete];
    if (!imageUrlToDelete) {
      toast.error('Image URL not found.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete this image? This action cannot be undone.'
      )
    ) {
      return;
    }

    setUpdating(true);
    const formData = new FormData();
    formData.append('product_id', selectedProduct._id);
    formData.append('image_url', imageUrlToDelete);

    try {
      const response = await axiosInstance.delete('/admin/delete-image', {
        // DELETE method for axios
        data: formData, // Axios sends FormData with DELETE via 'data' property
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const responseData = response.data;

      setSelectedProduct((prev: any) =>
        prev ? { ...prev, images: responseData.images } : prev
      );
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: responseData.images }
            : p
        )
      );
      toast.success(responseData.message || 'Image deleted successfully!');
    } catch (error: any) {
      console.error(
        'Error deleting image:',
        error.response?.data?.detail || error.message
      );
      toast.error(error.response?.data?.detail || 'Failed to delete image.');
    } finally {
      setUpdating(false);
    }
  };

  // --- NEW: handleMakePrimary ---
  const handleMakePrimary = async (indexToMakePrimary: number) => {
    if (!selectedProduct || !selectedProduct.images) return;

    const imageUrlToMakePrimary = selectedProduct.images[indexToMakePrimary];
    if (!imageUrlToMakePrimary) {
      toast.error('Image URL not found to make primary.');
      return;
    }

    setUpdating(true);
    const formData = new FormData();
    formData.append('product_id', selectedProduct._id);
    formData.append('image_url', imageUrlToMakePrimary);

    try {
      const response = await axiosInstance.post(
        '/admin/make-primary-image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const responseData = response.data;

      setSelectedProduct((prev: any) =>
        prev ? { ...prev, images: responseData.images } : prev
      );
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: responseData.images }
            : p
        )
      );
      toast.success(responseData.message || 'Image set as primary!');
    } catch (error: any) {
      console.error(
        'Error making image primary:',
        error.response?.data?.detail || error.message
      );
      toast.error(
        error.response?.data?.detail || 'Failed to set primary image.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleVideoUpload = async (files: File[] | File) => {
    const filesArray = Array.isArray(files) ? files : [files];
    if (!selectedProduct || filesArray.length === 0) return;
    setUpdating(true);
    try {
      for (const file of filesArray) {
        const formData = new FormData();
        formData.append('product_id', selectedProduct._id);
        formData.append('file', file);
        const response = await axiosInstance.post('/admin/upload-video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedVideos = response.data.videos;
        setSelectedProduct((prev: any) => prev ? { ...prev, videos: updatedVideos } : prev);
        setProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, videos: updatedVideos } as any : p));
      }
      toast.success('Video(s) uploaded successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload video.');
    } finally {
      setUpdating(false);
    }
  };

  const handleVideoReorder = async (reorderedVideos: string[]) => {
    if (!selectedProduct) return;
    setUpdating(true);
    const formData = new FormData();
    formData.append('product_id', selectedProduct._id);
    formData.append('videos', JSON.stringify(reorderedVideos));
    try {
      const response = await axiosInstance.post('/admin/reorder-videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedProduct((prev: any) => prev ? { ...prev, videos: response.data.videos } : prev);
      setProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, videos: response.data.videos } as any : p));
      toast.success('Videos reordered successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reorder videos.');
    } finally {
      setUpdating(false);
    }
  };

  const handleVideoDelete = async (indexToDelete: number) => {
    if (!selectedProduct?.videos) return;
    const videoUrl = selectedProduct.videos[indexToDelete];
    if (!videoUrl) return;
    if (!window.confirm('Delete this video? This cannot be undone.')) return;
    setUpdating(true);
    const formData = new FormData();
    formData.append('product_id', selectedProduct._id);
    formData.append('video_url', videoUrl);
    try {
      const response = await axiosInstance.delete('/admin/delete-video', {
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedProduct((prev: any) => prev ? { ...prev, videos: response.data.videos } : prev);
      setProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, videos: response.data.videos } as any : p));
      toast.success('Video deleted!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete video.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditableFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setEditableFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
  if (!selectedProduct) return;
  const {
    category,
    sub_category,
    series,
    upc_code,
    brand,
    catalogue_order,
    catalogue_page,
  } = editableFields;
  try {
    setUpdating(true);
    const updatedFields = {
      category: category.trim(),
      sub_category: sub_category.trim(),
      series: series.trim(),
      upc_code: upc_code.trim(),
      brand: brand.trim(),
      catalogue_order: catalogue_order
        ? parseInt(catalogue_order)
        : undefined,
      catalogue_page: catalogue_page ? parseInt(catalogue_page) : undefined,
    };

    // Only include fields that have changed or are being set for the first time
    const finalUpdatedFields: { [key: string]: any } = {};
    for (const key in updatedFields) {
      if (
        updatedFields[key as keyof typeof updatedFields] !==
        (selectedProduct as any)[key]
      ) {
        finalUpdatedFields[key] =
          updatedFields[key as keyof typeof updatedFields];
      }
    }

    if (Object.keys(finalUpdatedFields).length === 0) {
      toast.info('No changes to save.');
      setUpdating(false);
      handleCloseEditModal();
      return;
    }

    // Create FormData instead of sending JSON
    const formData = new FormData();
    for (const [key, value] of Object.entries(finalUpdatedFields)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }

    await axiosInstance.put(
      `/admin/products/${selectedProduct._id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    
    setProducts((prev) =>
      prev.map((p) =>
        p._id === selectedProduct._id ? { ...p, ...finalUpdatedFields } : p
      )
    );
    setSelectedProduct((prev: any) =>
      prev ? { ...prev, ...finalUpdatedFields } : prev
    );
    toast.success('Product details updated successfully.');
    handleCloseEditModal();
  } catch (error: any) {
    console.error(error);
    toast.error(
      error.response?.data?.detail || 'Failed to update product details.'
    );
  } finally {
    setUpdating(false);
  }
};

  const handleDownloadProducts = async () => {
    try {
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (debouncedSearchQuery.trim() !== '')
        params.search = debouncedSearchQuery.trim();
      if (filterStatus) params.status = filterStatus;
      if (filterStock) params.stock = filterStock;
      if (filterNewArrivals) params.new_arrivals = true;
      if (filterPreOrder) params.pre_order = true;
      if (filterClearance) params.clearance = true;
      if (missingInfoProducts) params.missing_info_products = true;
      if (filterBrand) params.brand = filterBrand;
      if (filterCategory) params.category = filterCategory;
      if (filterSubCategory) params.sub_category = filterSubCategory;
      if (filterSortBy) params.sort_by = filterSortBy;

      const response = await axiosInstance.get('/admin/products/download', {
        params,
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'];
      let fileName = 'products.xlsx';
      if (disposition) {
        const fileNameMatch = disposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: response.data.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download products file.');
    }
  };

  const handleUpdateStock = async () => {
    setUpdatingStock(true);
    try {
      await axiosInstance.post('/admin/products/update-stock');
      toast.success('Stock update started in the background.');
      getData();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.warning('Stock update is already running. Please wait.');
      } else {
        toast.error('Failed to update stock.');
      }
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleImageClick = useCallback((srcList: any, index: number) => {
    // Check if items already have src property (media items with type)
    // Make sure src is a string, not an object
    const formattedImages = srcList[0]?.src && typeof srcList[0].src === 'string'
      ? srcList
      : srcList?.map((src: any) => ({ src }));
    setPopupImageSrc(formattedImages);
    setPopupImageIndex(index);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4 }}
      >
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Products
          </Typography>
          <Box
            display='flex'
            flexDirection='row'
            justifyContent='flex-end'
            alignItems='end'
            gap='16px'
          >
            <Button
              variant='outlined'
              size='small'
              onClick={handleUpdateStock}
              disabled={updatingStock}
              startIcon={updatingStock ? <CircularProgress size={16} /> : <Sync />}
            >
              {updatingStock ? 'Updating Stock...' : 'Update Stock'}
            </Button>
            <Download
              onClick={handleDownloadProducts}
              sx={{ cursor: 'pointer' }}
            />
            <FilterAlt
              onClick={() => setOpenFilterModal(true)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
        <Typography variant='body1' sx={{ marginBottom: 3 }} color='text.secondary'>
          A comprehensive list of all products in your inventory.
        </Typography>

        {/* Search Bar */}
        <TextField
          label='Search by Name or SKU'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: filterBrand && brandOptions.find((b) => b.name === filterBrand)?.hidden ? 1 : 3 }}
        />
        {filterBrand && brandOptions.find((b) => b.name === filterBrand)?.hidden && (
          <Alert severity='warning' sx={{ marginBottom: 3 }}>
            <strong>{filterBrand}</strong> is currently hidden — it will not appear in the order form or all products catalogue for customers.
          </Alert>
        )}

        <ProductTable
          products={products}
          loading={loading}
          filterSortBy={filterSortBy}
          totalCount={totalCount}
          totalPageCount={totalPageCount}
          page={page}
          rowsPerPage={rowsPerPage}
          skipPage={skipPage}
          setSkipPage={setSkipPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleSkipPage={handleSkipPage}
          handleImageClick={handleImageClick}
          handleOpenEditModal={handleOpenEditModal}
          handleToggleActive={handleToggleActive}
          handleTogglePreOrder={handleTogglePreOrder}
          handleToggleClearance={handleToggleClearance}
          handleUpdateClearanceMargin={handleUpdateClearanceMargin}
        />
      </Paper>

      <FilterDrawerComponent
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterStock={filterStock}
        setFilterStock={setFilterStock}
        filterNewArrivals={filterNewArrivals}
        setFilterNewArrivals={setFilterNewArrivals}
        filterPreOrder={filterPreOrder}
        setFilterPreOrder={setFilterPreOrder}
        filterClearance={filterClearance}
        setFilterClearance={setFilterClearance}
        missingInfoProducts={missingInfoProducts}
        setMissingInfoProducts={setMissingInfoProducts}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterSubCategory={filterSubCategory}
        setFilterSubCategory={setFilterSubCategory}
        filterSortBy={filterSortBy}
        setFilterSortBy={setFilterSortBy}
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        subCategoryOptions={subCategoryOptions}
        applyFilters={() => {
          setPage(0);
          setOpenFilterModal(false);
          getData();
        }}
        resetFilters={() => {
          setPage(0);
          setOpenFilterModal(false);
          setFilterStatus('');
          setFilterStock('');
          setFilterNewArrivals(false);
          setFilterPreOrder(false);
          setFilterClearance(false);
          setFilterBrand('');
          setFilterCategory('');
          setFilterSubCategory('');
          setMissingInfoProducts(false);
          setFilterSortBy('');
        }}
      />

      <ProductDialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        selectedProduct={selectedProduct}
        updating={updating}
        editableFields={editableFields}
        handleEditableFieldChange={handleEditableFieldChange}
        handleSaveEdit={handleSaveEdit}
        handleToggleActive={handleToggleActive}
        handleTogglePreOrder={handleTogglePreOrder}
        handleToggleClearance={handleToggleClearance}
        handleUpdateClearanceMargin={handleUpdateClearanceMargin}
        handleImageClick={handleImageClick}
        handleImageUpload={handleImageUpload}
        handleImageReorder={handleImageReorder}
        handleImageDelete={handleImageDelete}
        handleMakePrimary={handleMakePrimary}
        handleVideoUpload={handleVideoUpload}
        handleVideoReorder={handleVideoReorder}
        handleVideoDelete={handleVideoDelete}
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

export default Products;
