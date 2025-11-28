import React, { useState, useEffect, useContext } from 'react';
import { TextField, Autocomplete, CircularProgress, Box, Paper, Typography, styled } from '@mui/material';
import axios from 'axios';
import AuthContext from '../Auth';
import { Person, Business } from '@mui/icons-material';

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
  initialValue?: any;
  onChangeReference?: (value: any | null) => void;
  reference?: any;
  ref_no?: boolean;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  backgroundColor: '#ffffff',
}));

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

  // When an initial value is provided, ensure internal state is in sync.
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
    <StyledPaper>
      <Box display='flex' alignItems='center' mb={2}>
        <Person sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
        <Typography variant='h6' fontWeight={600} color='text.primary'>
          Customer Information
        </Typography>
      </Box>
      <Box
        display='flex'
        flexDirection='column'
        width='100%'
        gap={2.5}
      >
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
              variant='outlined'
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color='primary' size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
              }}
            />
          )}
          sx={{
            '& .MuiAutocomplete-popupIndicator': {
              color: 'primary.main',
            },
          }}
        />
        {selectedOption &&
          ref_no &&
          (selectedOption?.cf_sales_person?.includes('Company customers') ||
            selectedOption?.salesperson_name?.includes('Company customers')) && (
            <Box>
              <Box display='flex' alignItems='center' mb={1.5}>
                <Business sx={{ mr: 1, color: 'secondary.main', fontSize: 24 }} />
                <Typography variant='subtitle2' fontWeight={600} color='text.secondary'>
                  Reference Information
                </Typography>
              </Box>
              <TextField
                disabled={disabled}
                label='Reference Number'
                onChange={onChangeReference}
                value={reference || ''}
                fullWidth
                variant='outlined'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
              />
            </Box>
          )}
      </Box>
    </StyledPaper>
  );
};

export default CustomerSearchBar;
