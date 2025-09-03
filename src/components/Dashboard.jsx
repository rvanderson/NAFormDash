import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FormCard = ({ title, description, status, responses, date, path, isGenerated, generatedBy, onEdit, onArchive, onTogglePublic, formId, isPublic, urlSlug }) => {
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
    if (path) {
      navigate(path);
    }
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-success-50 text-success-700 border-success-500/20';
      case 'Draft':
        return 'bg-warning-50 text-warning-700 border-warning-500/20';
      case 'Archived':
        return 'bg-purple-50 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300/20';
    }
  };

  return (
    <div className="@container group">
      <article 
        className={`card-base @hover:card-hover p-6 @sm:p-8 focus-within:ring-2 focus-within:ring-brand-500/20 ${path ? 'cursor-pointer' : ''}`}
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
            {isGenerated && (
              <span className="status-badge border bg-purple-50 text-purple-700 border-purple-500/20">
                🤖 AI
              </span>
            )}
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
        <p className="text-gray-600 text-sm @sm:text-base mb-4 @lg:mb-6 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 @sm:text-base">
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

const FormListItem = ({ title, description, status, responses, date, path, isGenerated, generatedBy, onEdit, onArchive, onTogglePublic, formId, isPublic, urlSlug }) => {
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
    if (path) {
      navigate(path);
    }
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-success-50 text-success-700 border-success-500/20';
      case 'Draft':
        return 'bg-warning-50 text-warning-700 border-warning-500/20';
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
              {isGenerated && (
                <span className="status-badge border bg-purple-50 text-purple-700 border-purple-500/20">
                  🤖 AI
                </span>
              )}
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

const Dashboard = ({ searchQuery, viewMode, filters, availableTags }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState(null);

  useEffect(() => {
    const fetchGeneratedForms = async () => {
      try {
        const response = await fetch('/api/forms');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.forms) {
            const generatedForms = data.forms.map((form, index) => ({
              id: form.id, // Add form ID
              title: form.name,
              description: form.description,
              status: form.status || (index % 3 === 0 ? 'Draft' : index % 3 === 1 ? 'Archived' : 'Published'), // Add variety for demo
              responses: form.submissionCount || 0,
              date: new Date(form.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              path: `/forms/${form.id}`,
              isGenerated: true,
              generatedBy: form.generatedBy,
              tags: form.tags || (index % 4 === 0 ? ['survey'] : index % 4 === 1 ? ['feedback'] : index % 4 === 2 ? ['onboarding'] : ['contact']), // Add demo tags
              isPublic: form.isPublic || false,
              urlSlug: form.urlSlug || form.id
            }));
            
            setForms(generatedForms);
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

  // Filter forms based on search query and filters
  const filteredForms = forms.filter(form => {
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

  const handleArchiveForm = async (formId) => {
    const form = forms.find(f => f.id === formId);
    const newStatus = form.status === 'Archived' ? 'Published' : 'Archived';
    
    try {
      // API call to update form status
      // const response = await fetch(`/api/forms/${formId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      
      // For now, just log the action
      console.log(`${newStatus === 'Archived' ? 'Archiving' : 'Unarchiving'} form ${formId}`);
      
      // Optimistically update the UI
      setForms(forms.map(f => 
        f.id === formId 
          ? { ...f, status: newStatus }
          : f
      ));

      console.log(`Form ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Failed to update form status:', error);
      // Handle error (show toast, revert changes, etc.)
    }
  };

  const handleTogglePublic = async (formId, isPublic) => {
    try {
      // API call to update form privacy status
      // const response = await fetch(`/api/forms/${formId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ isPublic })
      // });
      
      // For now, just log the action
      console.log(`${isPublic ? 'Making public' : 'Making internal'} form ${formId}`);
      
      // Optimistically update the UI
      setForms(forms.map(f => 
        f.id === formId 
          ? { ...f, isPublic }
          : f
      ));
      
      console.log(`Form ${isPublic ? 'published' : 'made private'} successfully!`);
    } catch (error) {
      console.error('Failed to update form privacy:', error);
    }
  };

  const handleUpdateForm = async (formId, updates) => {
    try {
      // API call to update form metadata
      // const response = await fetch(`/api/forms/${formId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      
      // For now, just log the update
      console.log(`Updating form ${formId}:`, updates);
      
      // Optimistically update the UI
      setForms(forms.map(f => 
        f.id === formId 
          ? { ...f, ...updates }
          : f
      ));
      setEditingForm(null);
      
      // Show success feedback
      console.log('Form updated successfully!');
    } catch (error) {
      console.error('Failed to update form:', error);
      // Handle error (show toast, revert changes, etc.)
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
    status: form?.status || 'Draft',
    tags: form?.tags || [],
    urlSlug: form?.urlSlug || ''
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
        <div className="bg-surface rounded-lg max-w-md w-full mx-4 p-6">
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
      <div className="bg-surface rounded-lg max-w-md w-full mx-4 p-6">
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
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens are allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This creates a public URL: <span className="font-mono text-brand-600">/f/{formData.urlSlug || 'your-slug'}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
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