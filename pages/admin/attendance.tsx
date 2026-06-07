import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
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
    Avatar,
    Tooltip,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import {
    Search,
    Clear,
    Download,
    ExpandMore,
    AccessTime,
    LocationOn,
    CheckCircle,
    Cancel,
    Map,
    GridView,
    ViewList,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';

// TypeScript interfaces
interface AttendanceRecord {
    _id: string;
    date: string;
    check_in_time: string;
    check_out_time: string | null;
    location: string;
    latitude?: number;
    longitude?: number;
    location_url?: string;
    location_accuracy?: number;
    status: string;
    total_records_for_day: number;
}

interface EmployeeAttendance {
    employee: {
        id: string;
        name: string;
        phone: string;
        email: string;
        employee_number: string;
    };
    attendance_records: AttendanceRecord[];
    total_records: number;
}

interface AuthContextType {
    user: any;
}

const AttendanceViewing: React.FC = () => {
    const { user } = useContext(AuthContext) as AuthContextType;

    // State management
    const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [downloading, setDownloading] = useState<boolean>(false);
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; url: string } | null>(null);
    const [locationDialogOpen, setLocationDialogOpen] = useState<boolean>(false);

    // Statistics
    const [totalEmployees, setTotalEmployees] = useState<number>(0);
    const [totalRecords, setTotalRecords] = useState<number>(0);

    // View mode
    const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch attendance data
    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (debouncedSearch.trim()) {
                params.append('name', debouncedSearch.trim());
            }

            const response = await axiosInstance.get(`/admin/attendance/employee_attendance?${params}`);
            const { attendance, pagination } = response.data;

            setAttendanceData(attendance);
            setTotalEmployees(pagination?.total_employees || attendance.length);

            // Calculate total records
            const records = attendance.reduce((sum: number, emp: EmployeeAttendance) =>
                sum + emp.total_records, 0
            );
            setTotalRecords(records);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Error fetching attendance data.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch]);

    // Effects
    useEffect(() => {
        fetchAttendance();
    }, [debouncedSearch, fetchAttendance]);

    // Handle download
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch.trim()) {
                params.append('name', debouncedSearch.trim());
            }

            const response = await axiosInstance.get(
                `/admin/attendance/employee_attendance/download?${params}`,
                { responseType: 'blob' }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Attendance report downloaded successfully!');
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Error downloading attendance report.');
        } finally {
            setDownloading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Format time
    const formatTime = (timeString: string): string => {
        if (!timeString) return 'N/A';
        try {
            return new Date(timeString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timeString;
        }
    };

    // Handle location view
    const handleViewLocation = (record: AttendanceRecord) => {
        if (record.latitude && record.longitude) {
            setSelectedLocation({
                lat: record.latitude,
                lng: record.longitude,
                url: record.location_url || `https://www.google.com/maps?q=${record.latitude},${record.longitude}`
            });
            setLocationDialogOpen(true);
        }
    };

    const heatmapData = useMemo(() => {
        const allDates = new Set<string>();
        attendanceData.forEach(emp => {
            emp.attendance_records.forEach(rec => {
                const d = (rec.date || '').split('T')[0];
                if (d) allDates.add(d);
            });
        });
        const sortedDates = Array.from(allDates).sort().slice(-21); // up to 21 most recent days
        return {
            dates: sortedDates,
            rows: attendanceData.map(emp => ({
                name: emp.employee.name,
                days: sortedDates.map(date =>
                    emp.attendance_records.some(rec => (rec.date || '').startsWith(date))
                ),
            })),
        };
    }, [attendanceData]);

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
                        Attendance Records
                    </Typography>
                    <Button
                        variant='contained'
                        startIcon={downloading ? <CircularProgress size={20} color='inherit' /> : <Download />}
                        onClick={handleDownload}
                        disabled={downloading || attendanceData.length === 0}
                    >
                        {downloading ? 'Downloading...' : 'Download Report'}
                    </Button>
                </Box>
                <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
                    View and manage employee attendance records with location tracking
                </Typography>

                {/* View Toggle + Search */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent='space-between' sx={{ mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ flex: 1 }}>
                    <TextField
                        label='Search by Employee Name'
                        variant='outlined'
                        size='small'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 300 } }}
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
                        placeholder="Search by employee name..."
                    />
                    {searchTerm && (
                        <Chip
                            label={`Searching: ${searchTerm}`}
                            onDelete={() => setSearchTerm('')}
                            color='primary'
                            variant='outlined'
                        />
                    )}
                </Stack>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        size='small'
                        onChange={(_, v) => v && setViewMode(v)}
                    >
                        <ToggleButton value='list'><ViewList sx={{ mr: 0.5 }} fontSize='small' /> List</ToggleButton>
                        <ToggleButton value='heatmap'><GridView sx={{ mr: 0.5 }} fontSize='small' /> Heatmap</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {/* Content */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        <CircularProgress />
                    </Box>
                ) : viewMode === 'heatmap' && heatmapData.dates.length > 0 ? (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${heatmapData.dates.length}, 36px)`, gap: '2px', minWidth: 'max-content' }}>
                            {/* Header row */}
                            <Box sx={{ p: 0.5 }} />
                            {heatmapData.dates.map(date => {
                                const d = new Date(date);
                                return (
                                    <Tooltip key={date} title={d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}>
                                        <Box sx={{ textAlign: 'center', p: 0.25 }}>
                                            <Typography variant='caption' sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                                                {d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}
                                            </Typography>
                                            <Typography variant='caption' sx={{ display: 'block', fontSize: '0.6rem', color: 'text.disabled' }}>
                                                {d.getDate()}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                            {/* Employee rows */}
                            {heatmapData.rows.map(row => (
                                <React.Fragment key={row.name}>
                                    <Tooltip title={row.name}>
                                        <Typography variant='body2' noWrap sx={{ alignSelf: 'center', pr: 1, fontWeight: 500, maxWidth: 180, fontSize: '0.8rem' }}>
                                            {row.name}
                                        </Typography>
                                    </Tooltip>
                                    {row.days.map((present, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 1,
                                                backgroundColor: present ? '#2e7d32' : 'action.hover',
                                                border: `1px solid`,
                                                borderColor: present ? '#1b5e2060' : 'divider',
                                                cursor: 'default',
                                            }}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </Box>
                        <Stack direction='row' spacing={2} sx={{ mt: 2 }} alignItems='center'>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ width: 16, height: 16, borderRadius: 0.5, backgroundColor: '#2e7d32' }} />
                                <Typography variant='caption'>Present</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }} />
                                <Typography variant='caption'>Absent / No record</Typography>
                            </Box>
                        </Stack>
                    </Box>
                ) : attendanceData.length > 0 ? (
                    attendanceData.map((employeeData) => (
                        <Accordion
                            key={employeeData.employee.id}
                            expanded={expandedEmployee === employeeData.employee.id}
                            onChange={() => setExpandedEmployee(
                                expandedEmployee === employeeData.employee.id ? null : employeeData.employee.id
                            )}
                            slotProps={{ transition: { unmountOnExit: true } }}
                            sx={{ mb: 2, '&:before': { display: 'none' } }}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box display="flex" alignItems="center" gap={2} width="100%">
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                        {employeeData.employee.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                            {employeeData.employee.name}
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                            {employeeData.employee.employee_number || 'No ID'} • {employeeData.employee.phone}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${employeeData.total_records} records`}
                                        color="primary"
                                        size="small"
                                        sx={{ fontWeight: 600, mr: 1 }}
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {employeeData.attendance_records.map((record) => (
                                                <TableRow key={record._id} hover>
                                                    <TableCell>{formatDate(record.date)}</TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <AccessTime fontSize="small" color="action" />
                                                            {formatTime(record.check_in_time)}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.check_out_time ? (
                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                <AccessTime fontSize="small" color="action" />
                                                                {formatTime(record.check_out_time)}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Not checked out
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{record.location}</Typography>
                                                        {record.latitude && record.longitude && (
                                                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                                                <LocationOn fontSize="inherit" />
                                                                GPS: {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={record.status}
                                                            color={record.status === 'Present' ? 'success' : 'default'}
                                                            size="small"
                                                            icon={record.status === 'Present' ? <CheckCircle /> : <Cancel />}
                                                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {record.latitude && record.longitude && (
                                                            <Tooltip title="View Location on Map">
                                                                <IconButton size="small" color="primary" onClick={() => handleViewLocation(record)}>
                                                                    <Map fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    ))
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        <Typography color='text.secondary'>
                            {debouncedSearch ? 'No attendance records match your search' : 'No attendance records available'}
                        </Typography>
                    </Box>
                )}

            </Paper>

            {/* Location Dialog */}
            <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Attendance Location</DialogTitle>
                <DialogContent>
                    {selectedLocation && (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Map />}
                                onClick={() => window.open(selectedLocation.url, '_blank')}
                            >
                                Open in Google Maps
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLocationDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendanceViewing;
