import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import AuthContext from '../Auth';

interface SearchResult {
  _id: string;
  contact_name: string;
}

interface SearchBarProps {
  label: string;
  onChange: (value: SearchResult | null) => void;
  value?: SearchResult | null;
  initialValue?: SearchResult | null;
}

const CustomerSearchBar: React.FC<SearchBarProps> = ({
  label = 'Search',
  onChange,
  value,
  initialValue,
}) => {
  const { user }: any = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchResult | null>(
    initialValue || null
  );
  useEffect(() => {
    if (initialValue) {
      setSelectedOption(initialValue);
      setOptions([initialValue]);
    }
  }, [initialValue]);

  const handleSearch = async (value: string) => {
    if (!value) return;

    setLoading(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/customers`, {
        params: {
          user_code: user.data.code, // Pass salesperson's code
          name: value, // Pass search value
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
    <>
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option: any) => option?.contact_name || 'Unknown Name'}
        isOptionEqualToValue={(option: SearchResult, value: SearchResult) => {
          console.log(option._id);
          return option._id === value._id;
        }}
        value={selectedOption || null}
        onInputChange={(event, value) => {
          setQuery(value);
          handleSearch(value);
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
    </>
  );
};

export default CustomerSearchBar;
