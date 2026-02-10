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
    Stack,
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
    Badge,
    Business,
    Work,
    CalendarToday,
    Save,
    Cancel,
    Visibility,
    PersonAdd,
    FilterList,
    Download,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';

// TypeScript interfaces
interface Employee {
    id: string;
    name: string;
    phone: string;
    email: string;
    employee_number?: string;
    department?: string;
    designation?: string;
    joining_date?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface PaginationData {
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
}

interface EmployeesResponse {
    employees: Employee[];
    pagination: PaginationData;
}

interface AuthContextType {
    user: any;
}

const EmployeeManagement: React.FC = () => {
    const { user } = useContext(AuthContext) as AuthContextType;
    
    // State management
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        skip: 0,
        limit: 100,
        has_more: false
    });
    
    // Dialog states
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        employee_number: '',
        department: '',
        designation: '',
        joining_date: '',
        status: 'active'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Department options
    const departmentOptions = [
        'Engineering',
        'Human Resources',
        'Marketing',
        'Sales',
        'Finance',
        'Operations',
        'Customer Support',
        'Product Management',
        'Quality Assurance',
        'Administration'
    ];

    // Statistics
    const [totalEmployees, setTotalEmployees] = useState<number>(0);
    const [activeEmployees, setActiveEmployees] = useState<number>(0);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch employees
    const fetchEmployees = useCallback(async (resetPagination = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                skip: resetPagination ? '0' : pagination.skip.toString(),
                limit: pagination.limit.toString(),
            });

            if (debouncedSearch.trim()) {
                params.append('search', debouncedSearch.trim());
            }
            if (departmentFilter) {
                params.append('department', departmentFilter);
            }
            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await axiosInstance.get<EmployeesResponse>(`/admin/attendance/employees?${params}`);
            const { employees: employeeList, pagination: paginationData } = response.data;

            setEmployees(employeeList);
            setPagination(paginationData);
            setTotalEmployees(paginationData.total);
            setActiveEmployees(employeeList.filter(emp => emp.status === 'active').length);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Error fetching employees.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, departmentFilter, statusFilter, pagination.skip, pagination.limit]);

    // Effects
    useEffect(() => {
        fetchEmployees(true);
    }, [debouncedSearch, departmentFilter, statusFilter]);

    useEffect(() => {
        fetchEmployees();
    }, [pagination.skip]);

    // Handle form changes
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData?.phone) {
            errors.phone = 'Phone number is required';
        } 

        if (formData.employee_number && formData.employee_number.length < 3) {
            errors.employee_number = 'Employee number must be at least 3 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle create employee
    const handleCreate = () => {
        setDialogMode('create');
        setFormData({
            name: '',
            email: '',
            phone: '',
            employee_number: '',
            department: '',
            designation: '',
            joining_date: '',
            status: 'active'
        });
        setFormErrors({});
        setSelectedEmployee(null);
        setDialogOpen(true);
    };

    // Handle edit employee
    const handleEdit = (employee: Employee) => {
        setDialogMode('edit');
        setFormData({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            employee_number: employee.employee_number || '',
            department: employee.department || '',
            designation: employee.designation || '',
            joining_date: employee.joining_date || '',
            status: employee.status || 'active'
        });
        setFormErrors({});
        setSelectedEmployee(employee);
        setDialogOpen(true);
    };

    // Handle view employee
    const handleView = (employee: Employee) => {
        setDialogMode('view');
        setSelectedEmployee(employee);
        setDialogOpen(true);
    };

    // Handle form submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: String(formData.phone),
                employee_number: formData.employee_number.trim() || undefined,
                department: formData.department || undefined,
                designation: formData.designation || undefined,
                joining_date: formData.joining_date || undefined,
                status: formData.status || 'active'
            };

            if (dialogMode === 'create') {
                await axiosInstance.post('/admin/attendance/employees', payload);
                toast.success('Employee created successfully!');
            } else if (dialogMode === 'edit' && selectedEmployee) {
                await axiosInstance.put(`/admin/attendance/employees/${selectedEmployee.id}`, payload);
                toast.success('Employee updated successfully!');
            }

            setDialogOpen(false);
            fetchEmployees();
        } catch (error: any) {
            console.error('Error saving employee:', error);
            const errorMessage = error.response?.data?.detail || 'Error saving employee';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeleteDialogOpen(true);
    };

    // Handle delete employee
    const handleDelete = async () => {
        if (!employeeToDelete) return;

        try {
            await axiosInstance.delete(`/admin/attendance/employees/${employeeToDelete.id}`);
            toast.success('Employee deleted successfully!');
            setDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Error deleting employee.');
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setDepartmentFilter('');
        setStatusFilter('');
    };

    // Handle download employees report
    const handleDownloadReport = async () => {
        try {
            const params = new URLSearchParams();

            if (debouncedSearch.trim()) {
                params.append('search', debouncedSearch.trim());
            }
            if (departmentFilter) {
                params.append('department', departmentFilter);
            }
            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await axiosInstance.get(`/admin/attendance/employees/download?${params}`, {
                responseType: 'blob',
            });

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'employees_report.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Employee report downloaded successfully!');
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Error downloading report.');
        }
    };

    // Format date
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
        } catch {
            return 'N/A';
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography
                        variant='h4'
                        sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            mb: 1,
                            fontSize: { xs: '1.75rem', md: '2.125rem' }
                        }}
                    >
                        Employee Management
                    </Typography>
                    <Typography
                        variant='body1'
                        sx={{
                            color: '#64748b',
                            fontSize: '1.1rem'
                        }}
                    >
                        Manage employee information and maintain attendance records
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant='outlined'
                        startIcon={<Download />}
                        onClick={handleDownloadReport}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Download Report
                    </Button>
                    <Button
                        variant='contained'
                        startIcon={<PersonAdd />}
                        onClick={handleCreate}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Add New Employee
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)'
                    },
                    gap: 3,
                    mb: 4
                }}
            >
                <Card elevation={0} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Person sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                            {totalEmployees}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            Total Employees
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Badge sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                            {activeEmployees}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            Active Employees
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <CalendarToday sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month:'long', year:'2-digit'})}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            Today's Date
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Search and Filters */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <TextField
                        label='Search Employees'
                        variant='outlined'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            minWidth: 300,
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
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
                        placeholder="Search by name, email, or employee number..."
                    />

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={departmentFilter}
                            label="Department"
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="">All Departments</MenuItem>
                            {departmentOptions.map(dept => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                    </FormControl>

                    {(searchTerm || departmentFilter || statusFilter) && (
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            startIcon={<Clear />}
                            sx={{ borderRadius: 2 }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </Stack>

                {(debouncedSearch || departmentFilter || statusFilter) && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {debouncedSearch && (
                            <Chip
                                label={`Search: ${debouncedSearch}`}
                                onDelete={() => setSearchTerm('')}
                                color='primary'
                                variant='outlined'
                            />
                        )}
                        {departmentFilter && (
                            <Chip
                                label={`Department: ${departmentFilter}`}
                                onDelete={() => setDepartmentFilter('')}
                                color='primary'
                                variant='outlined'
                            />
                        )}
                        {statusFilter && (
                            <Chip
                                label={`Status: ${statusFilter}`}
                                onDelete={() => setStatusFilter('')}
                                color='primary'
                                variant='outlined'
                            />
                        )}
                    </Box>
                )}
            </Paper>

            {/* Main Content */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: 2 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body1" color="text.secondary">
                            Loading employees...
                        </Typography>
                    </Box>
                ) : employees.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 600, width: 60 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Contact Info</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((employee, index) => (
                                    <TableRow key={employee.id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                                        <TableCell>
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                {pagination.skip + index + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar
                                                    sx={{
                                                        backgroundColor: '#3b82f6',
                                                        width: 48,
                                                        height: 48,
                                                        fontSize: '1.1rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {employee.name}
                                                    </Typography>
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {employee.employee_number || 'No ID'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant='body2' sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Phone fontSize="small" color="action" />
                                                    {employee.phone}
                                                </Typography>
                                                <Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Email fontSize="small" color="action" />
                                                    {employee.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.status}
                                                color={employee.status === 'active' ? 'success' : 'default'}
                                                variant={employee.status === 'active' ? 'filled' : 'outlined'}
                                                size="small"
                                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => handleView(employee)}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Employee">
                                                    <IconButton size="small" onClick={() => handleEdit(employee)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Employee">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleDeleteClick(employee)}
                                                        color="error"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', p: 4 }}>
                        <Person sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant='h5' sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>
                            No Employees Found
                        </Typography>
                        <Typography variant='body1' color='text.secondary' textAlign="center">
                            {debouncedSearch || departmentFilter ?
                                'No employees match your current filters' :
                                'Start by adding your first employee'
                            }
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            startIcon={<PersonAdd />}
                            sx={{ mt: 2, borderRadius: 2 }}
                        >
                            Add First Employee
                        </Button>
                    </Box>
                )}

                {/* Pagination Controls */}
                {pagination.total > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant='body2' color='text.secondary'>
                            Showing {pagination.skip + 1}–{Math.min(pagination.skip + employees.length, pagination.total)} of {pagination.total} employees
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant='outlined'
                                size='small'
                                disabled={pagination.skip === 0}
                                onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                                sx={{ borderRadius: 2 }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant='outlined'
                                size='small'
                                disabled={!pagination.has_more}
                                onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                                sx={{ borderRadius: 2 }}
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>


            {/* Employee Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {dialogMode === 'create' && 'Add New Employee'}
                        {dialogMode === 'edit' && 'Edit Employee'}
                        {dialogMode === 'view' && 'Employee Details'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {dialogMode === 'create' && 'Enter employee information to add them to the system'}
                        {dialogMode === 'edit' && 'Update employee information'}
                        {dialogMode === 'view' && 'View employee information and details'}
                    </Typography>
                </DialogTitle>
                
                <Divider />

                <DialogContent sx={{ pt: 3 }}>
                    {dialogMode === 'view' && selectedEmployee ? (
                        <Grid container spacing={3}>
                            <Grid>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: '#3b82f6',
                                            width: 64,
                                            height: 64,
                                            fontSize: '1.5rem',
                                            fontWeight: 600,
                                            mr: 2
                                        }}
                                    >
                                        {selectedEmployee.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {selectedEmployee.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedEmployee.employee_number || 'No Employee ID'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid>
                                <Chip
                                    label={selectedEmployee.status}
                                    color={selectedEmployee.status === 'active' ? 'success' : 'default'}
                                    sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                                />
                            </Grid>

                            <Grid>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contact Information</Typography>
                                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email fontSize="small" /> {selectedEmployee.email}
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Phone fontSize="small" /> {selectedEmployee.phone}
                                </Typography>
                            </Grid>

                            <Grid>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Work Information</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Department:</strong> {selectedEmployee.department || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Designation:</strong> {selectedEmployee.designation || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Dates</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Joining Date:</strong> {selectedEmployee.joining_date ? formatDate(selectedEmployee.joining_date) : 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Created:</strong> {formatDate(selectedEmployee.created_at)}
                                </Typography>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    error={!!formErrors.name}
                                    helperText={formErrors.name}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Employee Number"
                                    value={formData.employee_number}
                                    onChange={(e) => handleFormChange('employee_number', e.target.value)}
                                    error={!!formErrors.employee_number}
                                    helperText={formErrors.employee_number || 'Auto-generated if left empty'}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Email Address *"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    error={!!formErrors.email}
                                    helperText={formErrors.email}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Phone Number *"
                                    value={formData.phone}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    error={!!formErrors.phone}
                                    helperText={formErrors.phone || '10-digit Indian mobile number'}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={formData.department}
                                        label="Department"
                                        onChange={(e) => handleFormChange('department', e.target.value)}
                                        disabled={dialogMode === 'view'}
                                    >
                                        <MenuItem value="">Select Department</MenuItem>
                                        {departmentOptions.map(dept => (
                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Designation"
                                    value={formData.designation}
                                    onChange={(e) => handleFormChange('designation', e.target.value)}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Joining Date"
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={(e) => handleFormChange('joining_date', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={dialogMode === 'view'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={formData.status}
                                        label="Status"
                                        onChange={(e) => handleFormChange('status', e.target.value)}
                                        disabled={dialogMode === 'view'}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>
                        {dialogMode === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {dialogMode !== 'view' && (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
                            sx={{ borderRadius: 2 }}
                        >
                            {submitting ? 'Saving...' : (dialogMode === 'create' ? 'Create Employee' : 'Update Employee')}
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
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                        Delete Employee
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>? 
                        This will mark the employee as inactive and they will no longer appear in active employee lists.
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action can be reversed by changing the employee status back to active.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        sx={{ borderRadius: 2 }}
                    >
                        Delete Employee
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Floating Action Button for Mobile */}
            <Fab
                color="primary"
                aria-label="add employee"
                onClick={handleCreate}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' }
                }}
            >
                <Add />
            </Fab>
        </Box>
    );
};

export default EmployeeManagement;