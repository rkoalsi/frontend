import React, { useState, useEffect, useCallback, useContext } from 'react';
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
    Stack,
    Tooltip,
    Tabs,
    Tab,
    Checkbox,
    Divider,
    FormHelperText,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    Security as SecurityIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    LockReset as LockResetIcon,
    ContentCopy as ContentCopyIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import capitalize from '../../src/util/capitalize';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';

const DEFAULT_ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'sales_admin', label: 'Sales Admin' },
    { value: 'sales_person', label: 'Sales Person' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'catalogue_manager', label: 'Catalogue Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'customer', label: 'Customer' },
];

const ROLE_COLORS: Record<string, any> = {
    admin: 'error',
    sales_admin: 'primary',
    catalogue_manager: 'success',
    hr: 'secondary',
    sales_person: 'success',
    warehouse: 'secondary',
    customer: 'info',
};

const EMPTY_USER_FORM = {
    name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'sales_person',
    status: 'active',
    password: '',
};

const UserManagement = () => {
    const { user }: any = useContext(AuthContext);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isAdmin = user?.role === 'admin'
    const [tab, setTab] = useState(0);

    // --- Users state ---
    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');

    // --- Dialogs ---
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [resetPwOpen, setResetPwOpen] = useState(false);
    const [permViewOpen, setPermViewOpen] = useState(false);
    const [manageRoleOpen, setManageRoleOpen] = useState(false);
    const [manageRolePerms, setManageRolePerms] = useState<Record<string, boolean>>({});
    const [manageRoleSaving, setManageRoleSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // --- Form state ---
    const [addForm, setAddForm] = useState({ ...EMPTY_USER_FORM });
    const [editForm, setEditForm] = useState<any>({});
    const [newPassword, setNewPassword] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // --- Roles state ---
    const [roles, setRoles] = useState<{ value: string; label: string }[]>(DEFAULT_ROLES);
    const [addRoleOpen, setAddRoleOpen] = useState(false);
    const [newRoleForm, setNewRoleForm] = useState({ label: '', value: '' });
    const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({});
    const [roleSaving, setRoleSaving] = useState(false);

    const formatRole = (role: string) => roles.find(r => r.value === role)?.label || role;
    const getRoleColor = (role: string) => ROLE_COLORS[role] || 'default';

    // --- Permissions matrix state ---
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [permLoading, setPermLoading] = useState(false);
    const [permMatrix, setPermMatrix] = useState<Record<string, string[]>>({});
    const [permSaving, setPermSaving] = useState(false);

    const API = process.env.api_url;

    // ---- Data fetching ----

    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const res = await axiosInstance.get(`${API}/permissions/users`);
            setUsers(res.data.users || []);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, [API]);

    const fetchAllPermissions = useCallback(async () => {
        try {
            setPermLoading(true);
            const res = await axiosInstance.get(`${API}/permissions/admin/all-permissions`);
            const perms = res.data.permissions || [];
            setAllPermissions(perms);
            // Build local matrix from fetched data
            const matrix: Record<string, string[]> = {};
            perms.forEach((p: any) => {
                matrix[p.id] = [...(p.allowed_roles || [])];
            });
            setPermMatrix(matrix);
        } catch {
            toast.error('Failed to load permissions');
        } finally {
            setPermLoading(false);
        }
    }, [API]);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`${API}/permissions/roles`);
            const fetched = res.data.roles || [];
            if (fetched.length) {
                // Keep defaults' order, then append any custom roles from the backend
                const merged = [...DEFAULT_ROLES];
                fetched.forEach((r: any) => {
                    if (!merged.some(m => m.value === r.value)) merged.push({ value: r.value, label: r.label });
                });
                setRoles(merged);
            }
        } catch {
            // fall back to defaults silently
        }
    }, [API]);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    useEffect(() => {
        if (tab === 1) fetchAllPermissions();
    }, [tab, fetchAllPermissions]);

    // ---- Password helpers ----

    const generatePassword = async () => {
        try {
            const res = await axiosInstance.get(`${API}/admin/users/generate-password`);
            return res.data.password as string;
        } catch {
            // fallback
            return Math.random().toString(36).slice(-10) + 'A1!';
        }
    };

    const handleGenerateAddPassword = async () => {
        const pw = await generatePassword();
        setAddForm(f => ({ ...f, password: pw }));
    };

    const handleGenerateResetPassword = async () => {
        const pw = await generatePassword();
        setNewPassword(pw);
    };

    // ---- Add User ----

    const handleAddUser = async () => {
        if (!addForm.name || !addForm.email || !addForm.password || !addForm.phone || !addForm.role) {
            toast.error('Please fill in all required fields');
            return;
        }
        try {
            setFormLoading(true);
            let payload: any = { ...addForm };

            if (addForm.role === 'sales_person') {
                const zohoResponse = await axiosInstance.post(`${API}/admin/salespeople/zoho/salesperson`, {
                    name: addForm.name,
                    email: addForm.email,
                });
                const zohoSalesperson = zohoResponse.data.salesperson;
                payload.code = zohoSalesperson.salesperson_name;
                payload.salesperson_id = zohoSalesperson.salesperson_id;
            }

            await axiosInstance.post(`${API}/admin/users`, payload);
            toast.success('User created successfully');
            setAddOpen(false);
            setAddForm({ ...EMPTY_USER_FORM });
            fetchUsers();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    // ---- Edit User ----

    const openEdit = async (user: any) => {
        try {
            const res = await axiosInstance.get(`${API}/permissions/users/${user._id}/edit-permissions`);
            if (!res.data.can_edit) {
                toast.error(res.data.reason || 'You cannot edit this user');
                return;
            }
        } catch {
            toast.error('Failed to check edit permissions');
            return;
        }
        setEditForm({
            name: user.name || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || '',
            status: user.status || 'active',
        });
        setSelectedUser(user);
        setEditOpen(true);
    };

    const handleEditUser = async () => {
        try {
            setFormLoading(true);
            await axiosInstance.put(`${API}/permissions/users/${selectedUser._id}`, editForm);
            toast.success('User updated successfully');
            setEditOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to update user');
        } finally {
            setFormLoading(false);
        }
    };

    // ---- Delete User ----

    const openDelete = (user: any) => {
        setSelectedUser(user);
        setDeleteOpen(true);
    };

    const handleDeleteUser = async () => {
        try {
            setFormLoading(true);
            await axiosInstance.delete(`${API}/admin/users/${selectedUser._id}`);
            toast.success('User deleted successfully');
            setDeleteOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to delete user');
        } finally {
            setFormLoading(false);
        }
    };

    // ---- Reset Password ----

    const openResetPw = (user: any) => {
        setSelectedUser(user);
        setNewPassword('');
        setResetPwOpen(true);
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            toast.error('Please enter or generate a password');
            return;
        }
        try {
            setFormLoading(true);
            await axiosInstance.post(`${API}/admin/users/${selectedUser._id}/reset-password`, { password: newPassword });
            toast.success('Password reset successfully');
            setResetPwOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to reset password');
        } finally {
            setFormLoading(false);
        }
    };

    // ---- Manage role permissions for a specific user ----

    const openManageRole = async (user: any) => {
        setSelectedUser(user);
        // Ensure allPermissions is loaded
        let perms = allPermissions;
        if (perms.length === 0) {
            try {
                const res = await axiosInstance.get(`${API}/permissions/admin/all-permissions`);
                perms = res.data.permissions || [];
                setAllPermissions(perms);
            } catch {
                toast.error('Failed to load permissions');
                return;
            }
        }
        // Build a map: permId -> whether this user's role is in allowed_roles
        const map: Record<string, boolean> = {};
        perms.forEach((p: any) => {
            map[p.id] = (p.allowed_roles || []).includes(user.role);
        });
        setManageRolePerms(map);
        setManageRoleOpen(true);
    };

    const handleSaveRolePermissions = async () => {
        if (!selectedUser) return;
        const role = selectedUser.role;
        try {
            setManageRoleSaving(true);
            await Promise.all(
                allPermissions.map(p => {
                    const current: string[] = p.allowed_roles || [];
                    const shouldHave = manageRolePerms[p.id];
                    const hasNow = current.includes(role);
                    if (shouldHave === hasNow) return Promise.resolve();
                    const updated = shouldHave
                        ? [...current, role]
                        : current.filter((r: string) => r !== role);
                    return axiosInstance.put(`${API}/permissions/admin/permission/${p.id}`, {
                        allowed_roles: updated,
                    });
                })
            );
            toast.success(`Permissions updated for all ${formatRole(role)} users`);
            setManageRoleOpen(false);
            // Refresh permission data so allPermissions stays in sync
            fetchAllPermissions();
            fetchUsers();
        } catch {
            toast.error('Failed to save permissions');
        } finally {
            setManageRoleSaving(false);
        }
    };

    // ---- Permissions matrix ----

    const toggleRole = (permId: string, role: string) => {
        setPermMatrix(prev => {
            const current = prev[permId] || [];
            const next = current.includes(role)
                ? current.filter(r => r !== role)
                : [...current, role];
            return { ...prev, [permId]: next };
        });
    };

    const handleSavePermissions = async () => {
        try {
            setPermSaving(true);
            await Promise.all(
                allPermissions.map(p =>
                    axiosInstance.put(`${API}/permissions/admin/permission/${p.id}`, {
                        allowed_roles: permMatrix[p.id] || [],
                    })
                )
            );
            toast.success('Permissions saved successfully');
            fetchAllPermissions();
        } catch {
            toast.error('Failed to save permissions');
        } finally {
            setPermSaving(false);
        }
    };

    // ---- Add Role ----

    const openAddRole = async () => {
        setNewRoleForm({ label: '', value: '' });
        setNewRolePerms({});
        // Ensure the permission list is available so the admin can grant access on creation
        if (allPermissions.length === 0) {
            try {
                const res = await axiosInstance.get(`${API}/permissions/admin/all-permissions`);
                setAllPermissions(res.data.permissions || []);
            } catch {
                // dialog still works for label-only role creation
            }
        }
        setAddRoleOpen(true);
    };

    const handleCreateRole = async () => {
        const label = newRoleForm.label.trim();
        const value = newRoleForm.value.trim().toLowerCase().replace(/\s+/g, '_');
        if (!label || !value) {
            toast.error('Please enter a role name');
            return;
        }
        if (roles.some(r => r.value === value)) {
            toast.error('A role with that value already exists');
            return;
        }
        const permissions = Object.keys(newRolePerms).filter(id => newRolePerms[id]);
        try {
            setRoleSaving(true);
            await axiosInstance.post(`${API}/permissions/admin/roles`, { label, value, permissions });
            toast.success(`Role "${label}" created`);
            setAddRoleOpen(false);
            await fetchRoles();
            if (tab === 1) fetchAllPermissions();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to create role');
        } finally {
            setRoleSaving(false);
        }
    };

    // ---- Filtered users ----

    const filteredUsers = users.filter((u: any) => {
        const matchSearch =
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = selectedRole === 'all' || u.role === selectedRole;
        return matchSearch && matchRole;
    });

    // ---- Render ----

    return (
        <Box sx={{ padding: { xs: 2, sm: 3 } }}>
            <Paper elevation={3} sx={{ padding: { xs: 2, sm: 3, md: 4 }, borderRadius: 4 }}>
                {/* Header */}
                <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: 2, sm: 0 }}
                    mb={1}
                >
                    <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                        User & Permission Management
                    </Typography>
                    {tab === 0 && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { setAddForm({ ...EMPTY_USER_FORM }); setAddOpen(true); }}
                        >
                            Add User
                        </Button>
                    )}
                    {tab === 1 && (
                        <Button
                            variant="contained"
                            startIcon={permSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            onClick={handleSavePermissions}
                            disabled={permSaving}
                        >
                            {permSaving ? 'Saving…' : 'Save Permissions'}
                        </Button>
                    )}
                </Box>
                <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
                    Manage staff users and control role-based access
                </Typography>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                    <Tab label="Staff Users" icon={<GroupIcon />} iconPosition="start" />
                    {isAdmin && <Tab label="Permissions" icon={<SecurityIcon />} iconPosition="start" />}
                </Tabs>

                {/* ======================== USERS TAB ======================== */}
                {tab === 0 && (
                    <>
                        {/* Filters */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
                            <TextField
                                placeholder="Search by name or email…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                size="small"
                                sx={{ flexGrow: 1 }}
                            />
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                                <InputLabel>Role</InputLabel>
                                <Select value={selectedRole} label="Role" onChange={e => setSelectedRole(e.target.value)}>
                                    <MenuItem value="all">All Roles</MenuItem>
                                    {roles.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {isAdmin && (
                                <Tooltip title="Add new role">
                                    <IconButton onClick={openAddRole} color="primary">
                                        <GroupIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Refresh">
                                <IconButton onClick={fetchUsers}><RefreshIcon /></IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Users table */}
                        {usersLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                                <CircularProgress sx={{ mr: 2 }} />
                                <Typography color="text.secondary">Loading users…</Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
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
                                            <TableRow key={user._id} hover>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body1" fontWeight="medium">{user.name}</Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{user.email}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={formatRole(user.role)} color={getRoleColor(user.role)} size="small" />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={capitalize(user.status)}
                                                        color={user.status === 'active' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => { setSelectedUser(user); setPermViewOpen(true); }}
                                                        variant="text"
                                                    >
                                                        View ({user.permissions?.length || 0})
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" gap={0.5}>
                                                        <Tooltip title="Edit User">
                                                            <IconButton size="small" color="primary" onClick={() => openEdit(user)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {isAdmin && (
                                                            <Tooltip title={`Manage ${formatRole(user.role)} permissions`}>
                                                                <IconButton size="small" color="success" onClick={() => openManageRole(user)}>
                                                                    <ManageAccountsIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Reset Password">
                                                            <IconButton size="small" color="warning" onClick={() => openResetPw(user)}>
                                                                <LockResetIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {isAdmin && (
                                                            <Tooltip title="Delete">
                                                                <IconButton size="small" color="error" onClick={() => openDelete(user)}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {!usersLoading && filteredUsers.length === 0 && (
                            <Box textAlign="center" py={6}>
                                <GroupIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No users found</Typography>
                                <Typography variant="body2" color="text.secondary">Try adjusting your search or filters</Typography>
                            </Box>
                        )}
                    </>
                )}

                {/* ======================== PERMISSIONS TAB ======================== */}
                {tab === 1 && (
                    <Box>
                    {permLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                            <CircularProgress sx={{ mr: 2 }} />
                            <Typography color="text.secondary">Loading permissions…</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Toggle which roles can access each feature. Click <strong>Save Permissions</strong> in the header to apply changes.
                                </Typography>
                            </Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 220 }}>
                                                Feature / Page
                                            </TableCell>
                                            {roles.map(role => (
                                                <TableCell
                                                    key={role.value}
                                                    align="center"
                                                    sx={{ fontWeight: 'bold', minWidth: 110 }}
                                                >
                                                    <Chip
                                                        label={role.label}
                                                        color={getRoleColor(role.value)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {allPermissions.map((perm: any) => (
                                            <TableRow key={perm.id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">{perm.text}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{perm.path}</Typography>
                                                    </Box>
                                                </TableCell>
                                                {roles.map(role => {
                                                    const checked = (permMatrix[perm.id] || []).includes(role.value);
                                                    return (
                                                        <TableCell key={role.value} align="center" padding="checkbox">
                                                            <Checkbox
                                                                checked={checked}
                                                                onChange={() => toggleRole(perm.id, role.value)}
                                                                color={checked ? getRoleColor(role.value) as any : 'default'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {allPermissions.length === 0 && (
                                <Box textAlign="center" py={6}>
                                    <SecurityIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">No permissions configured</Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
                )}

            </Paper>

            {/* ======================== DIALOGS ======================== */}

            {/* Add User */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AddIcon color="primary" />
                        <Typography variant="h6">Add New User</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid sx={{ width: '50%' }}>
                            <TextField
                                fullWidth label="First Name" size="small"
                                value={addForm.first_name}
                                onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                            />
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <TextField
                                fullWidth label="Last Name" size="small"
                                value={addForm.last_name}
                                onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                            />
                        </Grid>
                        <Grid sx={{ width: '100%' }}>
                            <TextField
                                fullWidth label="Full Name *" size="small"
                                value={addForm.name}
                                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </Grid>
                        <Grid sx={{ width: '60%' }}>
                            <TextField
                                fullWidth label="Email *" type="email" size="small"
                                value={addForm.email}
                                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </Grid>
                        <Grid sx={{ width: '40%' }}>
                            <TextField
                                fullWidth label="Phone *" type="tel" size="small"
                                value={addForm.phone}
                                onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                            />
                        </Grid>
                        <Grid sx={{ width: '100%' }}>
                            <TextField
                                fullWidth label="Password *" size="small"
                                value={addForm.password}
                                onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title="Generate password">
                                                <IconButton size="small" onClick={handleGenerateAddPassword}>
                                                    <RefreshIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {addForm.password && (
                                                <Tooltip title="Copy">
                                                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(addForm.password); toast.info('Password copied'); }}>
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <FormHelperText>Click the refresh icon to auto-generate a secure password</FormHelperText>
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role *</InputLabel>
                                <Select value={addForm.role} label="Role *" onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                                    {roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={addForm.status} label="Status" onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddOpen(false)} color="inherit" variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={formLoading}
                        startIcon={formLoading ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                        {formLoading ? 'Creating…' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <EditIcon color="primary" />
                        <Typography variant="h6">Edit User</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid sx={{ width: '50%' }}>
                            <TextField fullWidth label="First Name" size="small" value={editForm.first_name || ''} onChange={e => setEditForm((f: any) => ({ ...f, first_name: e.target.value }))} />
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <TextField fullWidth label="Last Name" size="small" value={editForm.last_name || ''} onChange={e => setEditForm((f: any) => ({ ...f, last_name: e.target.value }))} />
                        </Grid>
                        <Grid sx={{ width: '100%' }}>
                            <TextField fullWidth label="Full Name" size="small" value={editForm.name || ''} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                        </Grid>
                        <Grid sx={{ width: '60%' }}>
                            <TextField fullWidth label="Email" type="email" size="small" value={editForm.email || ''} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
                        </Grid>
                        <Grid sx={{ width: '40%' }}>
                            <TextField fullWidth label="Phone" type="tel" size="small" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select value={editForm.role || ''} label="Role" onChange={e => setEditForm((f: any) => ({ ...f, role: e.target.value }))}>
                                    {roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid sx={{ width: '50%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={editForm.status || ''} label="Status" onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditOpen(false)} color="inherit" variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleEditUser}
                        variant="contained"
                        disabled={formLoading}
                        startIcon={formLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                    >
                        {formLoading ? 'Saving…' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteOpen(false)} color="inherit" variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleDeleteUser}
                        variant="contained"
                        color="error"
                        disabled={formLoading}
                        startIcon={formLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {formLoading ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password */}
            <Dialog open={resetPwOpen} onClose={() => setResetPwOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <LockResetIcon color="warning" />
                        <Typography variant="h6">Reset Password</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Set a new password for <strong>{selectedUser?.name}</strong>
                    </Typography>
                    <TextField
                        fullWidth label="New Password" size="small"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Generate password">
                                        <IconButton size="small" onClick={handleGenerateResetPassword}>
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {newPassword && (
                                        <Tooltip title="Copy">
                                            <IconButton size="small" onClick={() => { navigator.clipboard.writeText(newPassword); toast.info('Password copied'); }}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setResetPwOpen(false)} color="inherit" variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleResetPassword}
                        variant="contained"
                        color="warning"
                        disabled={formLoading || !newPassword}
                        startIcon={formLoading ? <CircularProgress size={16} /> : <LockResetIcon />}
                    >
                        {formLoading ? 'Resetting…' : 'Reset Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Role Permissions */}
            <Dialog open={manageRoleOpen} onClose={() => setManageRoleOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ManageAccountsIcon color="success" />
                        <Box>
                            <Typography variant="h6">Manage Permissions</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Affects all users with role{' '}
                                <Chip label={formatRole(selectedUser?.role)} color={getRoleColor(selectedUser?.role)} size="small" sx={{ ml: 0.5 }} />
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Feature / Page</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>Access</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allPermissions.map(p => (
                                <TableRow key={p.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">{p.text}</Typography>
                                        <Typography variant="caption" color="text.secondary">{p.path}</Typography>
                                    </TableCell>
                                    <TableCell align="center" padding="checkbox">
                                        <Checkbox
                                            checked={!!manageRolePerms[p.id]}
                                            onChange={e => setManageRolePerms(prev => ({ ...prev, [p.id]: e.target.checked }))}
                                            color="success"
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setManageRoleOpen(false)} color="inherit" variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleSaveRolePermissions}
                        variant="contained"
                        color="success"
                        disabled={manageRoleSaving}
                        startIcon={manageRoleSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    >
                        {manageRoleSaving ? 'Saving…' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Permissions */}
            <Dialog open={permViewOpen} onClose={() => setPermViewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SecurityIcon color="success" />
                        <Typography variant="h6">Permissions for {selectedUser?.name}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box mb={2} display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Role:</Typography>
                        <Chip label={formatRole(selectedUser?.role)} color={getRoleColor(selectedUser?.role)} size="small" />
                    </Box>
                    {(selectedUser?.permissions || []).length > 0 ? (
                        (selectedUser.permissions as any[]).map((p: any, i: number) => (
                            <Paper key={i} sx={{ p: 2, mb: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.50' }} elevation={0}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                                            <SecurityIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">{p.text}</Typography>
                                            <Typography variant="caption" color="text.secondary">{p.path}</Typography>
                                        </Box>
                                    </Box>
                                    <CheckCircleIcon color="success" />
                                </Box>
                            </Paper>
                        ))
                    ) : (
                        <Box textAlign="center" py={4}>
                            <CancelIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                            <Typography color="text.secondary">No permissions assigned</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPermViewOpen(false)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
            {/* Add Role Dialog */}
            <Dialog open={addRoleOpen} onClose={() => !roleSaving && setAddRoleOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <GroupIcon color="primary" />
                        <Typography variant="h6">Create New Role</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create a custom role and grant it access to features. The role is saved and
                        becomes available when adding or editing users.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Role Name *"
                            size="small"
                            value={newRoleForm.label}
                            onChange={e => {
                                const label = e.target.value;
                                setNewRoleForm({ label, value: label.trim().toLowerCase().replace(/\s+/g, '_') });
                            }}
                            placeholder="e.g. Finance Manager"
                        />
                        <TextField
                            fullWidth
                            label="Role Value"
                            size="small"
                            value={newRoleForm.value}
                            onChange={e => setNewRoleForm(f => ({ ...f, value: e.target.value }))}
                            helperText="Unique identifier (auto-generated)"
                        />
                    </Stack>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Permissions for this role
                    </Typography>
                    {allPermissions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No permissions available to assign. You can add them later from the Permissions tab.
                        </Typography>
                    ) : (
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Table size="small">
                                <TableBody>
                                    {allPermissions.map(p => (
                                        <TableRow key={p.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">{p.text}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.path}</Typography>
                                            </TableCell>
                                            <TableCell align="center" padding="checkbox">
                                                <Checkbox
                                                    checked={!!newRolePerms[p.id]}
                                                    onChange={e => setNewRolePerms(prev => ({ ...prev, [p.id]: e.target.checked }))}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddRoleOpen(false)} color="inherit" variant="outlined" disabled={roleSaving}>Cancel</Button>
                    <Button
                        onClick={handleCreateRole}
                        variant="contained"
                        disabled={roleSaving || !newRoleForm.label.trim() || !newRoleForm.value.trim()}
                        startIcon={roleSaving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    >
                        {roleSaving ? 'Creating…' : 'Create Role'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
