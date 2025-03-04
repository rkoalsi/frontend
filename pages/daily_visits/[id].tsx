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
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [updateData, setUpdateData] = useState<any>(null); // holds update entry for editing
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
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default DailyVisitDetail;
