import {
  Box,
  Typography,
  Paper,
  styled,
  useTheme,
  Button,
  Container,
  useMediaQuery,
} from '@mui/material';
import { act, useContext } from 'react';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import {
  CalendarMonth,
  Campaign,
  Check,
  History,
  Insights,
  KeyboardReturn,
  MenuBook,
  Payment,
  Phishing,
  PlayCircle,
  Radar,
  Repeat,
  ShoppingCart,
  WorkHistory,
  Link,
  LineAxis,
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(2),
  justifyContent: 'flex-start',
  borderRadius: 12,
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1.5),
  transition: 'all 0.3s ease-in-out',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: theme.palette.common.white,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0px 8px 20px rgba(0,0,0,0.2)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(3),
    fontSize: '1.75rem',
  },
}));

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const menuItems = [
  {
    icon: <ShoppingCart />,
    text: 'Create New Order',
    color: '#4fc3f7',
    action: 'newOrder',
  },
  {
    icon: <History />,
    text: 'Past Orders',
    color: '#7c4dff',
    action: 'pastOrder',
  },
  {
    icon: <Payment />,
    text: 'Payments Due',
    color: '#ff5252',
    action: 'paymentsDue',
  },
  {
    icon: <Check />,
    text: 'Greythr Login',
    color: '#7986cb',
    action: 'check_in',
  },
  {
    icon: <MenuBook />,
    text: 'Catalogues',
    color: '#4db6ac',
    action: 'catalogues',
  },
  {
    icon: <PlayCircle />,
    text: 'Training Videos',
    color: '#7986cb',
    action: 'training',
  },
  {
    icon: <Campaign />,
    text: 'Announcements',
    color: '#ffa726',
    action: 'announcements',
  },
  {
    icon: <CalendarMonth />,
    text: 'Daily Visits',
    color: '#4dd0e1',
    action: 'dailyVisits',
  },
  {
    icon: <Phishing />,
    text: 'Set Customer Hooks',
    color: '#7c4dff',
    action: 'hooks',
  },
  {
    icon: <Insights />,
    text: 'Potential Customers (New Customers not in Zoho)',
    color: '#ff5252',
    action: 'potential_customers',
  },
  {
    icon: <Repeat />,
    text: 'Existing Customers Reorder',
    color: '#4db6ac',
    action: 'expected_reorder',
  },
  {
    icon: <Radar />,
    text: 'Targeted Customers',
    color: '#ffa726',
    action: 'targeted_customer',
  },
  {
    icon: <WorkHistory />,
    text: 'Customer Margins',
    color: '#4dd0e1',
    action: 'customer_margins',
  },
  {
    icon: <KeyboardReturn />,
    text: 'Return Orders',
    color: '#7c4dff',
    action: 'return_orders',
  },
  {
    icon: <Link />,
    text: 'External Links',
    color: '#ff5252',
    action: 'external_links',
  },
  {
    icon: <LineAxis />,
    text: 'Customer Analytics',
    color: '#4db6ac',
    action: 'customer_analytics',
  },
];

const Home = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      router.push(`/orders/new/${_id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const handleNavigation = (action: string) => {
    switch (action) {
      case 'newOrder':
        handleNewOrder();
        break;
      case 'pastOrder':
        router.push('/orders/past');
        break;
      case 'paymentsDue':
        router.push('/orders/past/payment_due');
        break;
      case 'catalogues':
        router.push('/catalogues');
        break;
      case 'training':
        router.push('/training');
        break;
      case 'announcements':
        router.push('/announcements');
        break;
      case 'dailyVisits':
        router.push('/daily_visits');
        break;
      case 'hooks':
        router.push('/hooks');
        break;
      case 'potential_customers':
        router.push('/potential_customers');
        break;
      case 'expected_reorder':
        router.push('/expected_reorder');
        break;
      default:
        router.push(action);
        break;
    }
  };

  return (
    <Container maxWidth={isMobile ? 'xs' : 'sm'} style={{ padding: '16px' }}>
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <StyledPaper elevation={0}>
          <Box textAlign='center' mb={4}>
            <Typography
              variant='h4'
              component='h1'
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff, #e3f2fd)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Welcome, {user?.data?.first_name}
            </Typography>
            <Typography
              variant='subtitle1'
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Your portal to effortless and streamlined order management.
            </Typography>
          </Box>

          <Box>
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.75 }}
              >
                <StyledButton
                  fullWidth
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.action)}
                  sx={{
                    '&:hover': {
                      backgroundColor: `${item.color}20`,
                      border: `2px solid ${item.color}`,
                    },
                  }}
                >
                  {item.text}
                </StyledButton>
              </motion.div>
            ))}
          </Box>
        </StyledPaper>
      </motion.div>
    </Container>
  );
};

export default Home;
