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
    Tooltip,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    Autocomplete,
    TablePagination,
    useTheme,
    useMediaQuery,
    alpha,
} from '@mui/material';
import {
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

interface CustomerLoginUser {
    _id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: number;
    status: string;
    customer_id?: string;
    customer_name?: string;
    created_at?: string;
}

interface CustomerOption {
    _id: string;
    contact_id: string;
    contact_name: string;
    company_name?: string;
    email?: string;
    display_name: string;
}

const BASE = '/salesperson/customer-logins';

const CustomerLoginsPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user }: any = useContext(AuthContext);

    const [users, setUsers] = useState<CustomerLoginUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalUsers, setTotalUsers] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedUser, setSelectedUser] = useState<CustomerLoginUser | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '' as number | '',
        status: 'active',
        password: '',
        customer_id: '',
        customer_name: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<CustomerLoginUser | null>(null);

    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<CustomerLoginUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const [shareOpen, setShareOpen] = useState(false);
    const [userToShare, setUserToShare] = useState<CustomerLoginUser | null>(null);
    const [sharePwd, setSharePwd] = useState('');
    const [sharingPwd, setSharingPwd] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, statusFilter, page, rowsPerPage]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                per_page: rowsPerPage.toString(),
            });
            if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
            if (statusFilter) params.append('status', statusFilter);
            const res = await axiosInstance.get(`${BASE}?${params}`);
            setUsers(res.data.users);
            setTotalUsers(res.data.total);
        } catch {
            toast.error('Error fetching customer logins.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, page, rowsPerPage]);

    const generatePassword = async (): Promise<string | null> => {
        try {
            const res = await axiosInstance.get(`${BASE}/generate-password`);
            return res.data.password;
        } catch {
            toast.error('Error generating password.');
            return null;
        }
    };

    const handleGenerateFormPassword = async () => {
        const pwd = await generatePassword();
        if (pwd) setFormData(prev => ({ ...prev, password: pwd }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const searchCustomers = async (search: string) => {
        if (!search || search.length < 2) { setCustomerOptions([]); return; }
        setCustomerLoading(true);
        try {
            const res = await axiosInstance.get(`${BASE}/search/customers?search=${encodeURIComponent(search)}`);
            setCustomerOptions(res.data.customers);
        } catch {
            // ignore
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        if (!formData.phone) errors.phone = 'Phone is required';
        if (dialogMode === 'create' && !formData.password.trim()) errors.password = 'Password is required';
        if (!formData.customer_id) errors.customer_id = 'Please link this user to a customer account';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormData({ name: '', first_name: '', last_name: '', email: '', phone: '', status: 'active', password: '', customer_id: '', customer_name: '' });
        setSelectedCustomer(null);
        setFormErrors({});
    };

    const handleCreateClick = () => {
        resetForm();
        setDialogMode('create');
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEditClick = (u: CustomerLoginUser) => {
        setFormData({
            name: u.name || '',
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            phone: u.phone ? Number(u.phone) : '',
            status: u.status || 'active',
            password: '',
            customer_id: u.customer_id || '',
            customer_name: u.customer_name || '',
        });
        if (u.customer_id) {
            setSelectedCustomer({
                _id: '',
                contact_id: u.customer_id,
                contact_name: u.customer_name || u.customer_id,
                display_name: u.customer_name || u.customer_id,
            });
        } else {
            setSelectedCustomer(null);
        }
        setFormErrors({});
        setDialogMode('edit');
        setSelectedUser(u);
        setDialogOpen(true);
    };

    const handleViewClick = (u: CustomerLoginUser) => {
        setSelectedUser(u);
        setDialogMode('view');
        setDialogOpen(true);
    };

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
                status: formData.status,
                customer_id: formData.customer_id,
                customer_name: selectedCustomer?.display_name || formData.customer_name,
            };
            if (formData.password) payload.password = formData.password;
            if (dialogMode === 'create') {
                await axiosInstance.post(BASE, payload);
                toast.success('Customer login created!');
            } else {
                await axiosInstance.put(`${BASE}/${selectedUser?._id}`, payload);
                toast.success('Customer login updated!');
            }
            setDialogOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error saving customer login.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            await axiosInstance.delete(`${BASE}/${userToDelete._id}`);
            toast.success('Customer login deleted!');
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error deleting.');
        }
    };

    const handleResetPasswordConfirm = async () => {
        if (!userToReset || !newPassword) return;
        try {
            await axiosInstance.post(`${BASE}/${userToReset._id}/reset-password`, { password: newPassword });
            toast.success('Password reset!');
            setResetDialogOpen(false);
            setNewPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error resetting password.');
        }
    };

    const handleGenerateResetPassword = async () => {
        const pwd = await generatePassword();
        if (pwd) setNewPassword(pwd);
    };

    const handleStatusToggle = async (u: CustomerLoginUser) => {
        const newStatus = u.status === 'active' ? 'inactive' : 'active';
        try {
            await axiosInstance.put(`${BASE}/${u._id}/status`, { status: newStatus });
            toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error updating status.');
        }
    };

    const handleShareOpen = (u: CustomerLoginUser) => {
        setUserToShare(u);
        setSharePwd('');
        setShareOpen(true);
    };

    const handleGenerateSharePwd = async () => {
        setSharingPwd(true);
        const pwd = await generatePassword();
        if (pwd) setSharePwd(pwd);
        setSharingPwd(false);
    };

    const handleCopyShareCred = () => {
        if (!userToShare || !sharePwd) return;
        const text = `Link: https://orderform.pupscribe.in/login\nEmail: ${userToShare.email}\nPassword: ${sharePwd}`;
        navigator.clipboard.writeText(text).then(
            () => toast.success('Credentials copied!'),
            () => toast.error('Failed to copy.'),
        );
    };

    // ── Mobile card for one user ─────────────────────────────────────────────
    const MobileUserCard = ({ u }: { u: CustomerLoginUser }) => (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
            }}
        >
            {/* Top row: avatar + name + status chip */}
            <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 700, flexShrink: 0 }}>
                    {u.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} noWrap>{u.name}</Typography>
                    {u.customer_name && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {u.customer_name}
                        </Typography>
                    )}
                </Box>
                <Chip
                    icon={u.status === 'active' ? <CheckCircle /> : <Block />}
                    label={u.status === 'active' ? 'Active' : 'Inactive'}
                    color={u.status === 'active' ? 'success' : 'default'}
                    size="small"
                    onClick={() => handleStatusToggle(u)}
                    sx={{ cursor: 'pointer', flexShrink: 0 }}
                />
            </Box>

            {/* Contact details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Email fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
                    <Typography variant="body2" noWrap>{u.email}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Phone fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
                    <Typography variant="body2">{u.phone}</Typography>
                </Box>
            </Box>

            <Divider />

            {/* Actions */}
            <Box display="flex" gap={1} flexWrap="wrap">
                <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={() => handleViewClick(u)} sx={{ flex: 1, minWidth: 80, textTransform: 'none', fontSize: '0.75rem' }}>
                    View
                </Button>
                <Button size="small" variant="outlined" color="primary" startIcon={<Edit />} onClick={() => handleEditClick(u)} sx={{ flex: 1, minWidth: 80, textTransform: 'none', fontSize: '0.75rem' }}>
                    Edit
                </Button>
                <Button size="small" variant="outlined" color="warning" startIcon={<LockReset />} onClick={() => { setUserToReset(u); setNewPassword(''); setResetDialogOpen(true); }} sx={{ flex: 1, minWidth: 80, textTransform: 'none', fontSize: '0.75rem' }}>
                    Reset
                </Button>
                <Button size="small" variant="outlined" color="success" startIcon={<ContentCopy />} onClick={() => handleShareOpen(u)} sx={{ flex: 1, minWidth: 80, textTransform: 'none', fontSize: '0.75rem' }}>
                    Share
                </Button>
                <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }} sx={{ flex: 1, minWidth: 80, textTransform: 'none', fontSize: '0.75rem' }}>
                    Delete
                </Button>
            </Box>
        </Paper>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    mb: 4,
                    pb: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Customer Logins
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Create and manage order-form logins for your customers
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleCreateClick}
                    fullWidth={isMobile}
                    sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Add Customer Login
                </Button>
            </Box>

            {/* Search & filter */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        size={isMobile ? 'small' : 'medium'}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}><Clear /></IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, alignItems: 'center' }}>
                        <FormControl size={isMobile ? 'small' : 'medium'}>
                            <InputLabel>Filter by Status</InputLabel>
                            <Select value={statusFilter} label="Filter by Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', height: isMobile ? 40 : 56 }}
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                    <CircularProgress />
                </Box>
            ) : users.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 6, textAlign: 'center' }}>
                    <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No customer logins yet</Typography>
                    <Typography variant="body2" color="text.disabled" mb={3}>
                        Create a login so your customer can place orders online
                    </Typography>
                    <Button variant="contained" startIcon={<PersonAdd />} onClick={handleCreateClick}>
                        Add Customer Login
                    </Button>
                </Paper>
            ) : isMobile ? (
                /* ── Mobile: card list ────────────────────────────────────── */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {users.map(u => <MobileUserCard key={u._id} u={u} />)}
                    <TablePagination
                        component="div"
                        count={totalUsers}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 20, 50]}
                        sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 1 }}
                    />
                </Box>
            ) : (
                /* ── Desktop: table ───────────────────────────────────────── */
                <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
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
                                {users.map(u => (
                                    <TableRow key={u._id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 600 }}>
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight={600}>{u.name}</Typography>
                                                    {(u.first_name || u.last_name) && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {u.first_name} {u.last_name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexDirection="column" gap={0.5}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Email fontSize="small" sx={{ color: 'text.disabled' }} />
                                                    <Typography variant="body2">{u.email}</Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Phone fontSize="small" sx={{ color: 'text.disabled' }} />
                                                    <Typography variant="body2">{u.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {u.customer_id ? (
                                                <Chip icon={<LinkIcon />} label={u.customer_name || u.customer_id} size="medium" color="primary" variant="outlined" sx={{ fontWeight: 500 }} />
                                            ) : (
                                                <Chip label="Not linked" size="medium" color="warning" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={`Click to ${u.status === 'active' ? 'deactivate' : 'activate'}`}>
                                                <Chip
                                                    icon={u.status === 'active' ? <CheckCircle /> : <Block />}
                                                    label={u.status === 'active' ? 'Active' : 'Inactive'}
                                                    color={u.status === 'active' ? 'success' : 'default'}
                                                    size="medium"
                                                    onClick={() => handleStatusToggle(u)}
                                                    sx={{ cursor: 'pointer', fontWeight: 500 }}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => handleViewClick(u)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) } }}>
                                                        <Visibility fontSize="small" color="info" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleEditClick(u)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                                                        <Edit fontSize="small" color="primary" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reset Password">
                                                    <IconButton size="small" onClick={() => { setUserToReset(u); setNewPassword(''); setResetDialogOpen(true); }} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) } }}>
                                                        <LockReset fontSize="small" color="warning" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Share Credentials">
                                                    <IconButton size="small" onClick={() => handleShareOpen(u)} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) } }}>
                                                        <ContentCopy fontSize="small" color="success" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }} sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
                                                        <Delete fontSize="small" color="error" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={totalUsers}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 20, 50]}
                        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                    />
                </Paper>
            )}

            {/* ── Create / Edit / View Dialog ───────────────────────────── */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            {dialogMode === 'create' ? <PersonAdd fontSize="small" /> : dialogMode === 'edit' ? <Edit fontSize="small" /> : <Visibility fontSize="small" />}
                        </Avatar>
                        <Box>
                            <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                                {dialogMode === 'create' ? 'Add Customer Login' : dialogMode === 'edit' ? 'Edit Customer Login' : 'Customer Login Details'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {dialogMode === 'create' ? 'Create a new login for one of your customers' : dialogMode === 'edit' ? 'Update customer login details' : 'View login account details'}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ py: 3, px: { xs: 2, md: 3 }, overflowY: 'auto' }}>
                    {dialogMode === 'view' && selectedUser ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>Personal Information</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                <Typography fontWeight={500} mb={1}>{selectedUser.name}</Typography>
                                {selectedUser.first_name && <><Typography variant="caption" color="text.secondary">First Name</Typography><Typography mb={1}>{selectedUser.first_name}</Typography></>}
                                {selectedUser.last_name && <><Typography variant="caption" color="text.secondary">Last Name</Typography><Typography>{selectedUser.last_name}</Typography></>}
                            </Paper>
                            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>Contact & Account</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <Email color="action" fontSize="small" />
                                    <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{selectedUser.email}</Typography></Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <Phone color="action" fontSize="small" />
                                    <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{selectedUser.phone}</Typography></Box>
                                </Box>
                                <Typography variant="caption" color="text.secondary">Status</Typography>
                                <Box mt={0.5} mb={1.5}>
                                    <Chip icon={selectedUser.status === 'active' ? <CheckCircle /> : <Block />} label={selectedUser.status} color={selectedUser.status === 'active' ? 'success' : 'default'} size="small" />
                                </Box>
                                {selectedUser.customer_id && (
                                    <>
                                        <Typography variant="caption" color="text.secondary">Linked Customer</Typography>
                                        <Box mt={0.5}><Chip icon={<Business />} label={selectedUser.customer_name || selectedUser.customer_id} color="primary" variant="outlined" size="small" /></Box>
                                    </>
                                )}
                            </Paper>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Personal info */}
                            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Person color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Personal Information</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={e => handleFormChange('name', e.target.value)}
                                        error={!!formErrors.name}
                                        helperText={formErrors.name}
                                        required
                                        size={isMobile ? 'small' : 'medium'}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Badge color="action" /></InputAdornment> }}
                                    />
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <TextField
                                            fullWidth
                                            label="First Name"
                                            value={formData.first_name}
                                            onChange={e => handleFormChange('first_name', e.target.value)}
                                            size={isMobile ? 'small' : 'medium'}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Last Name"
                                            value={formData.last_name}
                                            onChange={e => handleFormChange('last_name', e.target.value)}
                                            size={isMobile ? 'small' : 'medium'}
                                        />
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Contact & account */}
                            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Email color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Contact Information</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleFormChange('email', e.target.value)}
                                        error={!!formErrors.email}
                                        helperText={formErrors.email}
                                        required
                                        size={isMobile ? 'small' : 'medium'}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        type="number"
                                        value={formData.phone}
                                        onChange={e => handleFormChange('phone', e.target.value === '' ? '' : Number(e.target.value))}
                                        error={!!formErrors.phone}
                                        helperText={formErrors.phone}
                                        required
                                        size={isMobile ? 'small' : 'medium'}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment> }}
                                    />
                                </Box>
                            </Paper>

                            {/* Account settings */}
                            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Key color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Account Settings</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                                        <InputLabel>Account Status</InputLabel>
                                        <Select value={formData.status} label="Account Status" onChange={e => handleFormChange('status', e.target.value)}>
                                            <MenuItem value="active"><Box display="flex" alignItems="center" gap={1}><CheckCircle color="success" fontSize="small" />Active</Box></MenuItem>
                                            <MenuItem value="inactive"><Box display="flex" alignItems="center" gap={1}><Block color="error" fontSize="small" />Inactive</Box></MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label={dialogMode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}
                                        type="text"
                                        value={formData.password}
                                        onChange={e => handleFormChange('password', e.target.value)}
                                        error={!!formErrors.password}
                                        helperText={formErrors.password || 'Click generate for a secure password'}
                                        required={dialogMode === 'create'}
                                        size={isMobile ? 'small' : 'medium'}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Key color="action" /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Tooltip title="Generate Password">
                                                        <IconButton onClick={handleGenerateFormPassword} color="primary" size="small"><Refresh /></IconButton>
                                                    </Tooltip>
                                                    {formData.password && (
                                                        <Tooltip title="Copy">
                                                            <IconButton onClick={() => copyToClipboard(formData.password)} color="success" size="small"><ContentCopy /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                            </Paper>

                            {/* Customer link */}
                            <Paper elevation={0} sx={{ p: 2.5, border: `2px solid ${formErrors.customer_id ? theme.palette.error.main : theme.palette.primary.main}`, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Business color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Link to Customer Account</Typography>
                                    <Chip label="Required" size="small" color="error" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Only your assigned customers appear in the search below.
                                </Typography>
                                <Autocomplete
                                    options={customerOptions}
                                    getOptionLabel={o => o.display_name}
                                    value={selectedCustomer}
                                    onChange={(_, value) => { setSelectedCustomer(value); handleFormChange('customer_id', value?.contact_id || ''); handleFormChange('customer_name', value?.display_name || ''); }}
                                    onInputChange={(_, value) => searchCustomers(value)}
                                    loading={customerLoading}
                                    size={isMobile ? 'small' : 'medium'}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            label="Search your customers by name"
                                            placeholder="Start typing..."
                                            error={!!formErrors.customer_id}
                                            helperText={formErrors.customer_id}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: <><InputAdornment position="start"><Search color="action" /></InputAdornment>{params.InputProps.startAdornment}</>,
                                                endAdornment: <>{customerLoading && <CircularProgress size={18} />}{params.InputProps.endAdornment}</>,
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option._id || option.contact_id}>
                                            <Box display="flex" alignItems="center" gap={1.5} py={0.5}>
                                                <Avatar sx={{ bgcolor: 'primary.light', width: 28, height: 28 }}><Business sx={{ fontSize: 14 }} /></Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>{option.display_name}</Typography>
                                                    {option.email && <Typography variant="caption" color="text.secondary">{option.email}</Typography>}
                                                </Box>
                                            </Box>
                                        </li>
                                    )}
                                    isOptionEqualToValue={(o, v) => o.contact_id === v.contact_id}
                                    noOptionsText="Type at least 2 characters to search your customers..."
                                />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: `1px solid ${theme.palette.divider}`, flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>
                        {dialogMode === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {dialogMode !== 'view' && (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Save />}
                            fullWidth={isMobile}
                            size="large"
                            sx={{ px: 4 }}
                        >
                            {dialogMode === 'create' ? 'Create Login' : 'Save Changes'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ── Delete confirmation ───────────────────────────────────── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'error.main' }}><Delete /></Avatar>
                        <Typography variant="h6">Confirm Delete</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
                    <Typography>Delete login for <strong>{userToDelete?.name}</strong>?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} fullWidth={isMobile}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm} fullWidth={isMobile}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ── Reset password ────────────────────────────────────────── */}
            <Dialog
                open={resetDialogOpen}
                onClose={() => setResetDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'warning.main' }}><LockReset /></Avatar>
                        <Box>
                            <Typography variant="h6">Reset Password</Typography>
                            <Typography variant="body2" color="text.secondary">{userToReset?.name}</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="text"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ mt: 2 }}
                        helperText="Generate a secure password, then share with the customer"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Key color="action" /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Generate"><IconButton onClick={handleGenerateResetPassword} color="primary" size="small"><Refresh /></IconButton></Tooltip>
                                    {newPassword && <Tooltip title="Copy"><IconButton onClick={() => copyToClipboard(newPassword)} color="success" size="small"><ContentCopy /></IconButton></Tooltip>}
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Button onClick={() => setResetDialogOpen(false)} fullWidth={isMobile}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={handleResetPasswordConfirm} disabled={!newPassword} startIcon={<LockReset />} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>
                        Reset Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Share credentials ─────────────────────────────────────── */}
            <Dialog
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'success.main' }}><ContentCopy /></Avatar>
                        <Box>
                            <Typography variant="h6">Share Login Credentials</Typography>
                            <Typography variant="body2" color="text.secondary">{userToShare?.name}</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, md: 3 } }}>
                    <TextField
                        fullWidth
                        label="Email"
                        value={userToShare?.email ?? ''}
                        size={isMobile ? 'small' : 'medium'}
                        slotProps={{ input: { readOnly: true } }}
                        sx={{ mt: 2, mb: 2 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="text"
                        value={sharePwd}
                        onChange={e => setSharePwd(e.target.value)}
                        placeholder="Type or generate a password"
                        size={isMobile ? 'small' : 'medium'}
                        helperText="Enter the password you set (or generate a new one to reset)"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Key color="action" /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Generate">
                                        <span>
                                            <IconButton onClick={handleGenerateSharePwd} disabled={sharingPwd} color="primary" size="small">
                                                {sharingPwd ? <CircularProgress size={18} /> : <Refresh />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {sharePwd && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-line" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {`Link: https://orderform.pupscribe.in/login\nEmail: ${userToShare?.email}\nPassword: ${sharePwd}`}
                            </Typography>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Button onClick={() => setShareOpen(false)} fullWidth={isMobile}>Cancel</Button>
                    <Button variant="contained" color="success" startIcon={<ContentCopy />} onClick={handleCopyShareCred} disabled={!sharePwd} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>
                        Copy Credentials
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CustomerLoginsPage;
