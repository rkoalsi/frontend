import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    TextField,
    IconButton,
    Chip,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    Card,
    CardContent,
    Tooltip,
    Alert,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Fab,
    FormHelperText,
    Divider,
    Autocomplete,
    TablePagination,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Search,
    Clear,
    Person,
    Email,
    Phone,
    Business,
    Save,
    Cancel,
    Visibility,
    PersonAdd,
    ContentCopy,
    Refresh,
    LockReset,
    CheckCircle,
    Block,
    Link as LinkIcon,
    Key,
    Badge,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';

// TypeScript interfaces
interface User {
    _id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    code?: string;
    designation?: string;
    department?: string;
    customer_id?: string;
    customer_name?: string;
    created_at?: string;
    updated_at?: string;
}

interface Customer {
    _id: string;
    contact_id: string;
    contact_name: string;
    company_name?: string;
    email?: string;
    display_name: string;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
}

const CustomerManagement: React.FC = () => {
    const theme = useTheme();

    // State management
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(20);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [stats, setStats] = useState<Stats | null>(null);

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<boolean>(false);
    const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'active',
        password: '',
        customer_id: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Customer search state
    const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
    const [customerLoading, setCustomerLoading] = useState<boolean>(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Password state
    const [newPassword, setNewPassword] = useState<string>('');

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch users when filters change
    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch, statusFilter, page, rowsPerPage]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                per_page: rowsPerPage.toString(),
                role: 'customer', // Only fetch customers
            });

            if (debouncedSearch.trim()) {
                params.append('search', debouncedSearch.trim());
            }
            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await axiosInstance.get(`/admin/users?${params}`);
            setUsers(response.data.users);
            setTotalUsers(response.data.total);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Error fetching customers.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, page, rowsPerPage]);

    const generatePassword = async () => {
        try {
            const response = await axiosInstance.get('/admin/users/generate-password');
            const password = response.data.password;
            setFormData(prev => ({ ...prev, password }));
        } catch (error) {
            console.error('Error generating password:', error);
            toast.error('Error generating password.');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const searchCustomers = async (search: string) => {
        if (!search || search.length < 2) {
            setCustomerOptions([]);
            return;
        }

        setCustomerLoading(true);
        try {
            const response = await axiosInstance.get(`/admin/users/search/customers?search=${encodeURIComponent(search)}`);
            setCustomerOptions(response.data.customers);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setCustomerLoading(false);
        }
    };

    // Handle form changes
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!formData.phone?.trim()) errors.phone = 'Phone is required';
        if (!formData.status) errors.status = 'Status is required';

        // Password required only for new users
        if (dialogMode === 'create' && !formData.password.trim()) {
            errors.password = 'Password is required';
        }

        // Customer ID is required
        if (!formData.customer_id) {
            errors.customer_id = 'Please link this user to a customer account';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle dialog open for create
    const handleCreateClick = () => {
        setFormData({
            name: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            status: 'active',
            password: '',
            customer_id: '',
        });
        setSelectedCustomer(null);
        setFormErrors({});
        setDialogMode('create');
        setSelectedUser(null);
        setDialogOpen(true);
    };

    // Handle dialog open for edit
    const handleEditClick = (userItem: User) => {
        setFormData({
            name: userItem.name || '',
            first_name: userItem.first_name || '',
            last_name: userItem.last_name || '',
            email: userItem.email || '',
            phone: userItem.phone || '',
            status: userItem.status || 'active',
            password: '',
            customer_id: userItem.customer_id || '',
        });
        if (userItem.customer_id) {
            setSelectedCustomer({
                _id: '',
                contact_id: userItem.customer_id,
                contact_name: userItem.customer_name || userItem.customer_id,
                display_name: userItem.customer_name || userItem.customer_id,
            });
        } else {
            setSelectedCustomer(null);
        }
        setFormErrors({});
        setDialogMode('edit');
        setSelectedUser(userItem);
        setDialogOpen(true);
    };

    // Handle dialog open for view
    const handleViewClick = (userItem: User) => {
        setSelectedUser(userItem);
        setDialogMode('view');
        setDialogOpen(true);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload: any = {
                name: formData.name,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                role: 'customer', // Always set role to customer
                status: formData.status,
                customer_id: formData.customer_id,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (selectedCustomer) {
                payload.customer_name = selectedCustomer.display_name;
            }

            if (dialogMode === 'create') {
                await axiosInstance.post('/admin/users', payload);
                toast.success('Customer created successfully!');
            } else {
                await axiosInstance.put(`/admin/users/${selectedUser?._id}`, payload);
                toast.success('Customer updated successfully!');
            }

            setDialogOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving customer:', error);
            toast.error(error.response?.data?.detail || 'Error saving customer.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDeleteClick = (userItem: User) => {
        setUserToDelete(userItem);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            await axiosInstance.delete(`/admin/users/${userToDelete._id}`);
            toast.success('Customer deleted successfully!');
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            toast.error(error.response?.data?.detail || 'Error deleting customer.');
        }
    };

    // Handle password reset
    const handleResetPasswordClick = (userItem: User) => {
        setUserToResetPassword(userItem);
        setNewPassword('');
        setResetPasswordDialogOpen(true);
    };

    const handleResetPasswordConfirm = async () => {
        if (!userToResetPassword || !newPassword) return;

        try {
            await axiosInstance.post(`/admin/users/${userToResetPassword._id}/reset-password`, {
                password: newPassword,
            });
            toast.success('Password reset successfully!');
            setResetPasswordDialogOpen(false);
            setUserToResetPassword(null);
            setNewPassword('');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            toast.error(error.response?.data?.detail || 'Error resetting password.');
        }
    };

    const generateNewPasswordForReset = async () => {
        try {
            const response = await axiosInstance.get('/admin/users/generate-password');
            setNewPassword(response.data.password);
        } catch (error) {
            console.error('Error generating password:', error);
            toast.error('Error generating password.');
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (userItem: User) => {
        const newStatus = userItem.status === 'active' ? 'inactive' : 'active';
        try {
            await axiosInstance.put(`/admin/users/${userItem._id}/status`, { status: newStatus });
            toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchUsers();
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.detail || 'Error updating status.');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
                sx={{
                    pb: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        Customer Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Manage customer accounts and their linked contacts
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<PersonAdd />}
                    onClick={handleCreateClick}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 2,
                    }}
                >
                    Add Customer
                </Button>
            </Box>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} mb={4}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'primary.main',
                                        width: 56,
                                        height: 56,
                                        mx: 'auto',
                                        mb: 2
                                    }}
                                >
                                    <Person sx={{ fontSize: 28 }} />
                                </Avatar>
                                <Typography variant="h3" color="primary" fontWeight="bold">
                                    {stats.by_role.customer || 0}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                    Total Customers
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'success.main',
                                        width: 56,
                                        height: 56,
                                        mx: 'auto',
                                        mb: 2
                                    }}
                                >
                                    <CheckCircle sx={{ fontSize: 28 }} />
                                </Avatar>
                                <Typography variant="h3" color="success.main" fontWeight="bold">
                                    {users.filter(u => u.status === 'active').length}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                    Active
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'error.main',
                                        width: 56,
                                        height: 56,
                                        mx: 'auto',
                                        mb: 2
                                    }}
                                >
                                    <Block sx={{ fontSize: 28 }} />
                                </Avatar>
                                <Typography variant="h3" color="error.main" fontWeight="bold">
                                    {users.filter(u => u.status === 'inactive').length}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                    Inactive
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Search and Filters */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    minHeight: 56,
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Filter by Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Filter by Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{
                                    borderRadius: 2,
                                    minHeight: 56,
                                }}
                            >
                                <MenuItem value="">All Customers</MenuItem>
                                <MenuItem value="active">Active Customers</MenuItem>
                                <MenuItem value="inactive">Inactive Customers</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                            }}
                            sx={{
                                borderRadius: 2,
                                minHeight: 56,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Customers Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                }}
            >
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Customer</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Contact Info</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Linked Account</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Box py={8}>
                                                    <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                                    <Typography variant="h6" color="text.secondary">
                                                        No customers found
                                                    </Typography>
                                                    <Typography variant="body2" color="text.disabled" mb={3}>
                                                        Add your first customer to get started
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<PersonAdd />}
                                                        onClick={handleCreateClick}
                                                    >
                                                        Add Customer
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((userItem) => (
                                            <TableRow
                                                key={userItem._id}
                                                hover
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                                                    },
                                                }}
                                            >
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: 'primary.main',
                                                                width: 48,
                                                                height: 48,
                                                                fontSize: '1.2rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {userItem.name?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={600} fontSize="1rem">
                                                                {userItem.name}
                                                            </Typography>
                                                            {(userItem.first_name || userItem.last_name) && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {userItem.first_name} {userItem.last_name}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Email fontSize="small" sx={{ color: 'text.disabled' }} />
                                                            <Typography variant="body2">{userItem.email}</Typography>
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Phone fontSize="small" sx={{ color: 'text.disabled' }} />
                                                            <Typography variant="body2">{userItem.phone}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {userItem.customer_id ? (
                                                        <Chip
                                                            icon={<LinkIcon />}
                                                            label={userItem.customer_name || userItem.customer_id}
                                                            size="medium"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ fontWeight: 500 }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Not linked"
                                                            size="medium"
                                                            color="warning"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={`Click to ${userItem.status === 'active' ? 'deactivate' : 'activate'}`}>
                                                        <Chip
                                                            icon={userItem.status === 'active' ? <CheckCircle /> : <Block />}
                                                            label={userItem.status === 'active' ? 'Active' : 'Inactive'}
                                                            color={userItem.status === 'active' ? 'success' : 'default'}
                                                            size="medium"
                                                            onClick={() => handleStatusToggle(userItem)}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                fontWeight: 500,
                                                                '&:hover': {
                                                                    transform: 'scale(1.02)',
                                                                },
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box display="flex" justifyContent="flex-end" gap={1}>
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleViewClick(userItem)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                                                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
                                                                }}
                                                            >
                                                                <Visibility fontSize="small" color="info" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleEditClick(userItem)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                                                                }}
                                                            >
                                                                <Edit fontSize="small" color="primary" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reset Password">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleResetPasswordClick(userItem)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                                    '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) },
                                                                }}
                                                            >
                                                                <LockReset fontSize="small" color="warning" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteClick(userItem)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                                                                }}
                                                            >
                                                                <Delete fontSize="small" color="error" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={totalUsers}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 20, 50, 100]}
                            sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                        />
                    </>
                )}
            </Paper>

            {/* Create/Edit Dialog - Made Bigger */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        minHeight: '70vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        pb: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {dialogMode === 'create' ? <PersonAdd /> : dialogMode === 'edit' ? <Edit /> : <Visibility />}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={600}>
                                {dialogMode === 'create' ? 'Add New Customer' : dialogMode === 'edit' ? 'Edit Customer' : 'Customer Details'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {dialogMode === 'create'
                                    ? 'Create a new customer account and link it to a contact'
                                    : dialogMode === 'edit'
                                    ? 'Update customer information'
                                    : 'View customer account details'
                                }
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 4 }}>
                    {dialogMode === 'view' && selectedUser ? (
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        height: '100%',
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                                        Personal Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                            <Typography variant="body1" fontWeight={500}>{selectedUser.name}</Typography>
                                        </Grid>
                                        {selectedUser.first_name && (
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">First Name</Typography>
                                                <Typography variant="body1">{selectedUser.first_name}</Typography>
                                            </Grid>
                                        )}
                                        {selectedUser.last_name && (
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">Last Name</Typography>
                                                <Typography variant="body1">{selectedUser.last_name}</Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        height: '100%',
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                                        Contact Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Email color="action" />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                                    <Typography variant="body1">{selectedUser.email}</Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Phone color="action" />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                                                    <Typography variant="body1">{selectedUser.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                                        Account Status & Linked Contact
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Account Status</Typography>
                                            <Box mt={0.5}>
                                                <Chip
                                                    icon={selectedUser.status === 'active' ? <CheckCircle /> : <Block />}
                                                    label={selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                                                    color={selectedUser.status === 'active' ? 'success' : 'default'}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Linked Customer Account</Typography>
                                            <Box mt={0.5}>
                                                {selectedUser.customer_id ? (
                                                    <Chip
                                                        icon={<Business />}
                                                        label={selectedUser.customer_name || selectedUser.customer_id}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Chip label="Not linked" color="warning" variant="outlined" />
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={4}>
                            {/* Personal Information Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Person color="primary" />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Personal Information
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Full Name"
                                                value={formData.name}
                                                onChange={(e) => handleFormChange('name', e.target.value)}
                                                error={!!formErrors.name}
                                                helperText={formErrors.name}
                                                required
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Badge color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <TextField
                                                fullWidth
                                                label="First Name"
                                                value={formData.first_name}
                                                onChange={(e) => handleFormChange('first_name', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <TextField
                                                fullWidth
                                                label="Last Name"
                                                value={formData.last_name}
                                                onChange={(e) => handleFormChange('last_name', e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Contact Information Section */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        height: '100%',
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Email color="primary" />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Contact Information
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label="Email Address"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleFormChange('email', e.target.value)}
                                                error={!!formErrors.email}
                                                helperText={formErrors.email}
                                                required
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Email color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                value={formData.phone}
                                                onChange={(e) => handleFormChange('phone', e.target.value)}
                                                error={!!formErrors.phone}
                                                helperText={formErrors.phone}
                                                required
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Phone color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Account Settings Section */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        height: '100%',
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Key color="primary" />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Account Settings
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12 }}>
                                            <FormControl fullWidth required error={!!formErrors.status}>
                                                <InputLabel>Account Status</InputLabel>
                                                <Select
                                                    value={formData.status}
                                                    label="Account Status"
                                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                                >
                                                    <MenuItem value="active">
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <CheckCircle color="success" fontSize="small" />
                                                            Active
                                                        </Box>
                                                    </MenuItem>
                                                    <MenuItem value="inactive">
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Block color="error" fontSize="small" />
                                                            Inactive
                                                        </Box>
                                                    </MenuItem>
                                                </Select>
                                                {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label={dialogMode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}
                                                type="text"
                                                value={formData.password}
                                                onChange={(e) => handleFormChange('password', e.target.value)}
                                                error={!!formErrors.password}
                                                helperText={formErrors.password || 'Click generate for a secure password'}
                                                required={dialogMode === 'create'}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Key color="action" />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Tooltip title="Generate Secure Password">
                                                                <IconButton onClick={generatePassword} color="primary">
                                                                    <Refresh />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {formData.password && (
                                                                <Tooltip title="Copy Password">
                                                                    <IconButton onClick={() => copyToClipboard(formData.password)} color="success">
                                                                        <ContentCopy />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Customer Link Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: `2px solid ${formErrors.customer_id ? theme.palette.error.main : theme.palette.primary.main}`,
                                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Business color="primary" />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Link to Customer Account
                                        </Typography>
                                        <Chip label="Required" size="small" color="error" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={3}>
                                        Search and select the customer account from your contacts to link with this user.
                                        This determines which customer data they can access when placing orders.
                                    </Typography>
                                    <Autocomplete
                                        options={customerOptions}
                                        getOptionLabel={(option) => option.display_name}
                                        value={selectedCustomer}
                                        onChange={(_, value) => {
                                            setSelectedCustomer(value);
                                            handleFormChange('customer_id', value?.contact_id || '');
                                        }}
                                        onInputChange={(_, value) => {
                                            searchCustomers(value);
                                        }}
                                        loading={customerLoading}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search Customer by Name or Email"
                                                placeholder="Start typing to search..."
                                                error={!!formErrors.customer_id}
                                                helperText={formErrors.customer_id}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <>
                                                            <InputAdornment position="start">
                                                                <Search color="action" />
                                                            </InputAdornment>
                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    ),
                                                    endAdornment: (
                                                        <>
                                                            {customerLoading && <CircularProgress color="inherit" size={20} />}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option._id || option.contact_id}>
                                                <Box display="flex" alignItems="center" gap={2} py={1}>
                                                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                                                        <Business />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight={500}>
                                                            {option.display_name}
                                                        </Typography>
                                                        {option.email && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </li>
                                        )}
                                        isOptionEqualToValue={(option, value) => option.contact_id === value.contact_id}
                                        noOptionsText="Type at least 2 characters to search..."
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        startIcon={<Cancel />}
                        size="large"
                    >
                        {dialogMode === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {dialogMode !== 'view' && (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                            size="large"
                            sx={{ px: 4 }}
                        >
                            {dialogMode === 'create' ? 'Create Customer' : 'Save Changes'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                            <Delete />
                        </Avatar>
                        <Typography variant="h6">Confirm Delete</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone.
                    </Alert>
                    <Typography>
                        Are you sure you want to delete customer <strong>{userToDelete?.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
                        Delete Customer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog
                open={resetPasswordDialogOpen}
                onClose={() => setResetPasswordDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <LockReset />
                        </Avatar>
                        <Box>
                            <Typography variant="h6">Reset Password</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Set a new password for {userToResetPassword?.name}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mt: 2 }}
                        helperText="Click generate for a secure password, then copy and share with the customer"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Key color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Generate Secure Password">
                                        <IconButton onClick={generateNewPasswordForReset} color="primary">
                                            <Refresh />
                                        </IconButton>
                                    </Tooltip>
                                    {newPassword && (
                                        <Tooltip title="Copy Password">
                                            <IconButton onClick={() => copyToClipboard(newPassword)} color="success">
                                                <ContentCopy />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleResetPasswordConfirm}
                        disabled={!newPassword}
                        startIcon={<LockReset />}
                    >
                        Reset Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CustomerManagement;
