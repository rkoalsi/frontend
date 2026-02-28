import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import CustomerTable from '../../src/components/admin/customers/CustomerTable';
import AddSpecialMarginDialog from '../../src/components/admin/customers/AddSpecialMargin';
import CustomerDetailsDrawer from '../../src/components/admin/customers/CustomerDetailsDrawer';
import CustomerFilterDrawer from '../../src/components/admin/customers/CustomerFilterDrawer';
import { FilterAlt } from '@mui/icons-material';
import useDebounce from '../../src/util/useDebounce';

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSelections, setGlobalSelections] = useState<Record<string, any>>(
    {}
  );
  const [availableSalesPeople, setAvailableSalesPeople] = useState<string[]>(
    []
  );
  const [specialMarginProducts, setSpecialMarginProducts] = useState<any[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [filterOptions, setFilterOptions] = useState({
    status: '',
    sales_person: [] as string[],
    gst_type: '',
    unassigned: false,
  });
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await axiosInstance.get(`/admin/sales-people`);
        setAvailableSalesPeople(response.data.sales_people);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching sales people.');
      }
    };
    fetchSalesPeople();
  }, []);

  const getSpecialMargins = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/customer/special_margins/${selectedCustomer._id}`
      );
      const { products = [] } = response.data;
      setSpecialMarginProducts(products);
      // Initialize globalSelections using product_id
      const updatedSelections: Record<string, any> = {};
      products.forEach((p: any) => {
        updatedSelections[p.product_id] = {
          selected: true,
          name: p.name,
          margin: p.margin,
        };
      });
      setGlobalSelections(updatedSelections);
    } catch (err) {
      console.error(err);
      toast.error('Error Fetching Products With Special Margin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailsDrawerOpen && selectedCustomer?._id) {
      getSpecialMargins();
    }
  }, [detailsDrawerOpen, selectedCustomer]);

  const getData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
        name: debouncedSearchQuery,
        ...filterOptions,
        sales_person: filterOptions.sales_person.join(','),
      };

      const response = await axiosInstance.get(`/admin/customers`, { params });
      const { customers, total_count } = response.data;
      setCustomers(customers);
      setTotalCount(total_count);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [page, rowsPerPage, debouncedSearchQuery, filterOptions]);

  const handleViewDetails = (cust: any) => {
    setSelectedCustomer(cust);
    setDetailsDrawerOpen(true);
  };

  const handleToggleActive = async (cust: any) => {
    try {
      const updatedFields = {
        status: cust.status === 'active' ? 'inactive' : 'active',
      };

      await axiosInstance.put(`/customers/${cust._id}`, updatedFields);

      setCustomers((prev: any[]) =>
        prev.map((p: any) =>
          p._id === cust._id ? { ...p, ...updatedFields } : p
        )
      );
      toast.success(
        `Customer ${cust.contact_name} marked as ${
          updatedFields.status === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer status.');
    }
  };

  const handleDeleteAllSpecialMargins = async () => {
    if (!selectedCustomer?._id) return;

    try {
      await axiosInstance.delete(
        `/admin/customer/special_margins/${selectedCustomer._id}/bulk`
      );
      setSpecialMarginProducts([]);
      toast.success('All special margins deleted successfully.');
      setGlobalSelections((prev) => {
        const updatedSelections = { ...prev };
        specialMarginProducts.forEach((prod: any) => {
          delete updatedSelections[prod.product_id];
        });
        return updatedSelections;
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete all special margins.');
    }
  };

  const onMarginsUpdated = async () => {
    if (!selectedCustomer?._id) return;
    try {
      const response = await axiosInstance.get(
        `/admin/customer/special_margins/${selectedCustomer._id}`
      );
      const { products } = response.data;
      // Update your state so the CustomerDetailsDrawer shows the latest margins.
      setSpecialMarginProducts(products);
      toast.success('Special margins refreshed.');
    } catch (error) {
      toast.error('Failed to refresh special margins.');
    }
  };
  const handleDownloadReport = async () => {
    try {
      const params = {
        name: debouncedSearchQuery,
        status: filterOptions.status,
        sales_person: filterOptions.sales_person.join(','),
        unassigned: filterOptions.unassigned,
        gst_type: filterOptions.gst_type,
        sort: 'asc', // or 'desc' as needed
      };

      const response = await axiosInstance.get('/admin/customers/report', {
        params,
        responseType: 'blob', // important for binary data!
      });

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading report.');
    }
  };
  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
          backgroundColor: 'white',
          position: 'relative', // added so we can position the overlay
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 2, sm: 0 }}
          mb={2}
        >
          <Typography variant='h4' sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            All Customers
          </Typography>
          <Box display='flex' alignItems='center' gap={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }} width={{ xs: '100%', sm: 'auto' }}>
            <Button
              variant='contained'
              color='primary'
              onClick={handleDownloadReport}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Download XLSX
            </Button>
            <FilterAlt onClick={() => setOpenFilterDrawer(true)} sx={{ cursor: 'pointer' }} />
          </Box>
        </Box>

        {/* Always render the table */}
        <CustomerTable
          customers={customers}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onViewDetails={handleViewDetails}
          handleToggle={handleToggleActive}
        />

        {/* Overlay the loader if data is being fetched */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)', // semi-transparent overlay
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Paper>

      <CustomerFilterDrawer
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
        availableSalesPeople={availableSalesPeople}
        onApplyFilters={() => {
          setPage(0);
          getData();
          setOpenFilterDrawer(false);
        }}
      />

      <CustomerDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        customer={selectedCustomer}
        openAddDialog={() => setAddDialogOpen(true)}
        specialMarginProducts={specialMarginProducts}
        handleDeleteAllSpecialMargins={handleDeleteAllSpecialMargins}
        onCustomerUpdate={(updatedCustomer: any) => {
          setCustomers((prev) =>
            prev.map((cust) =>
              cust._id === updatedCustomer._id ? updatedCustomer : cust
            )
          );
        }}
        onMarginsUpdated={onMarginsUpdated}
      />

      <AddSpecialMarginDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        customer={selectedCustomer}
        onMarginsUpdated={onMarginsUpdated}
        existingSpecialMargins={specialMarginProducts}
      />
    </Box>
  );
};

export default Customers;
