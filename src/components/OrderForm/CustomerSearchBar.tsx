import React, { useState, useEffect, useContext } from 'react';
import { TextField, Autocomplete, CircularProgress, Box } from '@mui/material';
import axios from 'axios';
import AuthContext from '../Auth';

interface SearchResult {
  _id: string;
  contact_name: string;
  cf_sales_person?: string;
  salesperson_name?: string;
}

interface SearchBarProps {
  label: string;
  onChange: (value: SearchResult | null) => void;
  value?: any;
  disabled?: boolean;
  initialValue?: SearchResult | null;
  onChangeReference?: (value: any | null) => void;
  reference?: any;
  ref_no?: boolean;
}

const CustomerSearchBar: React.FC<SearchBarProps> = ({
  label = 'Search',
  onChange,
  disabled,
  initialValue,
  onChangeReference,
  reference,
  ref_no = true,
}) => {
  const { user }: any = useContext(AuthContext);
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchResult | null>(
    initialValue || null
  );
  const [inputValue, setInputValue] = useState<string>(
    initialValue ? initialValue.contact_name : ''
  );

  useEffect(() => {
    if (
      initialValue &&
      (!selectedOption || selectedOption._id !== initialValue._id) &&
      inputValue !== initialValue.contact_name
    ) {
      setSelectedOption(initialValue);
      setOptions([initialValue]);
      setInputValue(initialValue.contact_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleSearch = async (value: string) => {
    if (!value) return;
    setLoading(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/customers`, {
        params: {
          user_code: user.data.code,
          name: value,
        },
      });
      setOptions(response.data.customers);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (event: any, value: SearchResult | null) => {
    setSelectedOption(value);
    onChange(value);
  };

  return (
    <Box display='flex' flexDirection='column' width='100%' gap='16px'>
      <Autocomplete
        disabled={disabled}
        freeSolo
        options={options}
        getOptionLabel={(option: any) => option?.contact_name || 'Unknown Name'}
        isOptionEqualToValue={(option: SearchResult, value: SearchResult) =>
          option._id === value._id
        }
        value={selectedOption}
        inputValue={inputValue}
        onInputChange={(event, newInputValue, reason) => {
          // Prevent unnecessary state updates
          if (newInputValue !== inputValue) {
            setInputValue(newInputValue);
            handleSearch(newInputValue);
          }
        }}
        onChange={(e, value: any) => handleOptionSelect(e, value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant='standard'
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color='inherit' size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {selectedOption &&
        ref_no &&
        (selectedOption?.cf_sales_person?.includes('Company customers') ||
          selectedOption?.salesperson_name?.includes('Company customers')) && (
          <TextField
            disabled={disabled}
            label='Reference Number'
            onChange={onChangeReference}
            value={reference || ''}
          />
        )}
    </Box>
  );
};

export default CustomerSearchBar;
