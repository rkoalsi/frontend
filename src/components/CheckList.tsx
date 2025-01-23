import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Checkbox, ListItemIcon, TextField, Typography } from '@mui/material';

interface CheckListProps {
  values: any[];
  selectedValue: any; // To pre-select an item from state
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
   * Handle List Item Click
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
        (item: any) => item.address === selectedValue?.address
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

      {/* Address List */}
      <List component='nav' aria-label='address list'>
        {filteredValues.length > 0 ? (
          filteredValues.map((value: any, index: number) => (
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
                  inputProps={{ 'aria-labelledby': value.zip }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <>
                    <Box component='span' sx={{ fontWeight: 'bold' }}>
                      {value.attention}
                    </Box>
                    <Box>{value.city}</Box>
                    <Box>{value.state}</Box>
                    <Box>{value.address}</Box>
                    <Box>{value.zip}</Box>
                  </>
                }
                primaryTypographyProps={{
                  component: 'div',
                  fontSize: '0.875rem',
                }}
              />
            </ListItemButton>
          ))
        ) : (
          <Typography fontWeight='bold'>
            Could not find any match for {searchQuery} in Addresses
          </Typography>
        )}
      </List>
    </Box>
  );
}
