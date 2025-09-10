import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FormContentEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticatedFetch } = useAuth();
  const [form, setForm] = useState(null);
  const [jsonContent, setJsonContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('json');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}/definition`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.formConfig) {
            setForm(data.formConfig);
            setJsonContent(JSON.stringify(data.formDefinition, null, 2));
          } else {
            setError('Form not found');
          }
        } else {
          setError('Failed to load form');
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchForm();
    }
  }, [formId]);

  // Enhanced validation function
  const validateFormDefinition = (jsonString) => {
    let parsedJson;
    
    // 1. JSON Syntax Validation
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (e) {
      return {
        isValid: false,
        error: `Invalid JSON syntax: ${e.message.split(' at')[0]}`,
        details: 'Check for missing commas, quotes, or brackets.'
      };
    }

    // 2. SurveyJS Structure Validation
    const errors = [];
    
    // Required properties check
    if (!parsedJson.title || typeof parsedJson.title !== 'string') {
      errors.push('Missing or invalid "title" property (must be a non-empty string)');
    }
    
    if (!parsedJson.pages || !Array.isArray(parsedJson.pages)) {
      errors.push('Missing or invalid "pages" property (must be an array)');
    } else if (parsedJson.pages.length === 0) {
      errors.push('Form must have at least one page');
    } else {
      // Validate each page
      parsedJson.pages.forEach((page, pageIndex) => {
        if (!page.name || typeof page.name !== 'string') {
          errors.push(`Page ${pageIndex + 1}: Missing or invalid "name" property`);
        }
        
        if (!page.elements || !Array.isArray(page.elements)) {
          errors.push(`Page ${pageIndex + 1}: Missing or invalid "elements" property (must be an array)`);
        } else if (page.elements.length === 0) {
          errors.push(`Page ${pageIndex + 1}: Must have at least one element`);
        } else {
          // Validate each element
          page.elements.forEach((element, elementIndex) => {
            if (!element.type || typeof element.type !== 'string') {
              errors.push(`Page ${pageIndex + 1}, Element ${elementIndex + 1}: Missing or invalid "type" property`);
            }
            if (!element.name || typeof element.name !== 'string') {
              errors.push(`Page ${pageIndex + 1}, Element ${elementIndex + 1}: Missing or invalid "name" property`);
            }
          });
        }
      });
    }
    
    // Common optional properties validation
    if (parsedJson.description && typeof parsedJson.description !== 'string') {
      errors.push('Invalid "description" property (must be a string)');
    }
    
    if (parsedJson.completeText && typeof parsedJson.completeText !== 'string') {
      errors.push('Invalid "completeText" property (must be a string)');
    }

    if (parsedJson.checkErrorsMode && !['onNext', 'onComplete', 'onValueChanged'].includes(parsedJson.checkErrorsMode)) {
      errors.push('Invalid "checkErrorsMode" property (must be "onNext", "onComplete", or "onValueChanged")');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: 'Form structure validation failed',
        details: errors.join('\n• ')
      };
    }

    return {
      isValid: true,
      parsedJson
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Enhanced validation
      const validation = validateFormDefinition(jsonContent);
      if (!validation.isValid) {
        setError(`${validation.error}\n\n• ${validation.details}`);
        setSaving(false);
        return;
      }

      // Save to server
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL || ''}/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formDefinition: validation.parsedJson
        }),
      });

      if (response.ok) {
        const urlParams = new URLSearchParams(location.search);
        const returnTo = urlParams.get('returnTo');
        navigate(returnTo || '/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const urlParams = new URLSearchParams(location.search);
    const returnTo = urlParams.get('returnTo');
    navigate(returnTo || '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="btn-md btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Edit Form Content: {form?.name}
              </h1>
              <p className="text-gray-600">{form?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="btn-md btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-md btn-primary disabled:opacity-50"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('json')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'json'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                JSON Editor
              </button>
              {/* Future tabs will go here */}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'json' && (
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-1">Validation Error</h4>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">{error}</pre>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Definition JSON
                </label>
                <textarea
                  value={jsonContent}
                  onChange={(e) => {
                    setJsonContent(e.target.value);
                    // Clear error when user starts typing
                    if (error) {
                      setError('');
                    }
                  }}
                  className={`w-full h-96 p-4 border rounded-lg font-mono text-sm focus:ring-brand-500 focus:border-brand-500 ${
                    error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter form definition JSON..."
                />
              </div>
              
              <div className="text-xs text-gray-500">
                <p className="mb-2">
                  <strong>Tip:</strong> This JSON defines the structure and fields of your form.
                </p>
                <p>
                  Make sure to maintain valid JSON syntax. The editor will validate your changes before saving.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormContentEditor;