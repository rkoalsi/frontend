import {
  Box,
  Typography,
  Paper,
  styled,
  useTheme,
  Button,
  Container,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { useContext, useState } from 'react';
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
  Rocket,
  PersonAdd,
  Assignment,
  NewReleases,
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';
import CustomerCreationRequestForm from '../src/components/CustomerCreationRequestForm';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  borderRadius: 16,
  border: `1px solid ${theme.palette.primary.dark}`,
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
}));

const ActionCard = styled(Button)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  borderRadius: 16,
  textTransform: 'none',
  minHeight: 110,
  width: '100%',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
  '&:hover': {
    backgroundColor: '#fafafa',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    borderColor: '#cbd5e1',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
    marginBottom: theme.spacing(1),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: theme.spacing(1.5),
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

// Actions allowed for customer role (scalable - add more as needed)
const customerAllowedActions = [
  'newOrder',
  'pastOrder',
  'catalogues',
  'shipments',
  'customer'
];

// Grouped menu items for better organization
const menuSections = [
  {
    title: 'Orders',
    items: [
      {
        icon: <ShoppingCart />,
        text: 'Create New Order',
        color: '#3b82f6',
        action: 'newOrder',
      },
      {
        icon: <History />,
        text: 'Past Orders',
        color: '#8b5cf6',
        action: 'pastOrder',
      },
      {
        icon: <Payment />,
        text: 'Payments Due',
        color: '#ef4444',
        action: 'paymentsDue',
      },
      {
        icon: <KeyboardReturn />,
        text: 'Return Orders',
        color: '#f59e0b',
        action: 'return_orders',
      },
      {
        icon: <Rocket />,
        text: 'Shipments',
        color: '#10b981',
        action: 'shipments',
      },
    ],
  },
  {
    title: 'Daily',
    items: [
      {
        icon: <CalendarMonth />,
        text: 'Daily Visits',
        color: '#06b6d4',
        action: 'dailyVisits',
      },
      {
        icon: <Check />,
        text: 'Greythr Login',
        color: '#10b981',
        action: 'check_in',
      },
    ],
  },
  {
    title: 'Customers',
    items: [
      {
        icon: <PersonAdd />,
        text: 'Create New Customer',
        color: '#22c55e',
        action: 'create_customer',
      },
      {
        icon: <Assignment />,
        text: 'My Customer Requests',
        color: '#3b82f6',
        action: 'my_customer_requests',
      },
      {
        icon: <Insights />,
        text: 'Potential Customers',
        color: '#ec4899',
        action: 'potential_customers',
      },
      {
        icon: <Repeat />,
        text: 'Expected Reorders',
        color: '#14b8a6',
        action: 'expected_reorder',
      },
      {
        icon: <Radar />,
        text: 'Targeted Customers',
        color: '#f97316',
        action: 'targeted_customer',
      },
      {
        icon: <Phishing />,
        text: 'Set Customer Hooks',
        color: '#a855f7',
        action: 'hooks',
      },
      {
        icon: <WorkHistory />,
        text: 'Customer Margins',
        color: '#6366f1',
        action: 'customer_margins',
      },
      {
        icon: <LineAxis />,
        text: 'Customer Analytics',
        color: '#64748b',
        action: 'customer_analytics',
      }
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        icon: <MenuBook />,
        text: 'Catalogues',
        color: '#0d9488',
        action: 'catalogues',
      },
      {
        icon: <PlayCircle />,
        text: 'Training Videos',
        color: '#d946ef',
        action: 'training',
      },
      {
        icon: <Campaign />,
        text: 'Announcements',
        color: '#f59e0b',
        action: 'announcements',
      },
      {
        icon: <Link />,
        text: 'External Links',
        color: '#6b7280',
        action: 'external_links',
      },
      {
        icon: <LineAxis />,
        text: 'Customer Dashboard',
        color: '#64748b',
        action: 'customer',
      },
    ],
  },
];

const Home = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showCustomerRequestForm, setShowCustomerRequestForm] = useState(false);

  // Filter menu sections based on user role
  const getFilteredMenuSections = () => {
    const userRole = user?.data?.role;

    // For customer role, filter to only allowed actions
    if (userRole === 'customer') {
      return menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            customerAllowedActions.includes(item.action)
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    // For non-customer roles (salesperson, admin), hide Customer Dashboard
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.action !== 'customer'),
      }))
      .filter((section) => section.items.length > 0);
  };

  const filteredMenuSections = getFilteredMenuSections();

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
      case 'create_customer':
        setShowCustomerRequestForm(true);
        break;
      case 'my_customer_requests':
        router.push('/customer_requests');
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
      case 'targeted_customer':
        router.push('/targeted_customer');
        break;
      case 'customer_margins':
        router.push('/customer_margins');
        break;
      case 'return_orders':
        router.push('/return_orders');
        break;
      case 'external_links':
        router.push('/external_links');
        break;
      case 'customer_analytics':
        router.push('/customer_analytics');
        break;
      case 'check_in':
        router.push('/check_in');
        break;
      case 'shipments':
        router.push('/shipments');
        break;
      case 'new_arrivals':
        router.push('/catalogues');
        break;
      default:
        router.push(action);
        break;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        pt: { xs: 2, sm: 3 },
        pb: { xs: 4, sm: 4 },
        px: { xs: 2, sm: 3 },
        mx: { xs: -2, sm: -3 },
      }}
    >
      <Container maxWidth='sm' disableGutters>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Header */}
          <Box mb={3}>
            <Typography
              variant='h5'
              component='h1'
              sx={{
                fontWeight: 700,
                color: '#ffffff',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
              }}
            >
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.data?.first_name}
            </Typography>
            <Typography
              variant='subtitle1'
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Your portal to effortless and streamlined order management.
            </Typography>
          </Box>

          {/* Menu Sections */}
          {filteredMenuSections.map((section) => (
            <Box key={section.title} sx={{ mb: 3 }}>
              <SectionTitle>{section.title}</SectionTitle>
              <Grid container spacing={1.5}>
                {section.items.map((item, index) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={index}>
                    <motion.div
                      variants={itemVariants}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ActionCard
                        onClick={() => handleNavigation(item.action)}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            color: item.color,
                          },
                        }}
                      >
                        {item.icon}
                        <Typography
                          sx={{
                            fontWeight: 600,
                            textAlign: 'center',
                            lineHeight: 1.3,
                            fontSize: '0.85rem',
                            color: '#374151',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </ActionCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </motion.div>
      </Container>

      {/* Customer Creation Request Form Dialog */}
      <CustomerCreationRequestForm
        open={showCustomerRequestForm}
        onClose={() => setShowCustomerRequestForm(false)}
      />
    </Box>
  );
};

export default Home;
