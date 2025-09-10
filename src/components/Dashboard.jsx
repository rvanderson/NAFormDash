import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FormCard from './dashboard/FormCard';
import FormList from './dashboard/FormList';

const Dashboard = ({ searchQuery, viewMode, filters, availableTags, onAvailableTagsChange }) => {
  const { authenticatedFetch } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState(null);
  const [returnUrl, setReturnUrl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGeneratedForms = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/forms`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.forms) {
            const generatedForms = data.forms.map((form) => {
              // Map old status values to new ones
              let status = form.status || 'Internal';
              if (status === 'Published') status = 'Public';
              if (status === 'Draft') status = 'Internal';
              // Archived stays the same

              return {
                id: form.id, // Add form ID
                title: form.name,
                description: form.description,
                status: status, // Use mapped status
                responses: form.submissionCount || 0,
                date: new Date(form.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                path: `/forms/${form.id}`,
                generatedBy: form.generatedBy,
                tags: form.tags || [], // Use actual tags from form file
                isPublic: form.isPublic || false,
                urlSlug: form.urlSlug || form.id,
                webhookUrl: form.webhookUrl,
                formDefinition: form.formDefinition
              };
            });

            setForms(generatedForms);

            // Extract and update available tags from all forms
            if (onAvailableTagsChange) {
              const allTags = new Set();
              generatedForms.forEach(form => {
                if (form.tags && Array.isArray(form.tags)) {
                  form.tags.forEach(tag => allTags.add(tag));
                }
              });

              // Add default tags if no forms exist yet
              if (allTags.size === 0) {
                ['survey', 'feedback', 'onboarding', 'contact'].forEach(tag => allTags.add(tag));
              }

              onAvailableTagsChange(Array.from(allTags).sort());
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch generated forms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneratedForms();
  }, []);

  // Check for edit parameter in URL and auto-open edit modal
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const editFormId = urlParams.get('edit');
    const returnTo = urlParams.get('returnTo');

    if (editFormId && forms.length > 0 && !editingForm) {
      const formToEdit = forms.find(form => form.id === editFormId);
      if (formToEdit) {
        setEditingForm(formToEdit);
        setReturnUrl(returnTo);
        // Clear the URL parameter after opening the modal using React Router
        navigate('/', { replace: true });
      }
    }
  }, [location.search, forms, editingForm, navigate]);

  // Filter forms based on search query and filters
  const filteredForms = forms.filter(form => {
    // Hide archived forms unless specifically filtered for
    const isArchivedFiltered = filters.status.includes('Archived');
    if (form.status === 'Archived' && !isArchivedFiltered) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        form.title.toLowerCase().includes(query) ||
        form.description.toLowerCase().includes(query) ||
        form.status.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status.length > 0) {
      if (!filters.status.includes(form.status)) return false;
    }

    // Tag filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = form.tags.some(tag => filters.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    return true;
  });

  const handleEditForm = (formId) => {
    const form = forms.find(f => f.id === formId);
    setEditingForm(form);
  };

  const handleDownloadCSV = async (formId) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}/submissions/csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formId}-responses.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (response.status === 404) {
        alert('No responses found for this form');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV file. Please try again.');
    }
  };

  const handleArchiveForm = async (formId) => {
    const form = forms.find(f => f.id === formId);
    const newStatus = form.status === 'Archived' ? 'Internal' : 'Archived';

    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setForms(forms.map(f => (f.id === formId ? { ...f, status: newStatus } : f)));
      } else {
        throw new Error('Archive failed');
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      alert('Error updating form status. Please try again.');
    }
  };

  const handleTogglePublic = async (formId, makePublic) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: makePublic }),
      });

      if (response.ok) {
        setForms(forms.map(f => (f.id === formId ? { ...f, isPublic: makePublic } : f)));
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating form visibility:', error);
      alert('Error updating form visibility. Please try again.');
    }
  };

  const handleUpdateForm = async (formId, formData) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.title,
          description: formData.description,
          isPublic: formData.isPublic,
          tags: formData.tags,
          urlSlug: formData.urlSlug,
          webhookUrl: formData.webhookUrl,
          formDefinition: {
            ...forms.find(f => f.id === formId).formDefinition,
            completeText: formData.completeText
          }
        }),
      });

      if (response.ok) {
        setForms(forms.map(f => f.id === formId ? {
          ...f,
          title: formData.title,
          description: formData.description,
          isPublic: formData.isPublic,
          tags: formData.tags,
          urlSlug: formData.urlSlug,
          webhookUrl: formData.webhookUrl,
          formDefinition: {
            ...f.formDefinition,
            completeText: formData.completeText
          }
        } : f));
        setEditingForm(null);
        setReturnUrl(null);
        
        // Navigate to return URL if provided
        if (returnUrl) {
          navigate(returnUrl);
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Error updating form. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-gray-500">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary min-h-screen">
      <div className="@container max-w-7xl mx-auto">
        <div className="px-6 py-6 @lg:px-8 @xl:px-12">
          {filteredForms.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 @[680px]:grid-cols-2 @[1020px]:grid-cols-3 @[1360px]:grid-cols-4 gap-6 @lg:gap-8">
                {filteredForms.map((form, index) => (
                  <FormCard
                    key={form.id || index}
                    formId={form.id}
                    onEdit={handleEditForm}
                    onArchive={handleArchiveForm}
                    onTogglePublic={handleTogglePublic}
                    onDownloadCSV={handleDownloadCSV}
                    {...form}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredForms.map((form, index) => (
                  <FormList
                    key={form.id || index}
                    formId={form.id}
                    onEdit={handleEditForm}
                    onArchive={handleArchiveForm}
                    onTogglePublic={handleTogglePublic}
                    onDownloadCSV={handleDownloadCSV}
                    {...form}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery.trim()
                  ? `No forms match "${searchQuery}". Try adjusting your search terms.`
                  : "No forms available. Create your first form to get started!"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingForm && (
        <EditFormModal
          form={editingForm}
          onSave={handleUpdateForm}
          onClose={() => {
            setEditingForm(null);
            setReturnUrl(null);
            if (returnUrl) {
              navigate(returnUrl);
            }
          }}
          availableTags={availableTags}
        />
      )}
    </div>
  );
};

const EditFormModal = ({ form, onSave, onClose, availableTags = [] }) => {
  const [formData, setFormData] = useState({
    title: form?.title || '',
    description: form?.description || '',
    isPublic: form?.isPublic || false,
    tags: form?.tags || [],
    urlSlug: form?.urlSlug || '',
    webhookUrl: form?.webhookUrl || '',
    completeText: form?.formDefinition?.completeText || 'Submit Form'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form.id, formData);
  };

  const handleTagChange = (tag, checked) => {
    const currentTags = formData.tags || [];
    if (checked) {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    } else {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    }
  };

  if (!form) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg max-w-lg w-full mx-4 p-6">
          <div className="text-center">
            <p>Error: No form data provided</p>
            <button onClick={onClose} className="btn-primary mt-4">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Form</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-base w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-base w-full"
              rows="3"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">Public Form</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <label key={tag} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={(e) => handleTagChange(tag, e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Public URL</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">/f/</span>
              <input
                type="text"
                value={formData.urlSlug}
                onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })}
                className="input-base flex-1 rounded-none rounded-r-md"
                placeholder="form-slug"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="input-base w-full"
              placeholder="https://example.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
            <input
              type="text"
              value={formData.completeText}
              onChange={(e) => setFormData({ ...formData, completeText: e.target.value })}
              className="input-base w-full"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-md btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-md btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
