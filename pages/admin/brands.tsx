import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { Download, FilterAlt, Refresh } from '@mui/icons-material';
import BrandTable from '../../src/components/admin/brands/BrandTable';
import BrandDialog from '../../src/components/admin/brands/BrandDialog';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';

const Brands = () => {
  // States for brands, pagination, filtering, editing, etc.
  const [brands, setBrands] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [skipPage, setSkipPage] = useState('');

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImagePopup, setOpenImagePopup] = useState(false);

  // States for the currently selected product and its editable fields
  const [selectedBrand, setSelectedBrand]: any = useState(null);
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

  /* ----------------------- Data Fetching & Search ----------------------- */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearchQuery.trim() !== '') {
        params.search = debouncedSearchQuery.trim();
      }
      const response = await axiosInstance.get('/admin/brands_with_images', {
        params,
      });
      setBrands(response.data.brands);
      setTotalCount(response.data.total_count);
      setTotalPageCount(response.data.total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [page, rowsPerPage, debouncedSearchQuery]);

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
      await axiosInstance.put(`/brands/${product._id}`, updatedFields);

      setBrands((prev: any) =>
        prev.map((p: any) =>
          p._id === product._id ? { ...p, ...updatedFields } : p
        )
      );
      if (selectedBrand && selectedBrand._id === product._id) {
        setSelectedBrand({ ...selectedBrand, ...updatedFields });
      }
      toast.success(
        `Brand ${product.name} marked as ${
          newStatus === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product status.');
    }
  };

  const handleOpenEditModal = (brand: any) => {
    setSelectedBrand(brand);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setSelectedBrand(null);
    setOpenEditModal(false);
  };

  const handleImageUpload = async (file: any) => {
    if (!selectedBrand) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brand_name', selectedBrand?.name);
    try {
      setUpdating(true);
      await axiosInstance.put(`/admin/brands/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await getData();
      toast.success('Image updated successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image.');
    } finally {
      setSelectedBrand(brands.map((b: any) => b._id === selectedBrand._id));
      setUpdating(false);
    }
  };

  const handleEditableFieldChange = (e: any) => {
    const { name, value } = e.target;
    setEditableFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    handleCloseEditModal();
  };

  const handleImageClick = useCallback((src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  const handleBrandsRefresh = async () => {
    setLoading(true);
    try {
      await axiosInstance.get('/admin/brands/refresh');
      await getData();
    } catch (error) {
      console.log(error);
      toast.error('Error Refreshing Brands');
    }
  };
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
            All Brands
          </Typography>
          <Box
            display='flex'
            flexDirection='row'
            justifyContent='flex-end'
            alignItems='end'
            gap='16px'
          >
            <Refresh onClick={handleBrandsRefresh} />
          </Box>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all brands in your inventory.
        </Typography>

        {/* Search Bar */}
        <TextField
          label='Search by Brand Name'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: 3 }}
        />

        <BrandTable
          brands={brands}
          loading={loading}
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

      <BrandDialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        selectedBrand={selectedBrand}
        updating={updating}
        editableFields={editableFields}
        handleEditableFieldChange={handleEditableFieldChange}
        handleSaveEdit={handleSaveEdit}
        handleToggleActive={handleToggleActive}
        handleImageClick={handleImageClick}
        handleImageUpload={handleImageUpload}
      />

      <SingleImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default Brands;
