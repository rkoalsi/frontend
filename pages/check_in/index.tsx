import { useContext, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Fade,
  Tooltip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccessTime as ClockIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';
import AttendanceDataDisplay from '../../src/components/common/AttendanceDisplay';

const Checkin = () => {
  const { user }: any = useContext(AuthContext);
  const userData = user?.data || {};

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animation, setAnimation] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);
  const fetchAttendanceData = async () => {
    if (!userData.phone) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/attendance/employee_attendance`,
        { params: { phone: userData.phone } }
      );

      if (response.status === 200) {
        const data = response.data.attendance || [];
        setAttendanceData(data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Could not fetch attendance history');
    } finally {
      setLoading(false);
    }
  };
  const fetchAttendanceStatus = async () => {
    if (!userData.phone) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/attendance/status`,
        { params: { phone: userData.phone } }
      );

      if (response.status === 200) {
        setCheckedIn(response.data.checked_in);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchAttendanceData();
  }, [userData]);
  useEffect(() => {
    fetchAttendanceStatus();
  }, [userData]);
  const handleAttendance = async () => {
    setIsLoading(true);
    const payload = {
      phone: userData.phone,
      user_id: userData._id,
      action: checkedIn ? 'checkout' : 'checkin',
    };

    try {
      const response = await axios.post(
        `${process.env.api_url}/attendance/check_in`,
        payload
      );
      if (response.status === 200) {
        setAnimation(true);
        setTimeout(() => {
          setCheckedIn(!checkedIn);
          setAnimation(false);
        }, 500);
        await fetchAttendanceData();
        const { message = '', is_check_in } = response.data;
        toast.success(
          is_check_in
            ? `${message} Checked-in Successfully`
            : `${message} Checked-out Successfully`
        );
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      toast.error('Error processing your request');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: any) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Container
      maxWidth='md'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Card
        elevation={5}
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: 8,
            width: '100%',
            backgroundColor: checkedIn
              ? theme.palette.error.main
              : theme.palette.primary.main,
          }}
        />

        <CardContent sx={{ p: isMobile ? 3 : 4 }}>
          <Stack spacing={4}>
            {/* User and Time Information */}
            <Stack
              direction={isMobile ? 'column' : 'row'}
              justifyContent='space-between'
              alignItems={isMobile ? 'center' : 'flex-start'}
              spacing={2}
            >
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar
                  sx={{
                    width: isMobile ? 60 : 70,
                    height: isMobile ? 60 : 70,
                    bgcolor: userData.name
                      ? theme.palette.primary.light
                      : theme.palette.grey[400],
                  }}
                >
                  {userData.name ? (
                    userData.name.charAt(0).toUpperCase()
                  ) : (
                    <PersonIcon fontSize='large' />
                  )}
                </Avatar>

                <Stack spacing={0.5}>
                  <Typography variant='h6' fontWeight='bold'>
                    {getGreeting()}
                  </Typography>
                  <Typography variant='h5' fontWeight='bold'>
                    {userData.name || 'Guest User'}
                  </Typography>
                </Stack>
              </Stack>

              <Stack
                alignItems={isMobile ? 'center' : 'flex-end'}
                sx={{ mt: isMobile ? 2 : 0 }}
              >
                <Stack direction='row' spacing={1} alignItems='center'>
                  <ClockIcon color='action' fontSize='small' />
                  <Typography variant='h4' fontWeight='bold'>
                    {formatTime(currentTime)}
                  </Typography>
                </Stack>
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                  sx={{ mt: 1 }}
                >
                  <CalendarIcon color='action' fontSize='small' />
                  <Typography variant='body2' color='text.secondary'>
                    {formattedDate}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            {/* Check In/Out Section */}
            <Stack alignItems='center' spacing={3} sx={{ py: 2 }}>
              <Tooltip
                title={
                  checkedIn ? 'Currently checked in' : 'Currently checked out'
                }
              >
                <Fade in={!animation} timeout={500}>
                  <Box
                    sx={{
                      width: isMobile ? 100 : 120,
                      height: isMobile ? 100 : 120,
                      backgroundColor: checkedIn
                        ? theme.palette.error.main
                        : theme.palette.primary.main,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 0 20px ${
                        checkedIn
                          ? theme.palette.error.light
                          : theme.palette.primary.light
                      }`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                    onClick={!isLoading ? handleAttendance : undefined}
                  >
                    {isLoading ? (
                      <CircularProgress color='inherit' size={40} />
                    ) : checkedIn ? (
                      <LogoutIcon sx={{ fontSize: 50 }} />
                    ) : (
                      <LoginIcon sx={{ fontSize: 50 }} />
                    )}
                  </Box>
                </Fade>
              </Tooltip>

              <Typography variant='h6' align='center' fontWeight='medium'>
                {checkedIn
                  ? 'You are currently checked in'
                  : 'You are currently checked out'}
              </Typography>

              <Button
                variant='contained'
                color={checkedIn ? 'error' : 'primary'}
                onClick={handleAttendance}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : checkedIn ? (
                    <LogoutIcon />
                  ) : (
                    <LoginIcon />
                  )
                }
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: 2,
                  minWidth: isMobile ? '80%' : 200,
                }}
              >
                {isLoading
                  ? 'Processing...'
                  : checkedIn
                  ? 'Check Out'
                  : 'Check In'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Attendance Data Display */}
      <Box sx={{ width: '100%', mt: 4 }}>
        <AttendanceDataDisplay
          attendanceData={attendanceData}
          loading={loading}
        />
      </Box>
    </Container>
  );
};

export default Checkin;
