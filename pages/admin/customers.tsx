import React, { useEffect, useState } from 'react';
import { Box, Paper, CircularProgress, Typography } from '@mui/material';
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

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
            All Customers
          </Typography>
          <FilterAlt onClick={() => setOpenFilterDrawer(true)} />
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
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
