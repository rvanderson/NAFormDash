import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DynamicForm from './forms/DynamicForm';
import PublicForm from './forms/PublicForm';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: [], // ['Published', 'Draft', 'Archived']
    tags: [] // ['survey', 'feedback', 'onboarding', 'contact']
  });
  const [availableTags, setAvailableTags] = useState([]);

  return (
    <Router>
      <div className="min-h-screen bg-surface-secondary font-body">
        <Routes>
          <Route path="/" element={
            <>
              <Header 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filters={filters}
                onFiltersChange={setFilters}
                availableTags={availableTags}
                onTagsChange={setAvailableTags}
              />
              <Dashboard 
                searchQuery={searchQuery} 
                viewMode={viewMode} 
                filters={filters}
                availableTags={availableTags}
                onAvailableTagsChange={setAvailableTags}
              />
            </>
          } />
          <Route path="/forms/:formId" element={<DynamicForm />} />
          <Route path="/f/:slug" element={<PublicForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
