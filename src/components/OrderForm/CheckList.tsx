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
} from '@mui/material';

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
        label='Search'
        variant='standard'
        size='small'
        fullWidth
        margin='dense'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/*
        If you want a single scroll on mobile, remove or adjust 
        any maxHeight/overflow from the parent container.
      */}

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
                border:
                  selectedIndex === index
                    ? '2px solid #1976d2'
                    : '1px solid #ddd',
              }}
            >
              <CardContent>
                {/* Checkbox + Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    edge='start'
                    checked={selectedIndex === index}
                    disableRipple
                  />
                  <Typography variant='subtitle1' fontWeight='bold'>
                    {value.attention}
                  </Typography>
                </Box>
                <Typography variant='body2'>
                  {value.address} {value.street2}
                </Typography>
                <Typography variant='body2'>{value.city}</Typography>
                <Typography variant='body2'>{value.state}</Typography>
                <Typography variant='body2'>{value.zip}</Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          /* ----------- Desktop List Layout ----------- */
          <List component='nav' aria-label='address list'>
            {filteredValues.map((value: any, index: number) => (
              <ListItemButton
                key={value.address}
                onClick={(event) => handleListItemClick(event, index)}
                selected={selectedIndex === index}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'grey.200',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'grey.300',
                  },
                  padding: '12px',
                  borderRadius: '8px',
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge='start'
                    checked={selectedIndex === index}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <>
                      <Box component='span' sx={{ fontWeight: 'bold' }}>
                        {value.attention}
                      </Box>
                      <Box>
                        {value.address} {value.street2}
                      </Box>
                      <Box>{value.city}</Box>
                      <Box>{value.state}</Box>
                      <Box>{value.zip}</Box>
                    </>
                  }
                  primaryTypographyProps={{
                    component: 'div',
                    fontSize: '0.875rem',
                    noWrap: false,
                    sx: {
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      textOverflow: 'inherit',
                    },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )
      ) : (
        <Typography fontWeight='bold'>
          Could not find any match for {searchQuery} in Addresses
        </Typography>
      )}
    </Box>
  );
}
