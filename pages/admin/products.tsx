import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { Download, FilterAlt } from '@mui/icons-material';
import ProductTable from '../../src/components/admin/products/ProductsTable';
import FilterDrawerComponent from '../../src/components/admin/products/FilterDrawer';
import ProductDialog from '../../src/components/admin/products/ProductDialog';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';

const Products = () => {
  // States for products, pagination, filtering, editing, etc.
  const [products, setProducts] = useState([]);
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
  const [missingInfoProducts, setMissingInfoProducts] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');

  // Dropdown options for filters
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  // UI states for modals/drawers
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImagePopup, setOpenImagePopup] = useState(false);

  // States for the currently selected product and its editable fields
  const [selectedProduct, setSelectedProduct]: any = useState(null);
  const [editableFields, setEditableFields] = useState({
    category: '',
    sub_category: '',
    series: '',
    upc_code: '',
    brand: '',
    catalogue_order: '',
    catalogue_page: '',
  });
  const [updating, setUpdating] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');

  /* ----------------------- Fetch Filter Options ----------------------- */
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const brands = await axiosInstance.get('/admin/brands');
        const categories = await axiosInstance.get('/admin/categories');
        const sub_categories = await axiosInstance.get('/admin/sub_categories');

        setBrandOptions(brands.data.brands);
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
    filterBrand,
    filterCategory,
    filterSubCategory,
  ]);

  const handleSearch = (e: any) => setSearchQuery(e.target.value);
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
    setSkipPage('');
  };
  const handleChangeRowsPerPage = (event: any) => {
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
  const handleToggleActive = async (product: any) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      const updatedFields = { status: newStatus };
      await axiosInstance.put(`/products/${product._id}`, updatedFields);

      setProducts((prev: any) =>
        prev.map((p: any) =>
          p._id === product._id ? { ...p, ...updatedFields } : p
        )
      );
      if (selectedProduct && selectedProduct._id === product._id) {
        setSelectedProduct({ ...selectedProduct, ...updatedFields });
      }
      toast.success(
        `Product ${product.name} marked as ${
          newStatus === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product status.');
    }
  };

  const handleOpenEditModal = (product: any) => {
    setSelectedProduct(product);
    setOpenEditModal(true);
    setEditableFields({
      category: product.category || '',
      sub_category: product.sub_category || '',
      series: product.series || '',
      upc_code: product?.upc_code || '',
      brand: product?.brand || '',
      catalogue_order: product?.catalogue_order || '',
      catalogue_page: product?.catalogue_page || '',
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
  };

  const handleImageUpload = async (file: any) => {
    if (!selectedProduct) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_id', selectedProduct._id);
    try {
      setUpdating(true);
      const response = await axiosInstance.post(
        '/admin/upload-image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const newImageUrl = response.data.image_url;
      await axiosInstance.put(`/products/${selectedProduct._id}`, {
        image_url: newImageUrl,
      });

      setProducts((prev: any) =>
        prev.map((p: any) =>
          p._id === selectedProduct._id ? { ...p, image_url: newImageUrl } : p
        )
      );
      setSelectedProduct((prev: any) =>
        prev ? { ...prev, image_url: newImageUrl } : prev
      );
      toast.success('Image updated successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditableFieldChange = (e: any) => {
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
        catalogue_order: parseInt(catalogue_order),
        catalogue_page: parseInt(catalogue_page),
      };
      await axiosInstance.put(
        `/products/${selectedProduct._id}`,
        updatedFields
      );
      setProducts((prev: any) =>
        prev.map((p: any) =>
          p._id === selectedProduct._id ? { ...p, ...updatedFields } : p
        )
      );
      setSelectedProduct((prev: any) =>
        prev ? { ...prev, ...updatedFields } : prev
      );
      toast.success('Product details updated successfully.');
      handleCloseEditModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product details.');
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
      if (missingInfoProducts) params.missing_info_products = true;
      if (filterBrand) params.brand = filterBrand;
      if (filterCategory) params.category = filterCategory;
      if (filterSubCategory) params.sub_category = filterSubCategory;

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

  const handleImageClick = useCallback((src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}
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
            <Download onClick={handleDownloadProducts} />
            <FilterAlt onClick={() => setOpenFilterModal(true)} />
          </Box>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all products in your inventory.
        </Typography>

        {/* Search Bar */}
        <TextField
          label='Search by Name or SKU'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: 3 }}
        />

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
          setFilterBrand('');
          setFilterCategory('');
          setFilterSubCategory('');
          setMissingInfoProducts(false);
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
        handleImageClick={handleImageClick}
        handleImageUpload={handleImageUpload}
      />

      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default Products;
