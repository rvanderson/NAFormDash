import React, { useState } from 'react';

const FormBuilderModal = ({ isOpen, onClose, onFormGenerated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Form name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Form description is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/forms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        onFormGenerated(result);
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to generate form');
      }
    } catch (error) {
      console.error('Form generation error:', error);
      setError(error.message || 'Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setFormData({ name: '', description: '', webhookUrl: '' });
      setError(null);
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="card-base max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 @sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-900">
                🤖 Create New Form with AI
              </h2>
              <p className="text-gray-600 mt-1">
                Describe your form and let GPT-5 generate it automatically
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-tertiary rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Form Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Customer Feedback Survey, Job Application Form"
                disabled={isGenerating}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Webhook URL <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                placeholder="https://your-webhook-endpoint.com/webhook"
                disabled={isGenerating}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to disable webhook notifications for this form
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Form Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                disabled={isGenerating}
                placeholder="Describe what information you want to collect. Be specific about:
• What type of form this is (survey, application, feedback, etc.)
• What questions you want to ask
• Any specific field types (multiple choice, file uploads, etc.)
• The target audience
• Any special requirements

Example: 'Create a customer satisfaction survey for our restaurant. Include questions about food quality, service speed, atmosphere, and overall experience. Use rating scales for most questions and include a comment box for additional feedback. Also ask for contact info if they want a follow-up.'"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Generation Status */}
            {isGenerating && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-700 font-medium">Generating your form...</p>
                    <p className="text-blue-600 text-sm">GPT-5 is analyzing your requirements and creating the perfect form structure.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={isGenerating}
                className="btn-secondary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !formData.name.trim() || !formData.description.trim()}
                className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Form
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Powered by GPT-5</h3>
                <p className="text-sm text-gray-600">
                  Our AI analyzes your description and automatically generates a professional form with appropriate question types, validation rules, and multi-step structure based on best practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderModal;