import React, { useState } from 'react';
import FormBuilderModal from './FormBuilderModal.jsx';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                className="pl-10 @sm:pl-12 pr-4 py-2 @sm:py-3 border border-border rounded-lg w-full @md:w-80 @xl:w-96 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-surface-secondary"
              />
            </div>
            
            <div className="flex items-center gap-2 @sm:gap-3 ml-4 @md:ml-0">
              <button className="p-2 @sm:p-3 text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20" title="Filter">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              <button className="p-2 @sm:p-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-button" title="Grid view">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button className="p-2 @sm:p-3 text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20" title="List view">
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
