import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import DailyVisitHeader from '../../src/components/daily_visits/DailyVisitHeader';
import ShopsSection from '../../src/components/daily_visits/ShopsSection';
import SelfieCard from '../../src/components/daily_visits/SelfieCard';
import UpdateSection from '../../src/components/daily_visits/UpdateSection';
import ShopsDialog from '../../src/components/daily_visits/ShopsDialog';
import UpdateDialog from '../../src/components/daily_visits/UpdateDialog';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import HookDialog from '../../src/components/daily_visits/HookDialog';

const DailyVisitDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user }: any = useContext(AuthContext);
  const [dailyVisit, setDailyVisit] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog controls
  const [shopsDialogOpen, setShopsDialogOpen] = useState<boolean>(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [updateData, setUpdateData] = useState<any>(null); // holds update entry for editing
  const [hooks, setHooks] = useState<any[]>([]);
  const [hookCategories, setHookCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [formData, setFormData]: any = useState({
    selectedCustomer: null as any,
    customerAddress: '',
    hookEntries: [] as any[],
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);

  const fetchHooks = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/hooks`, {
        params: { created_by: user?.data?._id },
      });
      setHooks(resp.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch hooks');
    }
  };

  const fetchCategories = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/hooks/categories`);
      const cats = resp.data.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
      }));
      setHookCategories(cats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch hook categories');
    }
  };

  // Fetch hook categories and hooks on mount.
  useEffect(() => {
    fetchHooks();
    fetchCategories();
  }, []);

  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setFormData((prev: any) => ({
        ...prev,
        selectedCustomer: customer,
      }));
      setAddresses(Array.isArray(customer.addresses) ? customer.addresses : []);
    }
  };
  const handleOpenDialog = async (customer: any) => {
    const { customer_id = '' } = customer;
    const shop = dailyVisit.shops.find(
      (s: any) => s.customer_id === customer_id
    );
    const { address = {} } = shop;
    const { data = {} } = await axios.get(
      `${process.env.api_url}/customers/${customer_id}`
    );
    const { data: hooksData = [] } = await axios.get(
      `${process.env.api_url}/hooks`,
      { params: { created_by: user?.data?._id } }
    );
    const { customer: selectedCustomer = {} } = data;
    setOpen(true);
    setFormData((prev: any) => ({
      ...prev,
      selectedCustomer: selectedCustomer,
      customerAddress: address,
      hookEntries: hooksData.filter(
        (h: any) => h.customer_id === selectedCustomer._id
      )[0]?.hooks,
    }));
    setEditingHookId(
      hooksData.filter((h: any) => h.customer_id === selectedCustomer._id)[0]
        ?._id
    );
    setAddresses(
      Array.isArray(selectedCustomer.addresses)
        ? selectedCustomer.addresses
        : []
    );
  };

  const handleAddressSelect = (address: string) => {
    setFormData((prev: any) => ({
      ...prev,
      customerAddress: addresses.find((adr) => adr.address_id == address),
    }));
  };

  const addHookEntry = () => {
    const newEntry = {
      entryId: Date.now().toString(),
      category_id: '',
      hooksAvailable: '',
      totalHooks: '',
      editing: true,
    };
    setFormData((prev: any) => ({
      ...prev,
      hookEntries: [...prev.hookEntries, newEntry],
    }));
  };

  const updateEntry = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updatedEntries = [...prev.hookEntries];
      if (field === 'hooksAvailable' || field === 'totalHooks') {
        updatedEntries[index][field] = value === '' ? '' : parseInt(value, 10);
      } else {
        updatedEntries[index][field] = value;
      }
      return { ...prev, hookEntries: updatedEntries };
    });
  };

  const removeEntry = (index: number) => {
    setFormData((prev: any) => {
      const updatedEntries = prev.hookEntries.filter(
        (_: any, i: any) => i !== index
      );
      return { ...prev, hookEntries: updatedEntries };
    });
  };

  const handleEditHook = async (hookData: any) => {
    const { data = {} } = await axios.get(
      `${process.env.api_url}/customers/${hookData.customer_id}`
    );
    const { customer = {} } = data;
    setFormData({
      selectedCustomer: customer,
      customerAddress: hookData.customer_address,
      hookEntries: hookData.hooks.map((entry: any) => ({
        entryId: entry.entryId,
        category_id: entry.category_id,
        hooksAvailable: entry.hooksAvailable,
        totalHooks: entry.totalHooks,
        editing: false,
        category_name: entry.category_name,
      })),
    });
    setAddresses(customer.addresses);
    setEditingHookId(hookData._id);
  };
  const toggleEditEntry = (index: number) => {
    setFormData((prev: any) => {
      const updatedEntries = prev.hookEntries.map((entry: any, i: any) => {
        if (i === index) {
          console.log(entry);
          setIsEditing(true);
          setOpen(true);
          return { ...entry, editing: !entry.editing };
        } else {
          return entry;
        }
      });
      return { ...prev, hookEntries: updatedEntries };
    });
  };
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);
  const fetchDailyVisit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.api_url}/daily_visits/${id}`
      );
      setDailyVisit(response.data);
    } catch (err) {
      console.error(err);
      setError('Error fetching daily visit details');
      toast.error('Error fetching daily visit details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDailyVisit();
  }, [id, fetchDailyVisit]);

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const formData = new FormData();
      formData.append('uploaded_by', user?.data?._id);
      formData.append('delete_update', updateId);
      const response = await axios.put(
        `${process.env.api_url}/daily_visits/${id}`,
        formData
      );
      toast.success(response.data.message || 'Update deleted successfully');
      fetchDailyVisit();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting update');
    }
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.customerAddress) {
      toast.error('Please select an address');
      return;
    }
    if (formData.hookEntries.length === 0) {
      toast.error('Please add at least one hook entry');
      return;
    }
    for (let entry of formData.hookEntries) {
      if (entry.editing) {
        toast.error(
          'Please complete editing all hook entries before submitting'
        );
        return;
      }
    }
    const hooksWithCategoryName = formData.hookEntries.map((entry: any) => {
      const category = hookCategories.find(
        (cat: any) => cat.id === entry.category_id
      );
      return {
        ...entry,
        category_name: category ? category.name : '',
      };
    });

    const payload = {
      customer_id: formData.selectedCustomer._id,
      customer_name: formData.selectedCustomer.contact_name,
      customer_address: formData.customerAddress,
      hooks: hooksWithCategoryName,
      created_by: user?.data?._id,
    };

    try {
      console.log(isEditing, editingHookId);
      if (isEditing && editingHookId) {
        await axios.put(
          `${process.env.api_url}/hooks/${editingHookId}`,
          payload
        );
        toast.success('Hook details updated successfully');
      } else {
        await axios.post(`${process.env.api_url}/hooks`, payload);
        toast.success('Hook details submitted successfully');
      }
      setFormData({
        selectedCustomer: null,
        customerAddress: '',
        hookEntries: [],
      });
      setAddresses([]);
      setOpen(false);
      setIsEditing(false);
      setEditingHookId(null);
      await fetchHooks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit hook details');
    }
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity='error'>{error}</Alert>
        <Button variant='contained' sx={{ mt: 2 }} onClick={fetchDailyVisit}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: '1200px', mx: 'auto' }}>
      <Card elevation={3}>
        <DailyVisitHeader createdAt={dailyVisit.created_at} />
        <CardContent>
          <ShopsSection
            onHookUpdate={handleOpenDialog}
            shops={dailyVisit.shops}
            onEditShops={() => setShopsDialogOpen(true)}
          />
          {dailyVisit.selfie && (
            <SelfieCard
              selfieUrl={dailyVisit.selfie}
              onClickImage={() => handleImageClick(dailyVisit.selfie)}
            />
          )}
          <UpdateSection
            onHookUpdate={handleOpenDialog}
            onClickImage={handleImageClick}
            updates={dailyVisit.updates}
            onAddUpdate={() => {
              setUpdateData(null);
              setUpdateDialogOpen(true);
            }}
            onEditUpdate={(update: any) => {
              setUpdateData(update);
              setUpdateDialogOpen(true);
            }}
            onDeleteUpdate={(update: string) => {
              handleDeleteUpdate(update);
            }}
          />
        </CardContent>
      </Card>

      {/* Shops editing dialog */}
      <ShopsDialog
        open={shopsDialogOpen}
        onClose={() => setShopsDialogOpen(false)}
        dailyVisit={dailyVisit}
        refreshDailyVisit={fetchDailyVisit}
        user={user}
      />

      {/* Update add/edit dialog */}
      <UpdateDialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        updateData={updateData}
        dailyVisitId={id as string}
        dailyVisit={dailyVisit}
        refreshDailyVisit={fetchDailyVisit}
        user={user}
      />
      <HookDialog
        open={open}
        setOpen={setOpen}
        isEditing={isEditing}
        formData={formData}
        addresses={addresses}
        hookCategories={hookCategories}
        handleSubmit={handleSubmit}
        handleCustomerSelect={handleCustomerSelect}
        handleAddressSelect={handleAddressSelect}
        updateEntry={updateEntry as any}
        removeEntry={removeEntry}
        toggleEditEntry={toggleEditEntry}
        addHookEntry={addHookEntry}
      />
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default DailyVisitDetail;
