import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FormCard = ({ title, description, status, responses, date, path, isGenerated, generatedBy }) => {
  const navigate = useNavigate();

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
                🤖 AI Generated
              </span>
            )}
          </div>
          {path && (
            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
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

const Dashboard = () => {
  const [forms, setForms] = useState([
    // Keep the existing static form
    {
      title: 'Client Onboarding Form',
      description: 'Comprehensive client intake form for new projects',
      status: 'Published',
      responses: 127,
      date: 'Jan 14, 2024',
      path: '/forms/client-onboarding',
      isStatic: true
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeneratedForms = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/forms');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.forms) {
            const generatedForms = data.forms.map(form => ({
              title: form.name,
              description: form.description,
              status: 'Published',
              responses: form.submissionCount || 0,
              date: new Date(form.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              path: `/forms/${form.id}`,
              isGenerated: true,
              generatedBy: form.generatedBy
            }));
            
            // Combine static forms with generated forms
            setForms(currentForms => [
              ...currentForms.filter(f => f.isStatic),
              ...generatedForms
            ]);
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
          <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4 gap-6 @lg:gap-8">
            {forms.map((form, index) => (
              <FormCard key={index} {...form} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
