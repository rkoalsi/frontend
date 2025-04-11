import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
  Container,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ExitToApp as ExitIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

const formatTime = (dateString: any) =>
  new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDate = (dateString: any) =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const AttendanceDataDisplay = ({ attendanceData, loading }: any) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Table view for larger screens
  const TableView = () => (
    <TableContainer
      component={Paper}
      elevation={3}
      sx={{ borderRadius: 2, overflow: 'hidden' }}
    >
      <Table sx={{ minWidth: 500 }}>
        <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.contrastText,
              }}
            >
              Date
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.contrastText,
              }}
            >
              Time
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.contrastText,
              }}
            >
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attendanceData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((record: any, index: number) => (
              <TableRow
                key={index}
                sx={{
                  '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.03)' },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.07)' },
                  transition: 'background-color 0.2s',
                }}
              >
                <TableCell>{formatDate(record.created_at)}</TableCell>
                <TableCell>{formatTime(record.created_at)}</TableCell>
                <TableCell>
                  <Chip
                    icon={
                      record.is_check_in ? (
                        <CheckIcon fontSize='small' />
                      ) : (
                        <ExitIcon fontSize='small' />
                      )
                    }
                    label={record.is_check_in ? 'Check In' : 'Check Out'}
                    size='small'
                    sx={{
                      bgcolor: record.is_check_in
                        ? theme.palette.success.light
                        : theme.palette.error.light,
                      color: record.is_check_in
                        ? theme.palette.success.dark
                        : theme.palette.error.dark,
                      fontWeight: 500,
                      px: 1,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component='div'
        count={attendanceData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
            {
              [theme.breakpoints.down('sm')]: {
                fontSize: '0.8rem',
              },
            },
        }}
      />
    </TableContainer>
  );

  // Card view for mobile
  const CardView = () => (
    <Box>
      {attendanceData
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((record: any, index: number) => (
          <Card
            key={index}
            elevation={1}
            sx={{
              mb: 2,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                mb={1}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon
                    fontSize='small'
                    sx={{ mr: 1, color: theme.palette.text.secondary }}
                  />
                  <Typography variant='body1'>
                    {formatDate(record.created_at)}
                  </Typography>
                </Box>
                <Chip
                  icon={
                    record.is_check_in ? (
                      <CheckIcon fontSize='small' />
                    ) : (
                      <ExitIcon fontSize='small' />
                    )
                  }
                  label={record.is_check_in ? 'Check In' : 'Check Out'}
                  size='small'
                  sx={{
                    bgcolor: record.is_check_in
                      ? theme.palette.success.light
                      : theme.palette.error.light,
                    color: record.is_check_in
                      ? theme.palette.success.dark
                      : theme.palette.error.dark,
                    fontWeight: 500,
                  }}
                />
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon
                  fontSize='small'
                  sx={{ mr: 1, color: theme.palette.text.secondary }}
                />
                <Typography variant='body2' color='text.secondary'>
                  {formatTime(record.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      <Box sx={{ mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component='div'
          count={attendanceData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: 'white',
            '.MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              justifyContent: 'center',
              py: 1,
            },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
              {
                margin: 1,
                fontSize: '0.75rem',
              },
          }}
        />
      </Box>
    </Box>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
      {[...Array(5)].map((_, i) => (
        <Skeleton
          key={i}
          height={60}
          sx={{
            mb: 1,
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out 0.5s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.5 },
              '50%': { opacity: 1 },
            },
          }}
        />
      ))}
    </Paper>
  );

  // Empty state
  const EmptyState = () => (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: theme.palette.grey[50],
        borderRadius: 2,
      }}
      elevation={1}
    >
      <CalendarIcon
        sx={{ fontSize: 60, color: theme.palette.grey[300], mb: 2 }}
      />
      <Typography variant='h6' color='text.primary' fontWeight={500}>
        No attendance records found
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
        Check in to start tracking your attendance.
      </Typography>
    </Paper>
  );

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant='h4'
          fontWeight={700}
          sx={{
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2.125rem' },
            position: 'relative',
            color: 'white',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: '40%',
              height: 4,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
            },
          }}
        >
          Attendance History
        </Typography>
        <Typography variant='body1' color='white'>
          Track your check-ins and check-outs
        </Typography>
      </Box>

      {loading ? (
        <LoadingSkeleton />
      ) : attendanceData.length === 0 ? (
        <EmptyState />
      ) : isMobile ? (
        <CardView />
      ) : (
        <TableView />
      )}
    </Container>
  );
};

export default AttendanceDataDisplay;
