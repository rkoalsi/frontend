import * as React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  ListItemIcon,
  TextField,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search, RadioButtonUnchecked, CheckCircle } from '@mui/icons-material';

interface CheckListProps {
  values: any[];
  selectedValue: any; // Preselected item from state
  setSelectedValue: (value: any) => void;
}

export default function CheckList({
  values = [],
  selectedValue = null,
  setSelectedValue = () => {},
}: CheckListProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredValues, setFilteredValues] = React.useState(values);

  // Theme-based breakpoint for mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Filter values based on search query
   */
  React.useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    setFilteredValues(
      values.filter((value: any) =>
        ['address', 'state', 'zip', 'city', 'attention'].some((key) =>
          value[key]?.toString().toLowerCase().includes(lowerCaseQuery)
        )
      )
    );
  }, [searchQuery, values]);

  /**
   * Handle List Item/Card Click
   */
  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setSelectedValue(filteredValues[index]);
  };

  /**
   * Set Default Selection
   */
  React.useEffect(() => {
    if (filteredValues.length > 0) {
      const preselectedIndex = filteredValues.findIndex(
        (item: any) => item.address_id === selectedValue?.address_id
      );

      if (preselectedIndex !== -1) {
        // Preselect the value from the database/state if available
        setSelectedIndex(preselectedIndex);
        setSelectedValue(filteredValues[preselectedIndex]);
      } else {
        // Select the first one if no preselected value exists
        setSelectedIndex(0);
        setSelectedValue(filteredValues[0]);
      }
    } else {
      setSelectedIndex(null); // Reset selection if no values
      setSelectedValue(null);
    }
    // Only run when filteredValues changes or the external selectedValue changes
  }, [filteredValues, selectedValue, setSelectedValue]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search Field */}
      <TextField
        label='Search Addresses'
        variant='outlined'
        size='small'
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#fafafa',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {filteredValues.length > 0 ? (
        // We conditionally render cards on mobile, list items on desktop
        isMobile ? (
          /* ----------- Mobile Card Layout ----------- */
          filteredValues.map((value: any, index: number) => (
            <Card
              key={value.address}
              variant='outlined'
              onClick={(event) => handleListItemClick(event, index)}
              sx={{
                mb: 2,
                cursor: 'pointer',
                borderRadius: 2,
                border: selectedIndex === index
                  ? '2px solid'
                  : '1px solid #e2e8f0',
                borderColor: selectedIndex === index ? 'primary.main' : '#e2e8f0',
                backgroundColor: selectedIndex === index ? '#f0f7ff' : '#ffffff',
                transition: 'all 0.2s ease-in-out',
                boxShadow: selectedIndex === index
                  ? '0 4px 12px rgba(25, 118, 210, 0.15)'
                  : '0 1px 3px rgba(0,0,0,0.05)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                  {selectedIndex === index ? (
                    <CheckCircle sx={{ color: 'primary.main', mr: 1.5, mt: 0.5 }} />
                  ) : (
                    <RadioButtonUnchecked sx={{ color: 'text.disabled', mr: 1.5, mt: 0.5 }} />
                  )}
                  <Box flex={1}>
                    <Typography variant='subtitle1' fontWeight={700} color='text.primary' mb={0.5}>
                      {value.attention}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' mb={0.3}>
                      {value.address} {value.street2}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' mb={0.3}>
                      {value.city}, {value.state} {value.zip}
                    </Typography>
                    {value.phone && (
                      <Chip
                        label={value.phone}
                        size='small'
                        sx={{
                          mt: 1,
                          height: 24,
                          fontSize: '0.75rem',
                          backgroundColor: '#f1f5f9',
                          color: 'text.secondary',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          /* ----------- Desktop List Layout ----------- */
          <List component='nav' aria-label='address list' sx={{ p: 0 }}>
            {filteredValues.map((value: any, index: number) => (
              <ListItemButton
                key={value.address}
                onClick={(event) => handleListItemClick(event, index)}
                selected={selectedIndex === index}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: selectedIndex === index ? 'primary.main' : '#e2e8f0',
                  backgroundColor: selectedIndex === index ? '#f0f7ff' : '#ffffff',
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: '#f0f7ff',
                    borderWidth: '2px',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#fafafa',
                    transform: 'translateX(4px)',
                  },
                  padding: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {selectedIndex === index ? (
                    <CheckCircle sx={{ color: 'primary.main' }} />
                  ) : (
                    <RadioButtonUnchecked sx={{ color: 'text.disabled' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant='subtitle1' fontWeight={700} color='text.primary' mb={0.5}>
                        {value.attention}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' mb={0.3}>
                        {value.address} {value.street2}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' mb={0.3}>
                        {value.city}, {value.state} {value.zip}
                      </Typography>
                      {value.phone && (
                        <Chip
                          label={value.phone}
                          size='small'
                          sx={{
                            mt: 0.5,
                            height: 24,
                            fontSize: '0.75rem',
                            backgroundColor: '#f1f5f9',
                            color: 'text.secondary',
                          }}
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    component: 'div',
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )
      ) : (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          py={4}
        >
          <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography fontWeight={600} color='text.secondary'>
            Could not find any match for "{searchQuery}"
          </Typography>
        </Box>
      )}
    </Box>
  );
}
