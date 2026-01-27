import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    CircularProgress,
    Typography,
    Button,
    Alert,
    alpha,
    Container,
    Chip,
    Stack,
    Avatar,
    Tooltip,
    IconButton,
    useTheme,
} from '@mui/material';
import {
    FilterAlt,
    Download,
    Refresh,
    Analytics,
    BusinessCenter,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import CustomerTable from '../../src/components/admin/customer_analytics/CustomerAnalyticsTable';
import CustomerDetailsDrawer from '../../src/components/admin/customer_analytics/CustomerAnalyticsDrawer';
import useDebounce from '../../src/util/useDebounce';
import CustomerAnalyticsFilter from '../../src/components/admin/customer_analytics/CustomerAnalyticsFilter';

interface DashboardStats {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
    topTierCustomers: number;
    overduePayments: number;
}

const CustomerAnalytics = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true); // Add this state
    const [searchLoading, setSearchLoading] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableSalesPeople, setAvailableSalesPeople] = useState<string[]>([]);
    const [specialMarginProducts, setSpecialMarginProducts] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topTierCustomers: 0,
        overduePayments: 0,
    });
    const [error, setError] = useState<string>('');

    const debouncedSearchQuery = useDebounce(searchQuery, 1000);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [filterOptions, setFilterOptions] = useState({
        status: '',
        tier:'all',
        due_status:'all',
        sales_person: [] as string[],
        gst_type: '',
        unassigned: false,
    });
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const performClientSideSearch = useCallback((query: string, data: any[]) => {
        if (!query.trim()) {
            return data;
        }

        const searchTerm = query.toLowerCase().trim();

        // Helper to safely convert salesPerson (could be string or array) to searchable string
        const getSalesPersonString = (sp: any): string => {
            if (!sp) return '';
            if (Array.isArray(sp)) return sp.join(', ').toLowerCase();
            return String(sp).toLowerCase();
        };

        return data.filter(customer =>
            customer.customerName?.toLowerCase().includes(searchTerm) ||
            getSalesPersonString(customer.salesPerson).includes(searchTerm) ||
            customer.address?.toLowerCase().includes(searchTerm) ||
            customer.city?.toLowerCase().includes(searchTerm) ||
            customer.tier?.toLowerCase().includes(searchTerm)
        );
    }, []);

    const calculateDashboardStats = (customerData: any[]) => {
        const stats: DashboardStats = {
            totalCustomers: customerData.length,
            activeCustomers: customerData.filter(c => c.status === 'active').length,
            totalRevenue: customerData.reduce((sum, c) => sum + (c.billingTillDateCurrentYear || 0), 0),
            averageOrderValue: 0,
            topTierCustomers: customerData.filter(c => c.tier === 'A').length,
            overduePayments: customerData.reduce((sum, c) => sum + (c.duePayments?.length || 0), 0),
        };

        const totalOrders = customerData.reduce((sum, c) => sum + (c.averageOrderFrequencyMonthly || 0) * 12, 0);
        stats.averageOrderValue = totalOrders > 0 ? stats.totalRevenue / totalOrders : 0;

        return stats;
    };

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
     const handleApplyFilters = () => {
        setPage(0);
        getData();
    };

    const handleClearFilters = () => {
        setFilterOptions({
            status: '',
            tier: '',
            due_status: 'all',
            sales_person: [],
            sort_by: false,
        } as any);
        setPage(0);
    };

    const getData = async (isSearch = false) => {
        setLoading(true);
        if (isSearch) {
            setSearchLoading(true);
        }
        
        setError('');

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            const params: any = {
                page: page + 1,
                limit: Math.max(rowsPerPage, 100),
                name: debouncedSearchQuery,
                ...filterOptions,
                sales_person: filterOptions.sales_person.join(','),
            };

            const response = await axiosInstance.get(`/admin/customer_analytics`, { 
                params,
                signal: abortControllerRef.current.signal 
            });

            const data = response.data;
            setAllCustomers(data);
            
            const filtered = performClientSideSearch(searchQuery, data);
            setFilteredCustomers(filtered);
            
            const startIndex = page * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            setCustomers(filtered.slice(startIndex, endIndex));
            setTotalCount(filtered.length);

            if (page === 0) {
                setDashboardStats(calculateDashboardStats(filtered));
                setDashboardLoading(false);
            }

            // Set initial loading to false after first successful load
            setInitialLoading(false);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                if (!isSearch && !loading) {
                    toast.error('Error Fetching Customers');
                }
            }
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        
        if (allCustomers.length > 0) {
            const filtered = performClientSideSearch(query, allCustomers);
            setFilteredCustomers(filtered);
            
            setPage(0);
            const startIndex = 0;
            const endIndex = rowsPerPage;
            setCustomers(filtered.slice(startIndex, endIndex));
            setTotalCount(filtered.length);
            
            setDashboardStats(calculateDashboardStats(filtered));
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        const startIndex = newPage * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        setCustomers(filteredCustomers.slice(startIndex, endIndex));
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0);
        const endIndex = newRowsPerPage;
        setCustomers(filteredCustomers.slice(0, endIndex));
    };

    useEffect(() => {
        if (debouncedSearchQuery !== searchQuery) {
            getData(true);
        }
    }, [debouncedSearchQuery]);

    useEffect(() => {
        getData();
    }, [filterOptions]);

    const handleViewDetails = async (cust: any) => {
        setSelectedCustomer(cust);
        setDetailsDrawerOpen(true);
    };

    const handleToggleActive = async (cust: any) => {
        try {
            const updatedFields = {
                status: cust.status === 'active' ? 'inactive' : 'active',
            };

            await axiosInstance.put(`/customers/${cust._id}`, updatedFields);

            const updateCustomerInArray = (arr: any[]) =>
                arr.map((p: any) =>
                    p._id === cust._id ? { ...p, ...updatedFields } : p
                );

            setCustomers(updateCustomerInArray);
            setAllCustomers(updateCustomerInArray);
            setFilteredCustomers(updateCustomerInArray);

            const updatedFiltered = filteredCustomers.map((p: any) =>
                p._id === cust._id ? { ...p, ...updatedFields } : p
            );
            setDashboardStats(calculateDashboardStats(updatedFiltered));

            toast.success(
                `Customer ${cust.customerName} marked as ${updatedFields.status === 'active' ? 'Active' : 'Inactive'}`
            );
        } catch (error) {
            console.error(error);
            toast.error('Failed to update customer status.');
        }
    };

    const handleDownloadReport = async () => {
        try {
            const params = {
                name: debouncedSearchQuery,
                status: filterOptions.status,
                tier: filterOptions.tier,
                due_status: filterOptions.due_status,
                gst_type: filterOptions.gst_type,
                sort: 'asc',
            };

            const response = await axiosInstance.get('/admin/customer_analytics/report', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `customers_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Error downloading report.');
        }
    };

    const handleRefresh = () => {
        setPage(0);
        setSearchQuery('');
        setFilteredCustomers([]);
        setInitialLoading(true); // Reset initial loading for refresh
        getData();
        toast.info('Data refreshed!');
    };

    const theme = useTheme();
    
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ backgroundColor: 'purple', width: 48, height: 48 }}>
                        <Analytics />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                            Customer Analytics Dashboard
                        </Typography>
                        <Typography variant="body1" color="white">
                            Comprehensive view of customer performance and insights
                        </Typography>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
            </Box>

            {/* Main Content */}
            <Paper
                sx={{
                    borderRadius: 4,
                    backgroundColor: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Action Bar */}
                <Box
                    sx={{
                        p: 3,
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: '#fafafa',
                    }}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={2}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <BusinessCenter sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                                    Customer Management
                                </Typography>
                                {!initialLoading && (
                                    <Chip
                                        label={`${totalCount} customers`}
                                        size="small"
                                        sx={{
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            fontWeight: 600,
                                        }}
                                    />
                                )}
                                {searchQuery && !initialLoading && (
                                    <Chip
                                        label={`"${searchQuery}" - ${totalCount} results`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        onDelete={() => handleSearchChange('')}
                                    />
                                )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                {!initialLoading && (
                                    <>
                                        {totalCount.toLocaleString()} total customers • {customers.length} showing
                                        {searchLoading && (
                                            <Chip 
                                                label="Searching..." 
                                                size="small" 
                                                color="primary" 
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </>
                                )}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Tooltip title="Refresh Data">
                                <IconButton onClick={handleRefresh} color="primary">
                                    <Refresh />
                                </IconButton>
                            </Tooltip>

                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleDownloadReport}
                                sx={{ borderRadius: 2 }}
                                disabled={initialLoading}
                            >
                                Export XLSX
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt />}
                                onClick={() => setOpenFilterDrawer(true)}
                                sx={{ borderRadius: 2 }}
                                disabled={initialLoading}
                            >
                                Filters
                            </Button>
                        </Stack>
                    </Box>
                </Box>

                {/* Customer Table or Loading */}
                <Box sx={{ position: 'relative', minHeight: 400 }}>
                    {/* Always show loading on initial load or when no data */}
                    {(loading && customers.length === 0) ? (
                        // Initial Loading State
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: 500,
                                backgroundColor: '#fafafa',
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CircularProgress 
                                    size={80} 
                                    thickness={4} 
                                    sx={{ mb: 3, color: '#1976d2' }}
                                />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                                    Loading Customer Analytics
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    Please wait while we fetch your customer data...
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This may take a few moments for the first load
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <>
                            <CustomerTable
                                customers={customers}
                                totalCount={totalCount}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={handlePageChange}
                                onRowsPerPageChange={handleRowsPerPageChange}
                                searchQuery={searchQuery}
                                setSearchQuery={handleSearchChange}
                                onViewDetails={handleViewDetails}
                                handleToggle={handleToggleActive}
                                searchLoading={searchLoading}
                                loading={loading}
                            />

                            {/* Loading Overlay for subsequent loads when table has data */}
                            {loading && customers.length > 0 && (
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
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        zIndex: 10,
                                        backdropFilter: 'blur(3px)',
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CircularProgress size={60} thickness={4} />
                                        <Typography variant="body1" sx={{ mt: 2, color: '#1976d2' }}>
                                            Updating customer data...
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Paper>
 <CustomerAnalyticsFilter
                open={openFilterDrawer}
                onClose={() => setOpenFilterDrawer(false)}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                availableSalesPeople={availableSalesPeople}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
            />

            <CustomerDetailsDrawer
                open={detailsDrawerOpen}
                onClose={() => {
                    setDetailsDrawerOpen(false);
                    setSelectedCustomer(null);
                    setSpecialMarginProducts([]);
                }}
                customer={selectedCustomer}
                openAddDialog={() => setAddDialogOpen(true)}
                specialMarginProducts={specialMarginProducts}
                onCustomerUpdate={(updatedCustomer: any) => {
                    const updateArrays = (arr: any[]) =>
                        arr.map((cust) =>
                            cust._id === updatedCustomer._id ? updatedCustomer : cust
                        );
                    
                    setCustomers(updateArrays);
                    setAllCustomers(updateArrays);
                    setFilteredCustomers(updateArrays);
                    
                    const updatedFiltered = filteredCustomers.map((cust) =>
                        cust._id === updatedCustomer._id ? updatedCustomer : cust
                    );
                    setDashboardStats(calculateDashboardStats(updatedFiltered));
                }}
            />
        </Container>
    );
};

export default CustomerAnalytics;