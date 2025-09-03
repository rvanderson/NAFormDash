import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClientOnboardingForm from './forms/ClientOnboardingForm';
import DynamicForm from './forms/DynamicForm';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface-secondary font-body">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <Dashboard />
            </>
          } />
          <Route path="/forms/client-onboarding" element={<ClientOnboardingForm />} />
          <Route path="/forms/:formId" element={<DynamicForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
