import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { FlatLight } from 'survey-core/themes';
import { FormSubmissionService } from '../services/formSubmissionService.js';

const PublicForm = () => {
  const { slug } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(false);

  // Load form definition by slug
  useEffect(() => {
    const loadForm = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check API health
        const healthy = await FormSubmissionService.checkAPIHealth();
        setApiHealthy(healthy);

        // Fetch form definition by slug
        const response = await fetch(`/api/forms/slug/${slug}`);
        
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

        // Check if form is public
        if (result.formConfig && !result.formConfig.isPublic) {
          throw new Error('Form is not publicly accessible');
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

    if (slug) {
      loadForm();
    }
  }, [slug]);

  // Handle form submission
  const handleComplete = async (sender) => {
    setIsSubmitting(true);

    try {
      const submissionService = new FormSubmissionService(formConfig.id);
      
      // Use the webhook URL from the form config if available
      if (formConfig?.webhookUrl) {
        submissionService.config.webhookUrl = formConfig.webhookUrl;
        submissionService.config.settings.enableWebhook = true;
      }

      const result = await submissionService.submitForm(sender.data, sender);
      
      if (result.success) {
        console.log("✅ Public form submitted successfully:", result);
        
        // Show success message
        sender.completedHtml = `
          <div style='text-align: center; padding: 3rem; background: #f0f9ff; border-radius: 16px; border: 1px solid #0ea5e9;'>
            <div style='font-size: 4rem; margin-bottom: 1.5rem;'>🎉</div>
            <h2 style='color: #0c4a6e; margin-bottom: 1.5rem; font-size: 2rem;'>Thank you!</h2>
            <p style='color: #075985; margin-bottom: 1.5rem; font-size: 1.1rem;'>${result.message}</p>
            <div style='background: white; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
              <strong style='color: #1e40af;'>Submission ID:</strong> 
              <span style='font-family: monospace; color: #64748b;'>${result.submissionId}</span>
            </div>
            <p style='color: #64748b; font-size: 1rem; line-height: 1.6;'>
              Your response has been recorded successfully.
              ${formConfig?.settings?.enableWebhook ? '<br>Our team has been automatically notified and will get back to you soon.' : ''}
            </p>
            <div style='margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;'>
              <p style='color: #64748b; font-size: 0.9rem; margin: 0; font-style: italic;'>
                ✨ This form was automatically generated
              </p>
            </div>
          </div>
        `;
      } else {
        // Show error message
        sender.completedHtml = `
          <div style='text-align: center; padding: 3rem; background: #fef2f2; border-radius: 16px; border: 1px solid #ef4444;'>
            <div style='font-size: 4rem; margin-bottom: 1.5rem;'>😔</div>
            <h2 style='color: #dc2626; margin-bottom: 1.5rem; font-size: 2rem;'>Oops! Something went wrong</h2>
            <p style='color: #991b1b; margin-bottom: 1.5rem; font-size: 1.1rem;'>${result.message}</p>
            <button 
              onclick='window.location.reload()' 
              style='background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500;'
            >
              Try Again
            </button>
          </div>
        `;
      }
    } catch (error) {
      console.error("❌ Public form submission error:", error);
      
      sender.completedHtml = `
        <div style='text-align: center; padding: 3rem; background: #fef2f2; border-radius: 16px; border: 1px solid #ef4444;'>
          <div style='font-size: 4rem; margin-bottom: 1.5rem;'>⚠️</div>
          <h2 style='color: #dc2626; margin-bottom: 1.5rem; font-size: 2rem;'>Connection Error</h2>
          <p style='color: #991b1b; margin-bottom: 1.5rem; font-size: 1.1rem;'>
            Unable to submit form. Please check your internet connection and try again.
          </p>
          <button 
            onclick='window.location.reload()' 
            style='background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500;'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600 mb-6 mx-auto"></div>
          <p className="text-gray-700 text-lg">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAccessDenied = error === 'Form is not publicly accessible';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <div className="text-8xl mb-6">{isAccessDenied ? '🔒' : '🚫'}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isAccessDenied ? 'Access Denied' : 'Form Not Found'}
            </h1>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <p className="text-gray-500 text-sm">
              {isAccessDenied 
                ? 'This form is currently private and not available for public access. Please contact the form owner to request access.'
                : 'Please check the URL or contact the form owner for assistance.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Simple Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {formConfig?.name || 'Survey Form'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {formConfig?.description || 'Please complete the form below'}
            </p>
            {!apiHealthy && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
                ⚠️ Offline Mode - Submissions may not be processed immediately
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-100 to-transparent rounded-bl-full opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-transparent rounded-tr-full opacity-50"></div>
          
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-brand-600 mb-6"></div>
                <p className="text-brand-600 font-semibold text-lg">Submitting your form...</p>
                <p className="text-gray-500 text-sm mt-2">Please don't close this window</p>
              </div>
            </div>
          )}
          
          {formConfig && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Auto-Generated Form</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This form was automatically created on {new Date(formConfig.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}.
                    {formConfig.settings.enableWebhook && ' Your responses will be automatically processed.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {survey && <Survey model={survey} onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
};

export default PublicForm;