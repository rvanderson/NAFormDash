// Form Submission Service
import { getFormConfig, getAPIUrl, API_CONFIG } from '../config/formConfigs.js';
import logger from '../utils/logger.js';

export class FormSubmissionService {
  constructor(formId) {
    this.formId = formId;
    this.config = getFormConfig(formId);
  }

  // Submit form data with files and webhook
  async submitForm(formData, surveyModel) {
    try {
      logger.info('📤 Submitting form:', this.formId, formData);

      // Prepare submission data
      const submissionData = new FormData();
      
      // Add form metadata
      submissionData.append('formDefinition', JSON.stringify(surveyModel.toJSON()));
      submissionData.append('formId', this.formId);
      
      // Add webhook URL if enabled
      if (this.config.settings.enableWebhook && this.config.webhookUrl) {
        submissionData.append('webhookUrl', this.config.webhookUrl);
      }

      // Add form responses
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Handle file uploads
          if (value instanceof File || value instanceof FileList) {
            if (value instanceof FileList) {
              Array.from(value).forEach((file, index) => {
                submissionData.append(`${key}_${index}`, file);
              });
            } else {
              submissionData.append(key, value);
            }
          } else {
            // Handle regular form data
            submissionData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
          }
        }
      });

      // Submit to API
      const response = await fetch(getAPIUrl(API_CONFIG.endpoints.submitForm(this.formId)), {
        method: 'POST',
        body: submissionData
      });

      const result = await response.json();

      if (result.success) {
        logger.info('✅ Form submitted successfully:', result);
        return {
          success: true,
          submissionId: result.submissionId,
          message: 'Thank you! Your form has been submitted successfully.',
          details: result
        };
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      console.error('❌ Form submission error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error submitting your form. Please try again.',
        error: error.message
      };
    }
  }

  // Get submission statistics
  async getSubmissionStats() {
    try {
      const response = await fetch(getAPIUrl(API_CONFIG.endpoints.getSubmissions(this.formId)));
      const result = await response.json();
      
      return result.success ? result : { totalSubmissions: 0 };
    } catch (error) {
      console.error('Error getting submission stats:', error);
      return { totalSubmissions: 0 };
    }
  }

  // Test webhook
  async testWebhook(testData = {}) {
    if (!this.config.webhookUrl) {
      return { success: false, message: 'No webhook URL configured' };
    }

    try {
      const response = await fetch(getAPIUrl(API_CONFIG.endpoints.testWebhook), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl: this.config.webhookUrl,
          testData: {
            formId: this.formId,
            formName: this.config.name,
            ...testData
          }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Webhook test error:', error);
      return { 
        success: false, 
        message: 'Webhook test failed',
        error: error.message 
      };
    }
  }

  // Check API health
  static async checkAPIHealth() {
    try {
      const response = await fetch(getAPIUrl(API_CONFIG.endpoints.health));
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export utility functions
export const createSubmissionService = (formId) => new FormSubmissionService(formId);

export const submitForm = async (formId, formData, surveyModel) => {
  const service = new FormSubmissionService(formId);
  return await service.submitForm(formData, surveyModel);
};

export const getFormSubmissionStats = async (formId) => {
  const service = new FormSubmissionService(formId);
  return await service.getSubmissionStats();
};