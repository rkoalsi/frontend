// pages/admin/dashboard.tsx
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
import axios from 'axios';
import {
  ShoppingCartOutlined,
  StorefrontOutlined,
  PeopleOutlined,
  PersonOutlineOutlined,
} from '@mui/icons-material';
import StatCard from '../../src/components/admin/StatCard';

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
      const { data } = await axios.get(`${process.env.api_url}/admin/stats`);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Define the cards with icons
  const cards: CardProps[] = stats
    ? [
        {
          label: 'Orders',
          route: 'orders',
          subStats: [
            {
              label: 'Orders in the last 24 hours',
              value: stats.recent_orders,
              color: 'success',
            },
            { label: 'Draft', value: stats.orders_draft, color: 'info' },
            {
              label: 'Accepted',
              value: stats.orders_accepted,
              color: 'success',
            },
            {
              label: 'Declined',
              value: stats.orders_declined,
              color: 'error',
            },
            {
              label: 'Invoiced',
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
      ]
    : [];

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
            {cards.map((card, idx) => (
              <Grid
                item
                xs={12}
                sm={card.subStats && card.subStats.length > 2 ? 6 : 3}
                md={card.subStats && card.subStats.length > 2 ? 6 : 3}
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
