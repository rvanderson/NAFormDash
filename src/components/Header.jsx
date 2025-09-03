import React, { useState, useEffect, useRef } from 'react';
import FormBuilderModal from './FormBuilderModal.jsx';

const Header = ({ searchQuery, onSearchChange, viewMode, onViewModeChange, filters, onFiltersChange, availableTags, onTagsChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const handleFormGenerated = (result) => {
    console.log('Form generated successfully:', result);
    // TODO: Refresh the dashboard to show the new form
    // For now, just show a success message
    alert(`Form "${result.formName}" generated successfully! 🎉`);
    
    // In a real app, you might want to:
    // - Redirect to the new form
    // - Refresh the dashboard
    // - Show a toast notification
  };

  const handleStatusFilter = (status) => {
    const newStatusFilters = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({
      ...filters,
      status: newStatusFilters
    });
  };

  const handleTagFilter = (tag) => {
    const newTagFilters = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({
      ...filters,
      tags: newTagFilters
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      tags: []
    });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.tags.length > 0;

  const handleAddTag = () => {
    if (newTagName.trim() && !availableTags.includes(newTagName.trim().toLowerCase())) {
      onTagsChange([...availableTags, newTagName.trim().toLowerCase()]);
      setNewTagName('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    // Remove from available tags
    onTagsChange(availableTags.filter(tag => tag !== tagToDelete));
    
    // Remove from active filters if present
    if (filters.tags.includes(tagToDelete)) {
      onFiltersChange({
        ...filters,
        tags: filters.tags.filter(tag => tag !== tagToDelete)
      });
    }
  };

  const handleEditTag = (oldTag, newTag) => {
    if (newTag.trim() && newTag !== oldTag) {
      const newTagTrimmed = newTag.trim().toLowerCase();
      
      // Update available tags
      onTagsChange(availableTags.map(tag => tag === oldTag ? newTagTrimmed : tag));
      
      // Update active filters if the old tag was selected
      if (filters.tags.includes(oldTag)) {
        onFiltersChange({
          ...filters,
          tags: filters.tags.map(tag => tag === oldTag ? newTagTrimmed : tag)
        });
      }
    }
    setEditingTag(null);
  };

  return (
    <>
      <FormBuilderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFormGenerated={handleFormGenerated}
      />
    <div className="bg-surface border-b border-border">
      <div className="@container max-w-7xl mx-auto">
        <div className="px-6 py-6 @lg:px-8 @xl:px-12">
          <div className="flex items-center justify-between mb-6 @sm:mb-8">
            <div>
              <h1 className="text-2xl @sm:text-3xl font-display font-semibold text-gray-900">Form Dashboard</h1>
              <p className="text-gray-600 mt-1 @sm:text-lg">Manage and create forms for your design projects</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2 @sm:px-6 @sm:py-3"
            >
              <svg className="w-4 h-4 @sm:w-5 @sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden @sm:inline">Create New Form</span>
              <span className="@sm:hidden">Create</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between @container">
            <div className="relative flex-1 @md:flex-none">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 @sm:w-5 @sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search forms..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 @sm:pl-12 pr-4 py-2 @sm:py-3 border border-border rounded-lg w-full @md:w-80 @xl:w-96 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-surface-secondary"
              />
            </div>
            
            <div className="flex items-center gap-2 @sm:gap-3 ml-4 @md:ml-0">
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 @sm:p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    hasActiveFilters || isFilterOpen
                      ? 'bg-brand-600 text-white hover:bg-brand-700' 
                      : 'text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary'
                  }`} 
                  title="Filter"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full text-xs flex items-center justify-center text-white">
                      {filters.status.length + filters.tags.length}
                    </span>
                  )}
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-lg shadow-card-hover z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Filter Forms</h3>
                        {hasActiveFilters && (
                          <button
                            onClick={clearAllFilters}
                            className="text-sm text-brand-600 hover:text-brand-700"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Status Filters */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                        <div className="space-y-2">
                          {['Published', 'Draft', 'Archived'].map(status => (
                            <label key={status} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.status.includes(status)}
                                onChange={() => handleStatusFilter(status)}
                                className="rounded border-border text-brand-600 focus:ring-brand-500/20 focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-600">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tag Filters */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                        </div>
                        <div className="space-y-2 mb-4">
                          {availableTags.map(tag => (
                            <div key={tag} className="flex items-center justify-between group">
                              <label className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={filters.tags.includes(tag)}
                                  onChange={() => handleTagFilter(tag)}
                                  className="rounded border-border text-brand-600 focus:ring-brand-500/20 focus:ring-2"
                                />
                                {editingTag === tag ? (
                                  <input
                                    type="text"
                                    defaultValue={tag}
                                    className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded flex-1"
                                    onBlur={(e) => handleEditTag(tag, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditTag(tag, e.target.value);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingTag(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="ml-2 text-sm text-gray-600 capitalize flex-1">{tag}</span>
                                )}
                              </label>
                              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingTag !== tag && (
                                  <>
                                    <button
                                      onClick={() => setEditingTag(tag)}
                                      className="p-1 text-gray-400 hover:text-brand-600 rounded"
                                      title="Edit tag"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTag(tag)}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                                      title="Delete tag"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add New Tag */}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add new tag..."
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTag();
                                }
                              }}
                            />
                            <button
                              onClick={handleAddTag}
                              disabled={!newTagName.trim()}
                              className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => onViewModeChange('grid')}
                className={`p-2 @sm:p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  viewMode === 'grid' 
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-button' 
                    : 'text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary'
                }`} 
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => onViewModeChange('list')}
                className={`p-2 @sm:p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  viewMode === 'list' 
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-button' 
                    : 'text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary'
                }`} 
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Header;
