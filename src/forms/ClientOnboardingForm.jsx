import React, { useState, useEffect } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { FormSubmissionService } from '../services/formSubmissionService.js';

const ClientOnboardingForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [apiHealthy, setApiHealthy] = useState(false);

  // Form configuration
  const FORM_ID = 'client-onboarding';
  
  // Check API health on component mount
  useEffect(() => {
    const checkAPI = async () => {
      const healthy = await FormSubmissionService.checkAPIHealth();
      setApiHealthy(healthy);
      if (!healthy) {
        console.warn('⚠️ API server is not running. Start it with: cd server && npm run dev');
      }
    };
    checkAPI();
  }, []);
  const surveyJson = {
    title: "Client Onboarding Form",
    description: "Comprehensive client intake form for new projects",
    checkErrorsMode: "onNext",
    pages: [
      {
        name: "clientInfo",
        title: "Client Information",
        elements: [
          {
            type: "text",
            name: "companyName",
            title: "Company Name",
            isRequired: true,
            placeholder: "Enter your company name"
          },
          {
            type: "text",
            name: "contactName",
            title: "Primary Contact Name",
            isRequired: true,
            placeholder: "Enter primary contact name"
          },
          {
            type: "email",
            name: "email",
            title: "Email Address",
            isRequired: true,
            placeholder: "Enter email address"
          },
          {
            type: "text",
            name: "phone",
            title: "Phone Number",
            isRequired: true,
            placeholder: "Enter phone number"
          },
          {
            type: "text",
            name: "website",
            title: "Website URL",
            placeholder: "Enter website URL (optional)"
          }
        ]
      },
      {
        name: "projectDetails",
        title: "Project Details",
        elements: [
          {
            type: "dropdown",
            name: "projectType",
            title: "Project Type",
            isRequired: true,
            choices: [
              "Website Design",
              "Brand Identity",
              "Marketing Materials",
              "Mobile App Design",
              "UI/UX Design",
              "Other"
            ]
          },
          {
            type: "text",
            name: "projectTitle",
            title: "Project Title",
            isRequired: true,
            placeholder: "Brief project title"
          },
          {
            type: "comment",
            name: "projectDescription",
            title: "Project Description",
            isRequired: true,
            placeholder: "Describe your project in detail..."
          },
          {
            type: "dropdown",
            name: "budget",
            title: "Budget Range",
            isRequired: true,
            choices: [
              "Under $5,000",
              "$5,000 - $10,000",
              "$10,000 - $25,000",
              "$25,000 - $50,000",
              "$50,000+",
              "To be discussed"
            ]
          },
          {
            type: "text",
            name: "timeline",
            title: "Desired Timeline",
            isRequired: true,
            placeholder: "e.g., 6-8 weeks, by end of March"
          }
        ]
      },
      {
        name: "requirements",
        title: "Requirements & Preferences",
        elements: [
          {
            type: "checkbox",
            name: "services",
            title: "Services Needed",
            isRequired: true,
            choices: [
              "Strategy & Planning",
              "User Research",
              "Wireframing",
              "Visual Design",
              "Prototyping",
              "Development",
              "Content Creation",
              "SEO Optimization"
            ]
          },
          {
            type: "comment",
            name: "designPreferences",
            title: "Design Preferences",
            placeholder: "Describe your style preferences, colors, inspiration..."
          },
          {
            type: "comment",
            name: "targetAudience",
            title: "Target Audience",
            placeholder: "Describe your target audience..."
          },
          {
            type: "text",
            name: "competitors",
            title: "Key Competitors",
            placeholder: "List 2-3 main competitors"
          }
        ]
      },
      {
        name: "additional",
        title: "Additional Information",
        elements: [
          {
            type: "boolean",
            name: "hasExistingBrand",
            title: "Do you have existing brand guidelines?",
            isRequired: true
          },
          {
            type: "file",
            name: "brandAssets",
            title: "Upload Brand Assets (if available)",
            visibleIf: "{hasExistingBrand} = true",
            acceptedTypes: ".pdf,.jpg,.jpeg,.png,.zip",
            maxSize: 10485760
          },
          {
            type: "comment",
            name: "additionalNotes",
            title: "Additional Notes or Requirements",
            placeholder: "Any other information you'd like us to know..."
          },
          {
            type: "dropdown",
            name: "howDidYouHear",
            title: "How did you hear about us?",
            choices: [
              "Google Search",
              "Social Media",
              "Referral",
              "Previous Client",
              "Industry Event",
              "Other"
            ]
          }
        ]
      }
    ],
    showProgressBar: "top",
    progressBarType: "buttons",
    showQuestionNumbers: "off",
    completeText: "Submit Form"
  };

  const survey = new Model(surveyJson);

  // Custom CSS theme to match our design system
  survey.applyTheme({
    "cssVariables": {
      "--sjs-general-backcolor": "oklch(1.0 0 0)",
      "--sjs-general-backcolor-dark": "oklch(0.975 0.01 240)", 
      "--sjs-general-backcolor-dim": "oklch(0.99 0.005 240)",
      "--sjs-general-forecolor": "rgba(17, 24, 39, 1)",
      "--sjs-general-forecolor-light": "rgba(107, 114, 128, 1)",
      "--sjs-general-dim-forecolor": "rgba(156, 163, 175, 1)",
      "--sjs-primary-backcolor": "oklch(0.35 0.12 240)",
      "--sjs-primary-forecolor": "rgba(255, 255, 255, 1)",
      "--sjs-base-unit": "8px",
      "--sjs-corner-radius": "12px",
      "--sjs-secondary-backcolor": "oklch(1.0 0 0)",
      "--sjs-secondary-backcolor-light": "oklch(0.99 0.005 240)",
      "--sjs-secondary-backcolor-semi-light": "oklch(0.975 0.01 240)",
      "--sjs-secondary-forecolor": "rgba(17, 24, 39, 1)",
      "--sjs-shadow-small": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "--sjs-shadow-medium": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      "--sjs-border-default": "oklch(0.9 0.015 240)",
      "--sjs-border-light": "oklch(0.95 0.01 240)"
    }
  });

  const onComplete = async (sender) => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const submissionService = new FormSubmissionService(FORM_ID);
      const result = await submissionService.submitForm(sender.data, sender);
      
      setSubmissionResult(result);
      
      if (result.success) {
        console.log("✅ Form submitted successfully:", result);
        
        // Show success message in the survey
        sender.completedHtml = `
          <div style='text-align: center; padding: 2rem; background: #f0f9ff; border-radius: 12px; border: 1px solid #0ea5e9;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>🎉</div>
            <h3 style='color: #0c4a6e; margin-bottom: 1rem;'>Thank you!</h3>
            <p style='color: #075985; margin-bottom: 1rem;'>${result.message}</p>
            <div style='background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
              <strong>Submission ID:</strong> ${result.submissionId}
            </div>
            <p style='color: #64748b; font-size: 0.9rem;'>
              We'll review your information and get back to you within 24 hours.
              ${submissionService.config.settings.enableWebhook ? ' Our team has been automatically notified.' : ''}
            </p>
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
      setSubmissionResult({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      });
      
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
                  <h1 className="text-xl @sm:text-2xl font-display font-semibold text-gray-900">Client Onboarding Form</h1>
                  <p className="text-gray-600 text-sm @sm:text-base">Comprehensive client intake form for new projects</p>
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
          <Survey model={survey} onComplete={onComplete} />
        </div>
      </div>
    </div>
  );
};

export default ClientOnboardingForm;
