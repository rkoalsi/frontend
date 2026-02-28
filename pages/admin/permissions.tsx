import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    Grid,
    Divider,
    Container,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Group as GroupIcon,
    Security as SecurityIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import capitalize from '../../src/util/capitalize';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedUser, setSelectedUser]: any = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const API_BASE = '/api/permissions';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`${process.env.api_url}/permissions/users`);
            if (response.status !== 200) throw new Error('Failed to fetch users');
            const data = response.data;
            setUsers(data.users || []);
        } catch (err) {
            setError('Failed to load users. Please try again.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = async (userData: any) => {
        try {
            setEditLoading(true);
            console.log(`${process.env.api_url}/permissions/users/${selectedUser._id}`, selectedUser._id, userData)
            const response = await axiosInstance.put(`${process.env.api_url}/permissions/users/${selectedUser._id}`, userData);
            if (response.status !== 200) throw new Error('Failed to update user');

            setSuccessMessage('User updated successfully!');
            setIsEditModalOpen(false);
            fetchUsers();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Failed to update user. Please try again.');
            console.error('Error updating user:', err);
        } finally {
            setEditLoading(false);
        }
    };

    const checkEditPermissions = async (userId: any) => {
        try {
            const response = await axiosInstance.get(`${process.env.api_url}/permissions/users/${userId}/edit-permissions`);
            if (response.status !== 200) throw new Error('Failed to check permissions');
            const data = await response.data;
            return data.can_edit;
        } catch (err) {
            console.error('Error checking edit permissions:', err);
            return false;
        }
    };

    const getRoleColor = (role: any) => {
        const colors: any = {
            admin: 'error',
            sales_admin: 'primary',
            catalogue_manager: 'success',
            hr: 'secondary',
            sales_person: 'success',
            warehouse: 'secondary',
            customer: 'info',
            default: 'default'
        };
        return colors[role] || colors.default;
    };
    const formatRole = (role: any) => {
        const roleNames: any = {
            admin: 'Admin',
            sales_admin: 'Sales Admin',
            catalogue_manager: 'Catalogue Manager',
            hr: 'Human Resources',
            sales_person: 'Sales Person',
            warehouse: 'Warehouse',
            customer: 'Customer',
            default: 'Unknown Department'
        };
        return roleNames[role] || roleNames.default;
    };

    const getStatusColor = (status: any) => {
        return status === 'active' ? 'success' : 'error';
    };

    const filteredUsers = users.filter((user: any) => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    const EditModal = () => {
        const [formData, setFormData] = useState({
            name: selectedUser?.name || '',
            first_name: selectedUser?.first_name || '',
            last_name: selectedUser?.last_name || '',
            email: selectedUser?.email || '',
            phone: selectedUser?.phone || '',
            role: selectedUser?.role || '',
            status: selectedUser?.status || 'active'
        });

        const handleInputChange = (field: any, value: any) => {
            setFormData(prev => ({ ...prev, [field]: value }));
        };

        return (
            <Dialog
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">Edit User</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid >
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid >
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid>
                            <TextField
                                fullWidth
                                label="Phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid sx={{ width: '35%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Role"
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                >
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="sales_admin">Sales Admin</MenuItem>
                                    <MenuItem value="catalogue_manager">Catalogue Manager</MenuItem>
                                    <MenuItem value="sales_person">Sales Person</MenuItem>
                                    <MenuItem value="warehouse">Warehouse</MenuItem>
                                    <MenuItem value="hr">HR</MenuItem>
                                    <MenuItem value="customer">Customer</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid sx={{ width: '25%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setIsEditModalOpen(false)}
                        color="inherit"
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleEditUser(formData)}
                        variant="contained"
                        disabled={editLoading}
                        startIcon={editLoading ? <CircularProgress size={16} /> : null}
                    >
                        {editLoading ? 'Updating...' : 'Update User'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const PermissionModal = () => {
        const permissions = selectedUser?.permissions || [];

        return (
            <Dialog
                open={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="h6">
                            Permissions for {selectedUser?.name}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box mb={2}>
                        <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                            Role:
                        </Typography>
                        <Chip
                            label={formatRole(selectedUser?.role)}
                            color={getRoleColor(selectedUser?.role)}
                            size="small"
                        />
                    </Box>

                    {permissions.length > 0 ? (
                        <Box>
                            {permissions.map((permission: any, index: number) => (
                                <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: 'grey.50' }} elevation={0}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box display="flex" alignItems="center">
                                            <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 32, height: 32 }}>
                                                <SecurityIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {permission.text}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {permission.path}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <CheckCircleIcon color="success" />
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Box textAlign="center" py={4}>
                            <CancelIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                No permissions assigned
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setIsPermissionModalOpen(false)}
                        variant="contained"
                        color="primary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const handleEditClick = async (user: any) => {
        const canEdit = await checkEditPermissions(user._id);
        if (canEdit) {
            setSelectedUser(user);
            setIsEditModalOpen(true);
        } else {
            setError('You do not have permission to edit this user.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <Box display="flex" alignItems="center">
                        <CircularProgress sx={{ mr: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Loading users...
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={{ xs: 2, sm: 0 }}>
                    <Box>
                        <Typography variant="h4" component="h1" display="flex" alignItems="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            <GroupIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            User & Permission Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage users and their permissions
                        </Typography>
                    </Box>
                    <Paper elevation={0} sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Total Users: <Typography component="span" fontWeight="bold">{users.length}</Typography>
                        </Typography>
                    </Paper>
                </Box>
            </Paper>

            {/* Alerts */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    icon={<ErrorIcon />}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    icon={<CheckCircleIcon />}
                    onClose={() => setSuccessMessage('')}
                >
                    {successMessage}
                </Alert>
            )}

            {/* Filters */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid>
                        <TextField
                            fullWidth
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            variant="outlined"
                        />
                    </Grid>
                    <Grid>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Role</InputLabel>
                            <Select
                                value={selectedRole}
                                label="Filter by Role"
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="sales_admin">Sales Admin</MenuItem>
                                <MenuItem value="catalogue_manager">Catalogue Manager</MenuItem>
                                <MenuItem value="hr">HR</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Users Table */}
            <Paper elevation={1}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Permissions</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user: any) => (
                                <TableRow
                                    key={user._id}
                                    hover
                                    sx={{ '&:hover': { backgroundColor: 'grey.50' } }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    mr: 2,
                                                    background: 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)'
                                                }}
                                            >
                                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {user.first_name} {user.last_name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.email}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {user.phone}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatRole(user.role)}
                                            color={getRoleColor(user.role)}
                                            size="small"
                                            variant="filled"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={capitalize(user.status)}
                                            color={getStatusColor(user.status)}
                                            size="small"
                                            variant="filled"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsPermissionModalOpen(true);
                                            }}
                                            sx={{ textTransform: 'none' }}
                                            variant="text"
                                            color="primary"
                                        >
                                            View ({user.permissions?.length || 0})
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip
                                            title="Cannot Edit Other Admins"
                                            disableHoverListener={!user.role.includes('admin')}
                                            disableFocusListener={!user.role.includes('admin')}
                                            disableTouchListener={!user.role.includes('admin')}
                                        >
                                            <span> {/* Required wrapper for disabled buttons */}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    disabled={user.role.includes('admin')}
                                                    onClick={() => handleEditClick(user)}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Edit
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredUsers.length === 0 && (
                    <Box textAlign="center" py={6}>
                        <GroupIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No users found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Try adjusting your search or filters
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Modals */}
            <EditModal />
            <PermissionModal />
        </Container>
    );
};

export default UserManagement;