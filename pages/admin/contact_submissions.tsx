import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { Download, FilterAlt, Refresh } from '@mui/icons-material';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';
import ContactTable from '../../src/components/admin/contact_submissions/ContactTable';

const Contacts = () => {
  // States for contacts, pagination, filtering, editing, etc.
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [skipPage, setSkipPage] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearchQuery.trim() !== '') {
        params.search = debouncedSearchQuery.trim();
      }
      const response = await axiosInstance.get('/admin/contact_submissions', {
        params,
      });
      setContacts(response.data.contact_submissions);
      setTotalCount(response.data.total_count);
      setTotalPageCount(response.data.total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [page, rowsPerPage, debouncedSearchQuery]);

  const handleSearch = (e: any) => setSearchQuery(e.target.value);
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
    setSkipPage('');
  };
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    if (requestedPage > totalPages) {
      toast.error(`Page number exceeds total pages (${totalPages})`);
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{ padding: { xs: 2, sm: 3, md: 4 }, borderRadius: 4, backgroundColor: 'white' }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            All Contact Submissions
          </Typography>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          All Contact Us Form Submissions Done on Pupscribe.in
        </Typography>

        {/* Search Bar */}
        <TextField
          label='Search by Name'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: 3 }}
        />

        <ContactTable
          contacts={contacts}
          loading={loading}
          totalCount={totalCount}
          totalPageCount={totalPageCount}
          page={page}
          rowsPerPage={rowsPerPage}
          skipPage={skipPage}
          setSkipPage={setSkipPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleSkipPage={handleSkipPage}
        />
      </Paper>

    </Box>
  );
};

export default Contacts;
