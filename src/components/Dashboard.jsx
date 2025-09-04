import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FormCard = ({ title, description, status, responses, date, path, generatedBy, onEdit, onArchive, onTogglePublic, onDownloadCSV, formId, isPublic, urlSlug }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  const handleClick = () => {
    if (isPublic && urlSlug) {
      // Navigate to public form URL
      navigate(`/f/${urlSlug}`);
    } else if (path) {
      // Navigate to internal admin URL
      navigate(path);
    }
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Public':
        return 'bg-success-50 text-success-700 border-success-500/20';
      case 'Internal':
        return 'bg-blue-50 text-blue-700 border-blue-500/20';
      case 'Archived':
        return 'bg-purple-50 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300/20';
    }
  };

  return (
    <div className="@container group h-full">
      <article 
        className={`card-base @hover:card-hover p-6 @sm:p-8 focus-within:ring-2 focus-within:ring-brand-500/20 ${path ? 'cursor-pointer' : ''} h-full flex flex-col`}
        onClick={handleClick}
        tabIndex={path ? 0 : undefined}
        role={path ? 'button' : 'article'}
        onKeyDown={(e) => path && (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        <div className="flex items-start justify-between mb-3 @sm:mb-4">
          <div className="flex items-center gap-2">
            <span className={`status-badge border ${getStatusStyles(status)}`}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {path && (
              <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {/* Action Menu */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-card-hover z-50">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Form
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePublic && onTogglePublic(formId, !isPublic);
                        setShowActions(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-secondary ${
                        isPublic 
                          ? 'text-orange-700 hover:text-orange-800' 
                          : 'text-green-700 hover:text-green-800'
                      }`}
                    >
                      {isPublic ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 9m-3.172-.172L12 12m0 0l2.829 2.829" />
                          </svg>
                          Make Internal
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Make Public
                        </>
                      )}
                    </button>
                    {isPublic && (
                      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                        <span className="font-mono">/f/{urlSlug}</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadCSV && onDownloadCSV(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8l4 4 4-4m0 0l4-4m-4 4v11" />
                      </svg>
                      {status === 'Archived' ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-lg @sm:text-xl font-semibold text-gray-900 mb-2 @lg:mb-3 group-hover:text-brand-700 transition-colors">{title}</h3>
        <p className="text-gray-600 text-sm @sm:text-base mb-4 @lg:mb-6 line-clamp-3 flex-grow">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 @sm:text-base mt-auto">
          <div className="flex items-center gap-1 @sm:gap-2">
            <svg className="w-4 h-4 @sm:w-5 @sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="@sm:font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-1 @sm:gap-2">
            <svg className="w-4 h-4 @sm:w-5 @sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m5-3V3a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="font-semibold text-brand-600 @sm:text-lg">{responses}</span>
          </div>
        </div>
      </article>
    </div>
  );
};

const FormListItem = ({ title, description, status, responses, date, path, generatedBy, onEdit, onArchive, onTogglePublic, onDownloadCSV, formId, isPublic, urlSlug }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  const handleClick = () => {
    if (isPublic && urlSlug) {
      // Navigate to public form URL
      navigate(`/f/${urlSlug}`);
    } else if (path) {
      // Navigate to internal admin URL
      navigate(path);
    }
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Public':
        return 'bg-success-50 text-success-700 border-success-500/20';
      case 'Internal':
        return 'bg-blue-50 text-blue-700 border-blue-500/20';
      case 'Archived':
        return 'bg-purple-50 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300/20';
    }
  };

  return (
    <div className="@container group">
      <article 
        className={`card-base group-hover:card-hover p-4 @sm:p-6 focus-within:ring-2 focus-within:ring-brand-500/20 ${path ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        tabIndex={path ? 0 : undefined}
        role={path ? 'button' : 'article'}
        onKeyDown={(e) => path && (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Status and AI badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`status-badge border ${getStatusStyles(status)}`}>
                {status}
              </span>
            </div>
            
            {/* Title and description */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base @sm:text-lg font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">{title}</h3>
              <p className="text-gray-600 text-sm @sm:text-base mt-1 line-clamp-1">{description}</p>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="flex items-center gap-6 flex-shrink-0 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m5-3V3a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="font-semibold text-brand-600">{responses}</span>
            </div>
            {path && (
              <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {/* Action Menu */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-card-hover z-50">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Form
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePublic && onTogglePublic(formId, !isPublic);
                        setShowActions(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-secondary ${
                        isPublic 
                          ? 'text-orange-700 hover:text-orange-800' 
                          : 'text-green-700 hover:text-green-800'
                      }`}
                    >
                      {isPublic ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 9m-3.172-.172L12 12m0 0l2.829 2.829" />
                          </svg>
                          Make Internal
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Make Public
                        </>
                      )}
                    </button>
                    {isPublic && (
                      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                        <span className="font-mono">/f/{urlSlug}</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadCSV && onDownloadCSV(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(formId);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8l4 4 4-4m0 0l4-4m-4 4v11" />
                      </svg>
                      {status === 'Archived' ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

const Dashboard = ({ searchQuery, viewMode, filters, availableTags, onAvailableTagsChange }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGeneratedForms = async () => {
      try {
        const response = await fetch('/api/forms');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.forms) {
            const generatedForms = data.forms.map((form, index) => {
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
    
    if (editFormId && forms.length > 0 && !editingForm) {
      const formToEdit = forms.find(form => form.id === editFormId);
      if (formToEdit) {
        setEditingForm(formToEdit);
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
      const response = await fetch(`/api/forms/${formId}/submissions/csv`);
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
      } else {
        alert('No responses found for this form');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV file');
    }
  };

  const handleArchiveForm = async (formId) => {
    const form = forms.find(f => f.id === formId);
    const newStatus = form.status === 'Archived' ? 'Internal' : 'Archived';
    
    try {
      console.log(`${newStatus === 'Archived' ? 'Archiving' : 'Unarchiving'} form ${formId}`);
      
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the UI with confirmed data
        setForms(forms.map(f => 
          f.id === formId 
            ? { ...f, status: newStatus }
            : f
        ));
        
        console.log(`Form ${newStatus.toLowerCase()} successfully!`);
      } else {
        throw new Error(result.error || 'Failed to update form status');
      }
    } catch (error) {
      console.error('Failed to update form status:', error);
      alert('Error updating form status: ' + error.message);
    }
  };

  const handleTogglePublic = async (formId, isPublic) => {
    try {
      console.log(`${isPublic ? 'Making public' : 'Making internal'} form ${formId}`);
      
      // Determine the status based on isPublic and current status
      const currentForm = forms.find(f => f.id === formId);
      const status = isPublic ? 'Public' : (currentForm?.status === 'Archived' ? 'Archived' : 'Internal');
      
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic, status })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the UI with confirmed data
        setForms(forms.map(f => 
          f.id === formId 
            ? { ...f, isPublic, status }
            : f
        ));
        
        console.log(`Form ${isPublic ? 'published' : 'made private'} successfully!`);
      } else {
        throw new Error(result.error || 'Failed to update form privacy');
      }
    } catch (error) {
      console.error('Failed to update form privacy:', error);
      alert('Error updating form privacy: ' + error.message);
    }
  };

  const handleUpdateForm = async (formId, updates) => {
    try {
      console.log(`🔧 Frontend sending updates for ${formId}:`, updates);
      
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response body');
      }
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid JSON response');
      }
      
      if (result.success) {
        // Determine status based on isPublic and existing status
        let finalUpdates = { ...updates };
        if (updates.isPublic !== undefined) {
          // Sync status with isPublic, but preserve Archived status
          if (updates.isPublic) {
            finalUpdates.status = 'Public';
          } else if (forms.find(f => f.id === formId)?.status !== 'Archived') {
            finalUpdates.status = 'Internal';
          }
        }
        
        // Update the forms list with the new data
        const updatedForms = forms.map(f => 
          f.id === formId 
            ? { ...f, ...finalUpdates, name: finalUpdates.title || f.name }
            : f
        );
        setForms(updatedForms);
        setEditingForm(null);
        
        // Update available tags if tags were changed
        if (updates.tags && onAvailableTagsChange) {
          const allTags = new Set();
          updatedForms.forEach(form => {
            if (form.tags && Array.isArray(form.tags)) {
              form.tags.forEach(tag => allTags.add(tag));
            }
          });
          onAvailableTagsChange(Array.from(allTags).sort());
        }
        
        console.log('Form updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update form');
      }
    } catch (error) {
      console.error('Failed to update form:', error);
      alert('Error updating form: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary min-h-screen">
        <div className="@container max-w-7xl mx-auto">
          <div className="px-6 py-6 @lg:px-8 @xl:px-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
              <span className="ml-3 text-gray-600">Loading forms...</span>
            </div>
          </div>
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
                  <FormListItem 
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
          onClose={() => setEditingForm(null)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public URL Slug
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">/f/</span>
              </div>
              <input
                type="text"
                value={formData.urlSlug}
                onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="my-form-url"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
pattern="[a-z0-9\\-]+"
                title="Only lowercase letters, numbers, and hyphens are allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This creates a public URL: <span className="font-mono text-brand-600">/f/{formData.urlSlug || 'your-slug'}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://example.com/webhook"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: URL to receive form submissions via HTTP POST
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submit Button Text
            </label>
            <input
              type="text"
              value={formData.completeText}
              onChange={(e) => setFormData({ ...formData, completeText: e.target.value })}
              placeholder="Submit Form"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Text displayed on the form's submit button
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: !e.target.checked })}
                  className="text-brand-600 focus:ring-brand-500/20 focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Internal</div>
                  <div className="text-xs text-gray-500">Only accessible via admin dashboard</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="text-brand-600 focus:ring-brand-500/20 focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Public</div>
                  <div className="text-xs text-gray-500">Accessible via public URL: /f/{formData.urlSlug || 'your-slug'}</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              {(availableTags || []).map(tag => (
                <label key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(formData.tags || []).includes(tag)}
                    onChange={(e) => handleTagChange(tag, e.target.checked)}
                    className="rounded border-border text-brand-600 focus:ring-brand-500/20 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600 capitalize">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-700 hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
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