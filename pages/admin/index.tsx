import { JSX, useContext, useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import AuthContext from '../../src/components/Auth';
import {
  ShoppingCartOutlined,
  StorefrontOutlined,
  PeopleOutlined,
  PersonOutlineOutlined,
  Payment,
  LibraryBooks,
  VideoLibrary,
  Campaign,
  Checklist,
} from '@mui/icons-material';
import StatCard from '../../src/components/admin/StatCard';
import axiosInstance from '../../src/util/axios';

// Define TypeScript interfaces for better type safety
interface Stats {
  active_stock_products: number;
  active_products: number;
  inactive_products: number;
  total_products: number;
  out_of_stock_products: number;
  assigned_customers: number;
  unassigned_customers: number;
  active_customers: number;
  inactive_customers: number;
  active_sales_people: number;
  inactive_sales_people: number;
  total_sales_people: number;
  orders_draft: number;
  orders_accepted: number;
  orders_declined: number;
  orders_invoiced: number;
  recent_orders: number;
  total_due_payments: number;
  total_due_payments_today: number;
  active_catalogues: number;
  inactive_catalogues: number;
  active_trainings: number;
  inactive_trainings: number;
  active_announcements: number;
  inactive_announcements: number;
}

interface SubStat {
  label: string;
  value: number;
  color: string;
}

interface CardProps {
  label: string;
  route: string;
  value?: number;
  subStats?: SubStat[];
  icon?: JSX.Element;
}

const AdminDashboard = () => {
  const { user }: any = useContext(AuthContext);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get(`/admin/stats`);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Define the cards with icons; all cards available for admin/sales_admin
  const allCards: CardProps[] = stats
    ? [
        {
          label: 'Payments Due',
          route: 'payments_due',
          subStats: [
            {
              label: 'Payments Due Today',
              value: stats.total_due_payments_today,
              color: 'info',
            },
            {
              label: 'Total Payments Due',
              value: stats.total_due_payments,
              color: 'info',
            },
          ],
          icon: <Payment color='primary' />,
        },
        {
          label: 'Catalogues',
          route: 'catalogues',
          subStats: [
            {
              label: 'Active Catalogues',
              value: stats.active_catalogues,
              color: 'success',
            },
            {
              label: 'Inactive Catalogues',
              value: stats.inactive_catalogues,
              color: 'error',
            },
          ],
          icon: <LibraryBooks color='primary' />,
        },
        {
          label: 'Training Videos',
          route: 'training',
          subStats: [
            {
              label: 'Active Training Videos',
              value: stats.active_trainings,
              color: 'success',
            },
            {
              label: 'Inactive Training Videos',
              value: stats.inactive_trainings,
              color: 'error',
            },
          ],
          icon: <VideoLibrary color='primary' />,
        },
        {
          label: 'Announcements',
          route: 'announcements',
          subStats: [
            {
              label: 'Active Announcements',
              value: stats.active_announcements,
              color: 'success',
            },
            {
              label: 'Inactive Announcements',
              value: stats.inactive_announcements,
              color: 'error',
            },
          ],
          icon: <Campaign color='primary' />,
        },

        {
          label: 'Orders (last 24 hours)',
          route: 'orders',
          subStats: [
            {
              label: 'Total Orders',
              value: stats.recent_orders,
              color: 'success',
            },
            {
              label: 'Draft Orders',
              value: stats.orders_draft,
              color: 'info',
            },
            {
              label: 'Accepted Orders',
              value: stats.orders_accepted,
              color: 'success',
            },
            {
              label: 'Declined Orders',
              value: stats.orders_declined,
              color: 'error',
            },
            {
              label: 'Invoiced Orders',
              value: stats.orders_invoiced,
              color: 'success',
            },
          ],
          icon: <ShoppingCartOutlined color='primary' />,
        },
        {
          label: 'Products',
          route: 'products',
          subStats: [
            {
              label: 'Active Stock',
              value: stats.active_stock_products,
              color: 'success',
            },
            { label: 'Active', value: stats.active_products, color: 'success' },
            {
              label: 'Inactive',
              value: stats.inactive_products,
              color: 'error',
            },
            {
              label: 'Out of Stock',
              value: stats.out_of_stock_products,
              color: 'error',
            },
            { label: 'Total', value: stats.total_products, color: 'info' },
          ],
          icon: <StorefrontOutlined color='primary' />,
        },
        {
          label: 'Customers',
          route: 'customers',
          subStats: [
            {
              label: 'Assigned',
              value: stats.assigned_customers,
              color: 'success',
            },
            {
              label: 'Unassigned',
              value: stats.unassigned_customers,
              color: 'error',
            },
            {
              label: 'Active',
              value: stats.active_customers,
              color: 'success',
            },
            {
              label: 'Inactive',
              value: stats.inactive_customers,
              color: 'error',
            },
          ],
          icon: <PeopleOutlined color='primary' />,
        },
        {
          label: 'Sales People',
          route: 'sales_people',
          subStats: [
            {
              label: 'Active',
              value: stats.active_sales_people,
              color: 'success',
            },
            {
              label: 'Inactive',
              value: stats.inactive_sales_people,
              color: 'error',
            },
            { label: 'Total', value: stats.total_sales_people, color: 'info' },
          ],
          icon: <PersonOutlineOutlined color='primary' />,
        },
        {
          label: 'Daily Visits (last 24 hours)',
          route: 'daily_visits',
          subStats: [
            {
              label: 'Submitted Daily Visits',
              value: stats.active_announcements,
              color: 'info',
            },
            {
              label: 'Updated Daily Visits',
              value: stats.inactive_announcements,
              color: 'info',
            },
          ],
          icon: <Checklist color='primary' />,
        },
      ]
    : [];

  // Now filter the cards based on the user's role.
  // If the user is a catalogue_manager (and not also an admin), then only show the Products and Catalogues cards.
  const userRoles: string[] = user?.data?.role || [];
  let filteredCards = allCards;
  if (
    userRoles.includes('catalogue_manager') &&
    !userRoles.includes('admin') // optional check if roles are mutually exclusive
  ) {
    filteredCards = allCards.filter((card) =>
      ['products', 'catalogues'].includes(card.route)
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        padding: { xs: 2, md: 4 },
        borderRadius: 4,
        backgroundColor: 'background.paper',
        minHeight: '80vh',
      }}
    >
      <Typography
        variant='h4'
        gutterBottom
        sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}
      >
        Welcome, {user?.data?.first_name || 'User'}
      </Typography>
      <Typography variant='body1' sx={{ color: 'text.secondary' }}>
        This is your central hub to manage users, view analytics, and update
        settings.
      </Typography>

      <Box mt={4}>
        {loading ? (
          <Box display='flex' justifyContent='center' mt={10}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity='error'>{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredCards.map((card, idx) => (
              <Grid
                item
                xs={12}
                sm={card.subStats && card.subStats.length > 2 ? 4 : 3}
                md={card.subStats && card.subStats.length > 2 ? 4 : 3}
                key={idx}
              >
                <StatCard {...card} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};

export default AdminDashboard;
