// Form Configuration System
// This file contains the configuration for each form including webhook URLs

export const FORM_CONFIGS = {
  'client-onboarding': {
    id: 'client-onboarding',
    name: 'Client Onboarding Form',
    description: 'Comprehensive client intake form for new projects',
    webhookUrl: 'https://n8n.ryananderson.ca/webhook-test/f008e33c-17ed-438a-9d9d-d8e8f2db37ab',
    settings: {
      enableFileUploads: true,
      enableWebhook: true,
      enableCSVExport: true,
      enableEmailNotifications: false
    }
  },
  'project-brief': {
    id: 'project-brief',
    name: 'Project Brief Template',
    description: 'Detailed project requirements and specifications',
    webhookUrl: null, // No webhook configured
    settings: {
      enableFileUploads: true,
      enableWebhook: false,
      enableCSVExport: true,
      enableEmailNotifications: false
    }
  },
  'design-feedback': {
    id: 'design-feedback',
    name: 'Design Feedback Survey',
    description: 'Collect client feedback on design iterations',
    webhookUrl: 'https://n8n.ryananderson.ca/webhook-test/f008e33c-17ed-438a-9d9d-d8e8f2db37ab',
    settings: {
      enableFileUploads: false,
      enableWebhook: true,
      enableCSVExport: true,
      enableEmailNotifications: true
    }
  }
};

// API Configuration
export const API_CONFIG = {
  baseURL: '/api',
  endpoints: {
    submitForm: (formId) => `/forms/${formId}/submit`,
    getSubmissions: (formId) => `/forms/${formId}/submissions`,
    testWebhook: '/webhook/test',
    health: '/health'
  }
};

// Helper function to get form config
export const getFormConfig = (formId) => {
  return FORM_CONFIGS[formId] || {
    id: formId,
    name: formId,
    description: 'Form configuration not found',
    webhookUrl: null,
    settings: {
      enableFileUploads: false,
      enableWebhook: false,
      enableCSVExport: true,
      enableEmailNotifications: false
    }
  };
};

// Helper function to get API URL
export const getAPIUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};