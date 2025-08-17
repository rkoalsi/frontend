import React from 'react';
import {
    Drawer,
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Divider,
    IconButton,
    useTheme,
    useMediaQuery,
    Autocomplete,
    TextField,
    FormControlLabel,
    Switch,
    Card,
    CardContent,
    alpha,
} from '@mui/material';
import {
    Close,
    FilterAlt,
    Clear,
    TuneRounded,
} from '@mui/icons-material';

const CustomerAnalyticsFilter = ({
    open,
    onClose,
    filterOptions,
    setFilterOptions,
    onApplyFilters,
    onClearFilters,
}:any) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleFilterChange = (field:any, value:any) => {
        setFilterOptions((prev:any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleApply = () => {
        onApplyFilters();
        onClose();
    };

    const handleClear = () => {
        onClearFilters();
        onClose();
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filterOptions.status) count++;
        if (filterOptions.tier) count++;
        if (filterOptions.due_status && filterOptions.due_status !== 'all') count++;
        if (filterOptions.last_billed && filterOptions.last_billed !== 'all') count++;
        if (filterOptions.sales_person?.length > 0) count++;
        if (filterOptions.sort_by !== undefined) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <Drawer
            anchor={isMobile ? 'bottom' : 'right'}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: isMobile ? '100%' : 400,
                    maxHeight: isMobile ? '85vh' : '100vh',
                    borderRadius: isMobile ? '16px 16px 0 0' : 0,
                }
            }}
            ModalProps={{
                keepMounted: false,
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box
                    sx={{
                        p:2,
                        mt:8,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            <TuneRounded sx={{ fontSize: 28 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Filter Customers
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Customize your customer view
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton 
                            onClick={onClose} 
                            sx={{ 
                                color: 'white',
                                '&:hover': { backgroundColor: 'white'}
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>
                    
                    {activeFilterCount > 0 && (
                        <Box mt={2}>
                            <Chip
                                label={`${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                                size="small"
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Filter Content */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    <Stack spacing={3}>
                        {/* Customer Status Filter */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel>Customer Status</InputLabel>
                                    <Select
                                        value={filterOptions.status || ''}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        label="Customer Status"
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>

                        {/* Customer Tier Filter */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel>Customer Tier</InputLabel>
                                    <Select
                                        value={filterOptions.tier || ''}
                                        onChange={(e) => handleFilterChange('tier', e.target.value)}
                                        label="Customer Tier"
                                    >
                                        <MenuItem value="">All Tiers</MenuItem>
                                        <MenuItem value="A">Tier A</MenuItem>
                                        <MenuItem value="B">Tier B</MenuItem>
                                        <MenuItem value="C">Tier C</MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>

                        {/* Payment Due Status Filter */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        value={filterOptions.due_status || 'all'}
                                        onChange={(e) => handleFilterChange('due_status', e.target.value)}
                                        label="Payment Status"
                                    >
                                        <MenuItem value="all">All Payments</MenuItem>
                                        <MenuItem value="due">Due Payments</MenuItem>
                                        <MenuItem value="not_due">No Due Payments</MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>

                        {/* NEW: Last Billed Filter */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel>Last Billing Activity</InputLabel>
                                    <Select
                                        value={filterOptions.last_billed || 'all'}
                                        onChange={(e) => handleFilterChange('last_billed', e.target.value)}
                                        label="Last Billing Activity"
                                    >
                                        <MenuItem value="all">All Customers</MenuItem>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
                                            Customers who HAVE billed:
                                        </Typography>
                                        <MenuItem value="last_month">Last Month</MenuItem>
                                        <MenuItem value="last_45_days">Last 45 Days</MenuItem>
                                        <MenuItem value="last_2_months">Last 2 Months</MenuItem>
                                        <MenuItem value="last_3_months">Last 3 Months</MenuItem>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
                                            Customers who have NOT billed:
                                        </Typography>
                                        <MenuItem value="not_last_month">Not in Last Month</MenuItem>
                                        <MenuItem value="not_last_45_days">Not in Last 45 Days</MenuItem>
                                        <MenuItem value="not_last_2_months">Not in Last 2 Months</MenuItem>
                                        <MenuItem value="not_last_3_months">Not in Last 3 Months</MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>

                    </Stack>
                </Box>

                {/* Action Buttons */}
                <Box
                    sx={{
                        p: 3,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Stack spacing={2} direction={isMobile ? 'column' : 'row'}>
                        <Button
                            variant="outlined"
                            onClick={handleClear}
                            startIcon={<Clear />}
                            fullWidth={isMobile}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Clear All
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleApply}
                            startIcon={<FilterAlt />}
                            fullWidth={isMobile}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                }
                            }}
                        >
                            Apply Filters
                            {activeFilterCount > 0 && (
                                <Chip
                                    label={activeFilterCount}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        height: 20,
                                        backgroundColor: 'white',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                    }}
                                />
                            )}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
};

export default CustomerAnalyticsFilter;