import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { FlatLight } from 'survey-core/themes';
import { FormSubmissionService } from '../services/formSubmissionService.js';

const DynamicForm = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [formConfig, setFormConfig] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(false);

  // Load form definition and create survey
  useEffect(() => {
    const loadForm = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check API health
        const healthy = await FormSubmissionService.checkAPIHealth();
        setApiHealthy(healthy);

        // Fetch form definition
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}/definition`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Form not found');
          }
          throw new Error(`Failed to load form: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load form');
        }

        setFormConfig(result.formConfig);
        
        // Create Survey model
        const surveyModel = new Model(result.formDefinition);
        
        // Apply SurveyJS flat-light theme with Inter font and brand colors
        surveyModel.applyTheme({
          ...FlatLight,
          cssVariables: {
            ...FlatLight.cssVariables,
            // Fix font - SurveyJS uses these variables
            "--sjs-font-family": "Inter, system-ui, sans-serif",
            "--font-family": "Inter, system-ui, sans-serif",
            "--sjs-general-font-family": "Inter, system-ui, sans-serif",
            // Override green with brand blue
            "--sjs-primary-backcolor": "oklch(0.35 0.12 240)", // brand-600
            "--sjs-primary-backcolor-light": "oklch(0.45 0.1 240)", // brand-500  
            "--sjs-primary-backcolor-dark": "oklch(0.25 0.14 240)", // brand-700
            "--sjs-primary-forecolor": "white"
          }
        });

        setSurvey(surveyModel);

      } catch (error) {
        console.error('Form loading error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (formId) {
      loadForm();
    }
  }, [formId]);

  // Handle form submission
  const handleComplete = async (sender) => {
    setIsSubmitting(true);

    try {
      const submissionService = new FormSubmissionService(formId);
      
      // Use the webhook URL from the form config if available
      if (formConfig?.webhookUrl) {
        submissionService.config.webhookUrl = formConfig.webhookUrl;
        submissionService.config.settings.enableWebhook = true;
      }

      const result = await submissionService.submitForm(sender.data, sender);
      
      if (result.success) {
        console.log("✅ Generated form submitted successfully:", result);
        
        // Show success message
        sender.completedHtml = `
          <div style='text-align: center; padding: 2rem; background: #f0f9ff; border-radius: 12px; border: 1px solid #0ea5e9;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>🎉</div>
            <h3 style='color: #0c4a6e; margin-bottom: 1rem;'>Thank you!</h3>
            <p style='color: #075985; margin-bottom: 1rem;'>${result.message}</p>
            <div style='background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
              <strong>Submission ID:</strong> ${result.submissionId}
            </div>
            <p style='color: #64748b; font-size: 0.9rem;'>
              Your response has been recorded.
              ${formConfig?.settings?.enableWebhook ? ' Our team has been automatically notified.' : ''}
            </p>
            <div style='margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;'>
              <p style='color: #4b5563; font-size: 0.8rem; margin: 0;'>
                ✨ This form was automatically generated
              </p>
            </div>
          </div>
        `;
      } else {
        // Show error message
        sender.completedHtml = `
          <div style='text-align: center; padding: 2rem; background: #fef2f2; border-radius: 12px; border: 1px solid #ef4444;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>😔</div>
            <h3 style='color: #dc2626; margin-bottom: 1rem;'>Oops! Something went wrong</h3>
            <p style='color: #991b1b; margin-bottom: 1rem;'>${result.message}</p>
            <button 
              onclick='window.location.reload()' 
              style='background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;'
            >
              Try Again
            </button>
          </div>
        `;
      }
    } catch (error) {
      console.error("❌ Form submission error:", error);
      
      sender.completedHtml = `
        <div style='text-align: center; padding: 2rem; background: #fef2f2; border-radius: 12px; border: 1px solid #ef4444;'>
          <div style='font-size: 3rem; margin-bottom: 1rem;'>⚠️</div>
          <h3 style='color: #dc2626; margin-bottom: 1rem;'>Connection Error</h3>
          <p style='color: #991b1b; margin-bottom: 1rem;'>
            Unable to submit form. Please check your internet connection and try again.
          </p>
          <button 
            onclick='window.location.reload()' 
            style='background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;'
          >
            Try Again
          </button>
        </div>
      `;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="card-base p-8">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="@container max-w-7xl mx-auto">
          <div className="px-6 py-4 @lg:px-8 @xl:px-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()}
                  className="p-2 @sm:p-3 text-gray-400 hover:text-brand-600 hover:bg-surface-tertiary rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl @sm:text-2xl font-display font-semibold text-gray-900">
                    {formConfig?.name || 'Generated Form'}
                  </h1>
                  <p className="text-gray-600 text-sm @sm:text-base">
                    {formConfig?.description || 'Generated form'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!apiHealthy && (
                  <span className="status-badge border bg-warning-50 text-warning-700 border-warning-500/20" title="API server not running">
                    ⚠️ Offline Mode
                  </span>
                )}
                <span className="status-badge border bg-success-50 text-success-700 border-success-500/20">
                  Published
                </span>
                <button 
                  onClick={() => navigate(`/?edit=${formId}`)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-50 text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Container */}
      <div className="@container max-w-5xl mx-auto px-6 py-8 @lg:px-8 @xl:px-12">
        <div className="card-base p-6 @sm:p-8 @lg:p-12 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
                <p className="text-brand-600 font-medium">Submitting your form...</p>
                <p className="text-gray-500 text-sm mt-1">Please don't close this window</p>
              </div>
            </div>
          )}
          
          {survey && <Survey model={survey} onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
};

export default DynamicForm;