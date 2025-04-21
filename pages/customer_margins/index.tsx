import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  capitalize,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import formatAddress from '../../src/util/formatAddress';

const ShopHookCard = ({ user, hookData, onAddNotes }: any) => {
  const [specialMargins, setSpecialMargins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [brandSummary, setBrandSummary] = useState<any>({});

  // Function to check if all products in a brand have the same margin
  const brandHasUniformMargin = (products: any[]) => {
    if (products.length <= 1) return true;
    const firstMargin = products[0].margin;
    return products.every((product) => product.margin === firstMargin);
  };

  const fetchSpecialMargins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.api_url}/customers/special_margins/${hookData._id}`
      );

      const products = response.data.products;
      setSpecialMargins(products);

      // Create brand-wise summary
      const summary = products.reduce((acc: any, product: any) => {
        const brand =
          capitalize(product.name.split(' ')[0].toLowerCase()) || 'Unspecified';
        if (!acc[brand]) {
          acc[brand] = {
            count: 0,
            products: [],
            totalMargin: 0,
          };
        }
        acc[brand].count++;
        acc[brand].products.push(product);
        acc[brand].totalMargin += parseFloat(product.margin) || 0;
        return acc;
      }, {});

      // Calculate average margin and check if uniform
      Object.keys(summary).forEach((brand) => {
        const brandData = summary[brand];
        brandData.averageMargin = (
          brandData.totalMargin / brandData.count
        ).toFixed(2);
        brandData.hasUniformMargin = brandHasUniformMargin(brandData.products);
      });

      setBrandSummary(summary);
    } catch (error) {
      console.error('Error fetching special margins:', error);
      toast.error('Failed to fetch special margins');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when accordion is expanded
  useEffect(() => {
    if (expanded && specialMargins.length === 0) {
      fetchSpecialMargins();
    }
  }, [expanded]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 600,
        margin: 'auto',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <div
        style={{
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <Typography variant='h6' color='inherit'>
          {hookData.contact_name}
        </Typography>
      </div>
      <CardContent>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Typography variant='body2' color='textSecondary'>
            Customer Name
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {hookData.contact_name}
          </Typography>
          <Divider style={{ marginBottom: '8px', marginTop: '8px' }} />
          <Typography variant='body2' color='textSecondary'>
            Overall Margin
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {hookData.cf_margin}
          </Typography>
          <Divider style={{ marginBottom: '8px', marginTop: '8px' }} />
          <Typography variant='body2' color='textSecondary'>
            GST Type
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {hookData.cf_in_ex}
          </Typography>
        </div>

        <Accordion expanded={expanded} onChange={handleAccordionChange}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls='special-margins-content'
            id='special-margins-header'
          >
            <Typography>Special Margins</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : specialMargins.length === 0 ? (
              <Typography variant='body2' color='textSecondary'>
                No special margins found for this customer.
              </Typography>
            ) : (
              <Box>
                {Object.keys(brandSummary).map((brand) => {
                  const brandData = brandSummary[brand];

                  return (
                    <Accordion key={brand} disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography>
                            {brand} ({brandData.count} products)
                          </Typography>
                          {brandData.hasUniformMargin && (
                            <Typography variant='body2' fontWeight='bold'>
                              Margin: {brandData.products[0].margin}
                            </Typography>
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {brandData.hasUniformMargin ? (
                          <Alert severity='info'>
                            All {brand} products have the same margin of{' '}
                            {brandData.products[0].margin}
                          </Alert>
                        ) : (
                          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {brandData.products.map((product: any) => (
                              <Card key={product._id} sx={{ mb: 1, p: 1 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Typography
                                    variant='caption'
                                    color='textSecondary'
                                  >
                                    {product.name}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    fontWeight='bold'
                                  >
                                    Margin: {product.margin}
                                  </Typography>
                                </Box>
                              </Card>
                            ))}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

function CustomerMargin() {
  const { user }: any = useContext(AuthContext);
  const [customersMargin, setCustomerMargin] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCustomerMargin = async (query = '') => {
    try {
      setLoading(true);
      const resp = await axios.get(
        `${process.env.api_url}/customers/salesperson`,
        {
          params: {
            code: user?.data?.code,
            search: query, // Send search parameter to API
          },
        }
      );
      setCustomerMargin(resp.data.customers);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerMargin();
  }, []);

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        fetchCustomerMargin(searchQuery);
      } else {
        fetchCustomerMargin();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <Container maxWidth='lg'>
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          mb: 4,
        }}
      >
        <Header title='Customer Margins' showBackButton />
        <Alert color='info'>
          This is for existing customers and their assigned margins
        </Alert>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          label='Search by Customer Name'
          variant='outlined'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: '100%',
            maxWidth: 400,
            // Style for the input text
            '& .MuiInputBase-input': {
              color: 'white',
            },
            // Style for the label
            '& .MuiInputLabel-root': {
              color: 'white',
            },
            // Style for the outline
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: 'white',
              },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : customersMargin.length === 0 ? (
        <Alert severity='info' variant='outlined' sx={{ color: 'white' }}>
          No Customer Margins found.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {customersMargin.map((h) => (
            <ShopHookCard user={user} key={h._id} hookData={h} />
          ))}
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant='outlined'
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default CustomerMargin;
