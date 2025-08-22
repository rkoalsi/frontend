import React, { useContext, useEffect, useState, useCallback } from 'react';
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
    Collapse,
    Chip,
    InputAdornment,
    Alert,
    Avatar,
    Card,
    CardContent,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Download,
    ExpandMore,
    ExpandLess,
    Search,
    Clear,
    Person,
    AccessTime,
    CalendarToday,
    LocationOn,
    Notes,
    CheckCircle,
    Cancel,
    Schedule,
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
}

interface AttendanceRecord {
    created_at: string;
    check_in_time?: string;
    check_out_time?: string;
    status: string;
    location: string;
    notes: string;
}

interface EmployeeAttendanceData {
    employee: Employee;
    attendance_records: AttendanceRecord[];
    total_records: number;
}

interface PaginationData {
    "total_employees": number,
    "returned_employees": number,
    "limit": number,
    "skip": number,
    "has_more": boolean
}

interface AttendanceResponse {
    attendance: EmployeeAttendanceData[];
    pagination: PaginationData;
    filter_applied?: string;
}

interface AuthContextType {
    user: any;
}

const EmployeeAttendance: React.FC = () => {
    // State for attendance data and filtering
    const { user } = useContext(AuthContext) as AuthContextType;
    const [attendanceData, setAttendanceData] = useState<EmployeeAttendanceData[]>([]);
    const [filteredData, setFilteredData] = useState<EmployeeAttendanceData[]>([]);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [debouncedNameFilter, setDebouncedNameFilter] = useState<string>('');
    const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

    // Loading states
    const [loading, setLoading] = useState<boolean>(true);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [searching, setSearching] = useState<boolean>(false);

    // Statistics
    const [totalEmployees, setTotalEmployees] = useState<number>(0);
    const [totalRecords, setTotalRecords] = useState<number>(0);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNameFilter(nameFilter);
        }, 500);

        return () => clearTimeout(timer);
    }, [nameFilter]);

    // Fetch attendance data from the server
    const fetchAttendanceData = useCallback(async (nameFilterParam: string = '') => {
        setLoading(true);
        if (nameFilterParam) setSearching(true);

        try {
            const params: Record<string, string> = {};
            if (nameFilterParam.trim()) {
                params.name = nameFilterParam.trim();
            }

            const response = await axiosInstance.get<AttendanceResponse>(`/admin/attendance/employee_attendance`, {
                params,
            });

            const { attendance = [], pagination = {total_employees:0} } = response.data;
            const { total_employees = 0 } = pagination
            setAttendanceData(attendance);
            setFilteredData(attendance);
            setTotalEmployees(total_employees);

            // Calculate total records
            const totalRecordsCount = attendance.reduce((sum: number, emp: EmployeeAttendanceData) => sum + emp.total_records, 0);
            setTotalRecords(totalRecordsCount);

        } catch (error) {
            console.error(error);
            toast.error('Error fetching attendance data.');
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }, []);

    // Effect for debounced search
    useEffect(() => {
        if (debouncedNameFilter !== nameFilter) return;
        fetchAttendanceData(debouncedNameFilter);
    }, [debouncedNameFilter, fetchAttendanceData]);

    // Initial data fetch
    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    // Handle name filter
    const handleNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setNameFilter(value);
    };

    // Clear filter
    const clearFilter = () => {
        setNameFilter('');
        setDebouncedNameFilter('');
    };

    // Handle expand/collapse for employee attendance records
    const toggleEmployeeExpansion = (employeeId: string) => {
        const newExpanded = new Set(expandedEmployees);
        if (newExpanded.has(employeeId)) {
            newExpanded.delete(employeeId);
        } else {
            newExpanded.add(employeeId);
        }
        setExpandedEmployees(newExpanded);
    };

    // Download attendance report
    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const params: Record<string, string> = {};
            if (debouncedNameFilter.trim()) {
                params.name = debouncedNameFilter.trim();
            }

            const response = await axiosInstance.get(`/admin/attendance/employee_attendance/download`, {
                params,
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from response headers or create default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'attendance_report.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Report downloaded successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Error downloading report.');
        } finally {
            setDownloading(false);
        }
    };

    // Format date and time
    const formatDateTime = (dateString: string): string => {
        if (!dateString || dateString === 'No records') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString || dateString === 'No records') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status?.toLowerCase()) {
            case 'present':
                return 'success';
            case 'absent':
                return 'error';
            case 'late':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status?.toLowerCase()) {
            case 'present':
                return <CheckCircle fontSize="small" />;
            case 'absent':
                return <Cancel fontSize="small" />;
            case 'late':
                return <Schedule fontSize="small" />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant='h4'
                    sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        mb: 1,
                        fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                >
                    Employee Attendance
                </Typography>
                <Typography
                    variant='body1'
                    sx={{
                        color: '#64748b',
                        fontSize: '1.1rem'
                    }}
                >
                    Monitor and manage employee attendance records with real-time insights
                </Typography>
            </Box>

            {/* Statistics Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)'
                    },
                    alignItems: 'center',
                    gap: 4,
                    mb: 4
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3
                    }}
                >
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

                <Card
                    elevation={0}
                    sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: 3
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <AccessTime sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                            {totalRecords}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            Total Records
                        </Typography>
                    </CardContent>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        borderRadius: 3
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <CalendarToday sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                            {new Date().toLocaleDateString('en-IN', { day: '2-digit' })}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            Today's Date
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Search and Filters */}
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0'
                }}
            >
                <Box display='flex' gap={2} alignItems='center' flexWrap='wrap'>
                    <TextField
                        label='Search Employee'
                        variant='outlined'
                        size='medium'
                        value={nameFilter}
                        onChange={handleNameFilterChange}
                        sx={{
                            minWidth: { xs: '100%', sm: 300 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {searching ? <CircularProgress size={20} /> : <Search />}
                                </InputAdornment>
                            ),
                            endAdornment: nameFilter && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={clearFilter}>
                                        <Clear />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        placeholder="Type to search employees..."
                    />

                    {debouncedNameFilter && (
                        <Chip
                            label={`Filtered: ${debouncedNameFilter}`}
                            onDelete={clearFilter}
                            color='primary'
                            variant='outlined'
                            sx={{ borderRadius: 2 }}
                        />
                    )}
                </Box>

                <Box>
                    <Button
                        variant='contained'
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        sx={{
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                        size="small"
                    >
                        {downloading ? 'Downloading...' : 'Export Report'}
                    </Button>
                </Box>
            </Paper>

            {/* Main Content */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                }}
            >
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '300px',
                            gap: 2
                        }}
                    >
                        <CircularProgress size={40} />
                        <Typography variant="body1" color="text.secondary">
                            Loading attendance data...
                        </Typography>
                    </Box>
                ) : filteredData.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Employee Information
                                    </TableCell>
                                    <TableCell align='center' sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Contact Details
                                    </TableCell>
                                    <TableCell align='center' sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Attendance Summary
                                    </TableCell>
                                    <TableCell align='center' sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.map((empData: EmployeeAttendanceData) => (
                                    <React.Fragment key={empData.employee.id}>
                                        {/* Main Employee Row */}
                                        <TableRow
                                            hover
                                            sx={{
                                                '&:hover': { backgroundColor: '#f8fafc' },
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar
                                                        sx={{
                                                            backgroundColor: '#3b82f6',
                                                            width: 48,
                                                            height: 48,
                                                            fontSize: '1.2rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {empData.employee.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
                                                            {empData.employee.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            ID: {empData.employee.id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box textAlign="center">
                                                    <Typography variant='body2' sx={{ mb: 0.5 }}>
                                                        📞 {empData.employee.phone}
                                                    </Typography>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        ✉️ {empData.employee.email}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell align='center'>
                                                <Chip
                                                    label={`${empData.total_records} Records`}
                                                    color={empData.total_records > 0 ? 'success' : 'default'}
                                                    variant={empData.total_records > 0 ? 'filled' : 'outlined'}
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderRadius: 2
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell align='center'>
                                                {empData.total_records > 0 && (
                                                    <Tooltip title={expandedEmployees.has(empData.employee.id) ? "Hide Records" : "Show Records"}>
                                                        <IconButton
                                                            onClick={() => toggleEmployeeExpansion(empData.employee.id)}
                                                            sx={{
                                                                backgroundColor: '#f1f5f9',
                                                                '&:hover': {
                                                                    backgroundColor: '#e2e8f0'
                                                                }
                                                            }}
                                                        >
                                                            {expandedEmployees.has(empData.employee.id) ?
                                                                <ExpandLess /> : <ExpandMore />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Attendance Records */}
                                        {empData.total_records > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} sx={{ p: 0, backgroundColor: '#fafbfc' }}>
                                                    <Collapse in={expandedEmployees.has(empData.employee.id)}>
                                                        <Box sx={{ p: 3 }}>
                                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                                <AccessTime color="primary" />
                                                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                                                    Attendance Records
                                                                </Typography>
                                                            </Box>

                                                            <Divider sx={{ mb: 2 }} />

                                                            <TableContainer
                                                                component={Paper}
                                                                elevation={0}
                                                                sx={{
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Table size='small'>
                                                                    <TableHead>
                                                                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                                                            <TableCell sx={{ fontWeight: 600 }}>📅 Date</TableCell>
                                                                            <TableCell sx={{ fontWeight: 600 }}>🕘 Check In</TableCell>
                                                                            <TableCell sx={{ fontWeight: 600 }}>🕔 Check Out</TableCell>
                                                                            <TableCell sx={{ fontWeight: 600 }}>📍 Location</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {empData.attendance_records.slice(0, 10).map((record: AttendanceRecord, index: number) => (
                                                                            <TableRow
                                                                                key={index}
                                                                                sx={{
                                                                                    '&:hover': { backgroundColor: '#f8fafc' }
                                                                                }}
                                                                            >
                                                                                <TableCell>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                                        {formatDate(record.check_in_time as any)}
                                                                                    </Typography>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                                                                        {formatDateTime(record.check_in_time as any)}
                                                                                    </Typography>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        color={record.check_out_time ? "error.main" : "text.secondary"}
                                                                                        sx={{ fontWeight: 500 }}
                                                                                    >
                                                                                        {record.check_out_time ?
                                                                                            formatDateTime(record.check_out_time) :
                                                                                            'Not checked out'
                                                                                        }
                                                                                    </Typography>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                                                        <LocationOn fontSize="small" color="action" />
                                                                                        <Typography variant="body2">
                                                                                            {record.location || 'N/A'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </TableCell>
                                                                               
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>

                                                            {empData.attendance_records.length > 10 && (
                                                                <Alert
                                                                    severity='info'
                                                                    sx={{
                                                                        mt: 2,
                                                                        borderRadius: 2,
                                                                        '& .MuiAlert-message': {
                                                                            fontSize: '0.9rem'
                                                                        }
                                                                    }}
                                                                >
                                                                    Showing latest 10 records of {empData.attendance_records.length} total.
                                                                    Download the complete report for all records.
                                                                </Alert>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box
                        display='flex'
                        flexDirection='column'
                        justifyContent='center'
                        alignItems='center'
                        minHeight='300px'
                        sx={{ p: 4 }}
                    >
                        <Person sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant='h5' sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>
                            No Attendance Records Found
                        </Typography>
                        <Typography variant='body1' color='text.secondary' textAlign="center">
                            {debouncedNameFilter ?
                                `No employees found matching "${debouncedNameFilter}"` :
                                'No attendance data available at the moment'
                            }
                        </Typography>
                        {debouncedNameFilter && (
                            <Button
                                variant="outlined"
                                onClick={clearFilter}
                                sx={{ mt: 2, borderRadius: 2 }}
                            >
                                Clear Search Filter
                            </Button>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default EmployeeAttendance;