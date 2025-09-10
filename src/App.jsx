import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FormContentEditor from './components/FormContentEditor';
import DynamicForm from './forms/DynamicForm';
import PublicForm from './forms/PublicForm';

// Main App content that requires authentication
const AuthenticatedApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: [], // ['Published', 'Draft', 'Archived']
    tags: [] // ['survey', 'feedback', 'onboarding', 'contact']
  });
  const [availableTags, setAvailableTags] = useState([]);

  return (
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
  );
};

// App router with authentication gate
const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary font-body">
      <Routes>
        {/* Public form routes - always accessible */}
        <Route path="/f/:slug" element={<PublicForm />} />
        
        {/* Admin routes - require authentication */}
        <Route path="/forms/:formId/edit-content" element={
          isAuthenticated ? <FormContentEditor /> : <LoginPage />
        } />
        <Route path="/forms/:formId" element={
          isAuthenticated ? <DynamicForm /> : <LoginPage />
        } />
        
        {/* Main dashboard - require authentication */}
        <Route path="/" element={
          isAuthenticated ? <AuthenticatedApp /> : <LoginPage />
        } />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}

export default App;
