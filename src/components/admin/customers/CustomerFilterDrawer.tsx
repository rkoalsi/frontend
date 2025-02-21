import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  OutlinedInput,
  Chip,
} from '@mui/material';

export interface FilterOptions {
  status: string;
  sales_person: string[];
  gst_type: string;
  unassigned: boolean;
}

interface CustomerFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  availableSalesPeople: string[];
  onApplyFilters: () => void;
}

const CustomerFilterDrawer: React.FC<CustomerFilterDrawerProps> = ({
  open,
  onClose,
  filterOptions,
  setFilterOptions,
  availableSalesPeople,
  onApplyFilters,
}) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions({ ...filterOptions, [key]: value });
  };

  // When unassigned is toggled, clear any selected sales people
  const handleUnassignedChange = (checked: boolean) => {
    if (checked) {
      handleChange('sales_person', []);
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 300, padding: 3 } }}
    >
      <Typography variant='h6'>Filter Customers</Typography>
      <Box mt={2}>
        {/* Status Filter */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterOptions.status}
            label='Status'
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
          </Select>
        </FormControl>

        {/* Sales Person Filter */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id='sales-person-filter-label'>Sales Person</InputLabel>
          <Select
            labelId='sales-person-filter-label'
            id='sales-person-filter'
            multiple
            value={filterOptions.sales_person}
            disabled={filterOptions.unassigned}
            label='Sales Person'
            onChange={(e) =>
              handleChange('sales_person', e.target.value as string[])
            }
            input={<OutlinedInput label='Sales Person' />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {availableSalesPeople.map((person) => (
              <MenuItem key={person} value={person}>
                <Checkbox
                  checked={filterOptions.sales_person.indexOf(person) > -1}
                />
                {person}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Unassigned Customers Filter */}
        <FormControlLabel
          control={
            <Checkbox
              checked={filterOptions.unassigned}
              onChange={(e: any) => {
                const checked = e.target.checked;
                setFilterOptions((prev: FilterOptions) => ({
                  ...prev,
                  unassigned: checked,
                  sales_person: checked ? [] : prev.sales_person,
                }));
              }}
            />
          }
          label='Unassigned Customers'
          sx={{ mt: 2 }}
        />

        {/* GST Type Filter */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterOptions.gst_type}
            label='GST Type'
            onChange={(e) => handleChange('gst_type', e.target.value)}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='exclusive'>Exclusive</MenuItem>
            <MenuItem value='inclusive'>Inclusive</MenuItem>
          </Select>
        </FormControl>

        {/* Apply and Reset Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant='contained' fullWidth onClick={onApplyFilters}>
            Apply Filters
          </Button>
          <Button
            variant='contained'
            color={'secondary'}
            fullWidth
            onClick={() =>
              setFilterOptions({
                status: '',
                sales_person: [],
                gst_type: '',
                unassigned: false,
              })
            }
          >
            Reset Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CustomerFilterDrawer;
