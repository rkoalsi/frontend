import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Divider,
  useMediaQuery,
  useTheme,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Fragment, useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
// You'll need to install these icons if not already available
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import DownloadIcon from '@mui/icons-material/Download';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioStates, setAudioStates]: any = useState({});
  const audioRefs: any = useRef({});
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch announcements from the API
  const getData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/announcements`);
      setAnnouncements(resp.data);

      // Initialize audio states for all announcements
      const initialAudioStates: any = {};
      resp.data.forEach((announcement: any) => {
        if (announcement.audio_url) {
          initialAudioStates[announcement._id] = {
            isPlaying: false,
            isMuted: false,
            progress: 0,
            duration: 0,
            isLoaded: false,
          };
        }
      });
      setAudioStates(initialAudioStates);
    } catch (error: any) {
      console.error(error);
      toast.error('Error fetching announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Handle duration loaded
  const handleLoadedMetadata = (id: any) => {
    const audio = audioRefs.current[id];

    setAudioStates((prev: any) => ({
      ...prev,
      [id]: {
        ...prev[id],
        duration: audio.duration,
        isLoaded: true,
      },
    }));
  };

  // Handle play/pause for audio
  const togglePlay = (id: any) => {
    const audio = audioRefs.current[id];

    if (audioStates[id].isPlaying) {
      audio.pause();
    } else {
      // Pause all other playing audio
      Object.keys(audioRefs.current).forEach((key) => {
        if (key !== id && audioRefs.current[key]) {
          audioRefs.current[key].pause();
          setAudioStates((prev: any) => ({
            ...prev,
            [key]: { ...prev[key], isPlaying: false },
          }));
        }
      });

      // Make sure metadata is loaded before playing
      if (!audioStates[id].isLoaded) {
        audio.load();
        // Wait for metadata before playing
        audio.addEventListener(
          'loadedmetadata',
          () => {
            handleLoadedMetadata(id);
            audio
              .play()
              .catch((err: any) => console.error('Error playing audio:', err));
          },
          { once: true }
        );
      } else {
        audio
          .play()
          .catch((err: any) => console.error('Error playing audio:', err));
      }
    }

    setAudioStates((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], isPlaying: !prev[id].isPlaying },
    }));
  };

  // Handle mute/unmute for audio
  const toggleMute = (id: any) => {
    const audio = audioRefs.current[id];
    audio.muted = !audio.muted;

    setAudioStates((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], isMuted: !prev[id].isMuted },
    }));
  };

  // Update progress bar as audio plays
  const handleTimeUpdate = (id: any) => {
    const audio = audioRefs.current[id];
    if (audio && !isNaN(audio.duration) && isFinite(audio.duration)) {
      const progress = (audio.currentTime / audio.duration) * 100;

      setAudioStates((prev: any) => ({
        ...prev,
        [id]: {
          ...prev[id],
          progress,
          duration: audio.duration,
        },
      }));
    }
  };

  // Handle seeking in progress bar
  const handleSeek = (id: any, e: any) => {
    const audio = audioRefs.current[id];
    if (!audio || isNaN(audio.duration) || !isFinite(audio.duration)) return;

    const rect = e.target.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * audio.duration;

    if (isFinite(newTime) && !isNaN(newTime)) {
      audio.currentTime = newTime;
      setAudioStates((prev: any) => ({
        ...prev,
        [id]: {
          ...prev[id],
          progress: clickPosition * 100,
        },
      }));
    }
  };

  // Handle audio ended event
  const handleAudioEnded = (id: any) => {
    setAudioStates((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], isPlaying: false, progress: 0 },
    }));
  };

  // Format time in mm:ss
  const formatTime = (seconds: any) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='flex-start'
      sx={{
        width: '100%',
        gap: '16px',
        padding: isMobile ? '16px' : '16px',
      }}
    >
      <Header title={'Announcements'} showBackButton />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Typography align='center' variant='h6' color='white'>
          No Announcements available.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            background: 'none',
            borderRadius: '8px',
          }}
        >
          <List>
            {announcements.map((announcement: any, index) => (
              <Fragment key={announcement._id}>
                <ListItem
                  component='div'
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    textAlign: 'flex-start',
                    backgroundColor: 'white',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '100%',
                      minWidth: '320px',
                      textAlign: 'flex-start',
                    }}
                  >
                    <Typography variant='h6' fontWeight='bold' color='black'>
                      {index + 1}. {announcement.title}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='black'
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {announcement.description}
                    </Typography>

                    {/* Enhanced audio player if audio_url exists */}
                    {announcement.audio_url &&
                      audioStates[announcement._id] && (
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 2,
                            mb: 2,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.04)',
                            border: `1px solid ${
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.1)'
                            }`,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Tooltip
                              title={
                                audioStates[announcement._id].isPlaying
                                  ? 'Pause'
                                  : 'Play'
                              }
                            >
                              <IconButton
                                onClick={() => togglePlay(announcement._id)}
                                size='small'
                                sx={{
                                  color: theme.palette.primary.main,
                                  mr: 1,
                                  bgcolor:
                                    theme.palette.mode === 'dark'
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.04)',
                                }}
                              >
                                {audioStates[announcement._id].isPlaying ? (
                                  <PauseIcon />
                                ) : (
                                  <PlayArrowIcon />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Box
                              sx={{
                                flexGrow: 1,
                                height: '8px',
                                borderRadius: 4,
                                bgcolor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                              onClick={(e) => handleSeek(announcement._id, e)}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  height: '100%',
                                  width: `${
                                    audioStates[announcement._id].progress
                                  }%`,
                                  bgcolor: theme.palette.primary.main,
                                  borderRadius: 4,
                                }}
                              />
                            </Box>

                            <Typography
                              variant='caption'
                              sx={{
                                ml: 1,
                                minWidth: '60px',
                                textAlign: 'right',
                                color: 'black',
                              }}
                            >
                              {audioStates[announcement._id].isLoaded
                                ? `${formatTime(
                                    audioRefs.current[announcement._id]
                                      ?.currentTime || 0
                                  )} / ${formatTime(
                                    audioStates[announcement._id].duration
                                  )}`
                                : '--:-- / --:--'}
                            </Typography>

                            <Tooltip
                              title={
                                audioStates[announcement._id].isMuted
                                  ? 'Unmute'
                                  : 'Mute'
                              }
                            >
                              <IconButton
                                onClick={() => toggleMute(announcement._id)}
                                size='small'
                                sx={{ ml: 1, color: 'black' }}
                              >
                                {audioStates[announcement._id].isMuted ? (
                                  <VolumeMuteIcon fontSize='small' />
                                ) : (
                                  <VolumeUpIcon fontSize='small' />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title='Download'>
                              <IconButton
                                component='a'
                                href={announcement.audio_url}
                                download
                                target='_blank'
                                size='small'
                                sx={{ color: 'black' }}
                              >
                                <DownloadIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {/* Hidden audio element with preload*/}
                          <audio
                            ref={(el) => {
                              if (el) audioRefs.current[announcement._id] = el;
                            }}
                            src={announcement.audio_url}
                            preload='metadata'
                            onLoadedMetadata={() =>
                              handleLoadedMetadata(announcement._id)
                            }
                            onTimeUpdate={() =>
                              handleTimeUpdate(announcement._id)
                            }
                            onEnded={() => handleAudioEnded(announcement._id)}
                            style={{ display: 'none' }}
                          />
                        </Paper>
                      )}

                    <Typography variant='body2' color='black'>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </ListItem>
                {index < announcements.length - 1 && <Divider />}
              </Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default Announcements;
