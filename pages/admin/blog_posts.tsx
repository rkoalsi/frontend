import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  Chip,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Edit, Delete, Add, Search, Image as ImageIcon } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import dynamic from 'next/dynamic';

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'blockquote', 'code-block',
  'link', 'image', 'color', 'background',
];

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    return React.forwardRef<any, any>((props, ref) => <RQ ref={ref} {...props} />);
  },
  { ssr: false }
);

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  categories: string[];
  tags: string[];
  authors: string[];
  time: string;
  draft: boolean;
  content: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  image: '',
  categories: '',
  tags: '',
  authors: '',
  time: '',
  draft: false,
  content: '',
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const BlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<any>(null);

  // Custom image handler — uploads file to S3 and inserts URL at cursor
  const imageHandler = useCallback(() => {
    inlineImageInputRef.current?.click();
  }, []);

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axiosInstance.post('/admin/blog/posts/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range ? range.index : 0, 'image', url);
        if (range) quill.setSelection(range.index + 1);
      }
      toast.success('Image inserted.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error uploading inline image.');
    } finally {
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = '';
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ color: [] }, { background: [] }],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (search) params.search = search;
      const response = await axiosInstance.get('/admin/blog/posts', { params });
      const { posts, total_count, total_pages } = response.data;
      setPosts(posts || []);
      setTotalCount(total_count || 0);
      setTotalPagesCount(total_pages || 1);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching blog posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, actionLoading]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleEditClick = async (post: BlogPost) => {
    setActionLoading(true);
    try {
      // Fetch full post including content (list endpoint excludes content field)
      const res = await axiosInstance.get(`/admin/blog/posts/${post._id}`);
      const full: BlogPost = res.data;
      setSelectedPost(full);
      setFormData({
        title: full.title || '',
        slug: full.slug || '',
        description: full.description || '',
        date: full.date ? full.date.split('T')[0] : new Date().toISOString().split('T')[0],
        image: full.image || '',
        categories: (full.categories || []).join(', '),
        tags: (full.tags || []).join(', '),
        authors: (full.authors || []).join(', '),
        time: full.time || '',
        draft: full.draft || false,
        content: full.content || '',
      });
    } catch {
      // Fallback to list data (content will be empty but still opens)
      setSelectedPost(post);
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        description: post.description || '',
        date: post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0],
        image: post.image || '',
        categories: (post.categories || []).join(', '),
        tags: (post.tags || []).join(', '),
        authors: (post.authors || []).join(', '),
        time: post.time || '',
        draft: post.draft || false,
        content: '',
      });
    } finally {
      setActionLoading(false);
      setDialogOpen(true);
    }
  };

  const handleAdd = () => {
    setSelectedPost(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        categories: formData.categories.split(',').map((s) => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map((s) => s.trim()).filter(Boolean),
        authors: formData.authors.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (selectedPost) {
        await axiosInstance.put(`/admin/blog/posts/${selectedPost._id}`, payload);
        toast.success('Post updated successfully.');
      } else {
        await axiosInstance.post('/admin/blog/posts', payload);
        toast.success('Post created successfully.');
      }

      setDialogOpen(false);
      setSelectedPost(null);
      setFormData(emptyForm);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error saving post.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDraft = async (post: BlogPost) => {
    setActionLoading(true);
    try {
      await axiosInstance.put(`/admin/blog/posts/${post._id}`, { draft: !post.draft });
      toast.success(`Post marked as ${!post.draft ? 'Draft' : 'Published'}.`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error updating post.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Permanently delete "${post.title}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/admin/blog/posts/${post._id}`);
      toast.success('Post deleted.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error deleting post.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    setImageUploading(true);
    try {
      const res = await axiosInstance.post('/admin/blog/posts/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, image: res.data.url }));
      toast.success('Image uploaded.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error uploading image.');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug when title changes and slug is empty / was auto-generated
      if (field === 'title' && (!prev.slug || prev.slug === generateSlug(prev.title))) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  const stripHtml = (html: string) =>
    html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
            Blog Posts
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            New Post
          </Button>
        </Box>
        <Typography variant="body1" sx={{ color: '#6B7280', mb: 3 }}>
          Create, edit, and manage blog posts for the BarkButler blog.
        </Typography>

        {/* Search */}
        <Box display="flex" gap={1} mb={3}>
          <TextField
            size="small"
            placeholder="Search posts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button variant="outlined" onClick={handleSearch}>
            Search
          </Button>
          {search && (
            <Button
              variant="text"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Table */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : posts.length > 0 ? (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Categories</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Published</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 220 }}>
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 220 }}>
                          {stripHtml(post.description || '').slice(0, 80)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          /{post.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {(post.categories || []).slice(0, 2).map((cat, i) => (
                            <Chip key={i} label={cat} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {post.date ? new Date(post.date).toLocaleDateString('en-IN') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={!post.draft}
                          onChange={() => handleToggleDraft(post)}
                          disabled={actionLoading}
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditClick(post)} disabled={actionLoading}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete permanently">
                          <IconButton size="small" color="error" onClick={() => handleDelete(post)} disabled={actionLoading}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
              <Typography variant="caption" color="text.secondary">
                {totalCount} posts · {totalPagesCount} pages
              </Typography>
            </Box>
          </>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
            <Typography variant="h6" color="text.secondary">
              {search ? `No posts matching "${search}"` : 'No blog posts yet'}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                Create First Post
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1, borderBottom: '1px solid #e5e7eb' }}>
          {selectedPost ? 'Edit Blog Post' : 'New Blog Post'}
        </DialogTitle>
        <DialogContent sx={{ overflowY: 'auto', maxHeight: '80vh' }}>
          <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
            {/* Title */}
            <TextField
              label="Title *"
              fullWidth
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter post title"
            />

            {/* Slug */}
            <TextField
              label="Slug (URL)"
              fullWidth
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              helperText="Auto-generated from title. Edit to customise."
              InputProps={{
                startAdornment: <InputAdornment position="start">/</InputAdornment>,
              }}
            />

            {/* Description */}
            <TextField
              label="Description / Excerpt"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Short summary shown in post cards and meta tags"
            />

            {/* Date + Reading time */}
            <Box display="flex" gap={2}>
              <TextField
                label="Publish Date"
                type="date"
                fullWidth
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Reading Time"
                fullWidth
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="e.g. 5 minutes"
              />
            </Box>

            {/* Categories + Tags + Authors */}
            <Box display="flex" gap={2}>
              <TextField
                label="Categories"
                fullWidth
                value={formData.categories}
                onChange={(e) => handleInputChange('categories', e.target.value)}
                placeholder="Dogs, Cats (comma-separated)"
              />
              <TextField
                label="Tags"
                fullWidth
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="grooming, nutrition (comma-separated)"
              />
            </Box>
            <Box display="flex" gap={2} alignItems="flex-start">
              <TextField
                label="Authors"
                fullWidth
                value={formData.authors}
                onChange={(e) => handleInputChange('authors', e.target.value)}
                placeholder="Author Name (comma-separated)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.draft}
                    onChange={(e) => handleInputChange('draft', e.target.checked)}
                  />
                }
                label="Save as Draft"
                sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
              />
            </Box>

            {/* Hero Image */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" mb={1}>
                Hero Image
              </Typography>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Image URL or upload below"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  sx={{ flex: 1, minWidth: 260 }}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outlined"
                  startIcon={imageUploading ? <CircularProgress size={16} /> : <ImageIcon />}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                  size="small"
                >
                  {imageUploading ? 'Uploading…' : 'Upload Image'}
                </Button>
              </Box>
              {formData.image && (
                <Box
                  mt={1.5}
                  component="img"
                  src={formData.image}
                  alt="Hero preview"
                  sx={{
                    height: 140,
                    borderRadius: 2,
                    objectFit: 'cover',
                    border: '1px solid #e5e7eb',
                    display: 'block',
                  }}
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              )}
            </Box>

            {/* Rich Text Content */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" mb={1}>
                Content *
              </Typography>
              <Box
                sx={{
                  '& .ql-container': { minHeight: '320px', fontSize: '15px', fontFamily: 'inherit' },
                  '& .ql-editor': { minHeight: '320px', lineHeight: 1.7 },
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleInlineImageUpload}
                />
                <ReactQuill
                  ref={quillRef}
                  key={dialogOpen ? (selectedPost?._id || 'new') : 'closed'}
                  theme="snow"
                  value={formData.content}
                  onChange={(value: string) => handleInputChange('content', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your post content here…"
                />
              </Box>
            </Box>

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2} pt={1}>
              <Button onClick={() => setDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={actionLoading || !formData.title.trim()}
                startIcon={actionLoading ? <CircularProgress size={16} /> : undefined}
              >
                {actionLoading ? 'Saving…' : selectedPost ? 'Save Changes' : 'Publish Post'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BlogPosts;
