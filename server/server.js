import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import createCsvWriter from 'csv-writer';
import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client (gracefully handle missing API key)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.warn('⚠️  OPENAI_API_KEY not found. Form generation will be unavailable.');
}

// Middleware
// Allow requests from any origin in development (Vite proxy will handle requests)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const formId = req.body.formId || 'unknown';
    const uploadsDir = path.join(__dirname, 'submissions', formId, 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Utility function to ensure directory exists
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

// Generate form documentation in Markdown
async function generateFormDocs(formId, formData, submissionData) {
  const formDir = path.join(__dirname, 'submissions', formId);
  await ensureDirectory(formDir);

  // Create .md file with form structure
  const mdContent = `# ${formData.title || formId}

${formData.description || 'No description provided'}

## Form Structure

${formData.pages ? formData.pages.map(page => `
### ${page.title || page.name}

${page.elements ? page.elements.map(element => `
- **${element.title || element.name}** (${element.type})
  ${element.isRequired ? '*(Required)*' : ''}
  ${element.placeholder ? `Placeholder: "${element.placeholder}"` : ''}
  ${element.choices ? `Options: ${element.choices.join(', ')}` : ''}
`).join('') : ''}
`).join('') : ''}

## Latest Submission

**Submitted:** ${new Date().toISOString()}

### Responses

${Object.entries(submissionData).map(([key, value]) => `
- **${key}:** ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
`).join('')}

---
*Generated automatically by NAFormDashboard*
`;

  await fs.writeFile(path.join(formDir, 'form-structure.md'), mdContent);
}

// Generate form JSON
async function generateFormJSON(formId, formData) {
  const formDir = path.join(__dirname, 'submissions', formId);
  await ensureDirectory(formDir);
  
  await fs.writeFile(
    path.join(formDir, 'form-definition.json'), 
    JSON.stringify(formData, null, 2)
  );
}

// Update CSV with submission data
async function updateCSV(formId, submissionData) {
  const formDir = path.join(__dirname, 'submissions', formId);
  const csvPath = path.join(formDir, 'responses.csv');
  
  await ensureDirectory(formDir);
  
  // Add metadata to submission
  const enrichedData = {
    submission_id: `${formId}_${Date.now()}`,
    submitted_at: new Date().toISOString(),
    ...submissionData
  };
  
  // Check if CSV exists to determine if we need headers
  let csvExists = false;
  try {
    await fs.access(csvPath);
    csvExists = true;
  } catch (error) {
    csvExists = false;
  }
  
  // Get all possible headers (for dynamic forms)
  const headers = Object.keys(enrichedData).map(key => ({
    id: key,
    title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
  
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: csvPath,
    header: headers,
    append: csvExists
  });
  
  await csvWriter.writeRecords([enrichedData]);
  console.log(`✅ CSV updated for form ${formId}`);
}

// Send webhook notification
async function sendWebhook(webhookUrl, formId, submissionData) {
  if (!webhookUrl) {
    console.log('No webhook URL configured for form:', formId);
    return;
  }
  
  try {
    const payload = {
      formId,
      submissionId: `${formId}_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      data: submissionData,
      source: 'NAFormDashboard'
    };
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NAFormDashboard/1.0'
      },
      timeout: 10000
    });
    
    console.log(`✅ Webhook sent successfully for form ${formId}:`, response.status);
  } catch (error) {
    console.error(`❌ Webhook failed for form ${formId}:`, error.message);
  }
}

// Generate form using GPT-5 API
app.post('/api/forms/generate', async (req, res) => {
  try {
    const { name, description, webhookUrl } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Form name and description are required'
      });
    }

    // Check if OpenAI client is available
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'Form generation is currently unavailable. OpenAI API key is not configured.',
        details: 'Please set the OPENAI_API_KEY environment variable to enable AI form generation.'
      });
    }

    console.log(`🤖 Generating form "${name}" using GPT-4o...`);

    // Create a comprehensive prompt for GPT-4o
    const systemPrompt = `You are an expert form builder AI that creates professional SurveyJS form configurations. 

Your task is to generate a complete SurveyJS form definition based on the user's description. The form should:

1. Follow SurveyJS best practices and modern survey design principles
2. Include appropriate question types for the use case
3. Have logical page breaks for multi-step forms when appropriate
4. Include proper validation rules
5. Use professional, clear question text
6. Include helpful placeholder text
7. Group related questions logically

Available SurveyJS question types:
- text: Simple text input
- comment: Multi-line text area  
- dropdown: Single selection dropdown
- checkbox: Multiple selection checkboxes
- radiogroup: Single selection radio buttons
- rating: Rating scale (1-5, 1-10, etc.)
- ranking: Rank items in order
- boolean: Yes/No or True/False
- email: Email input with validation
- file: File upload
- html: Display HTML content
- matrix: Grid of questions
- matrixdynamic: Dynamic matrix with add/remove rows
- paneldynamic: Repeating panel of questions

Form structure should include:
- title and description
- checkErrorsMode: "onNext" or "onComplete"
- showProgressBar: "top" for multi-page forms
- progressBarType: "buttons" 
- showQuestionNumbers: "off" for cleaner look
- pages array with elements
- completeText: "Submit Form"

Example response format:
{
  "title": "Form Title",
  "description": "Form description", 
  "checkErrorsMode": "onNext",
  "pages": [
    {
      "name": "page1",
      "title": "Page Title",
      "elements": [
        {
          "type": "text",
          "name": "fieldName",
          "title": "Question text",
          "isRequired": true,
          "placeholder": "Placeholder text"
        }
      ]
    }
  ],
  "showProgressBar": "top",
  "progressBarType": "buttons", 
  "showQuestionNumbers": "off",
  "completeText": "Submit Form"
}

Return ONLY the JSON object, no additional text or explanation.`;

    const userPrompt = `Create a professional form for: "${name}"

Description: ${description}

Generate a complete SurveyJS form definition that captures all the necessary information based on this description. Make it user-friendly, logical, and comprehensive.`;

    // Call GPT-5 API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o as GPT-5 may not be available yet
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
    });

    const gptResponse = completion.choices[0].message.content.trim();
    console.log('🤖 GPT-4o raw response:', gptResponse);

    // Parse the JSON response
    let formDefinition;
    try {
      // Remove any markdown code blocks if present
      const jsonContent = gptResponse.replace(/```json\n?|\n?```/g, '').trim();
      formDefinition = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ Failed to parse GPT-5 JSON response:', parseError);
      throw new Error('GPT-5 returned invalid JSON format');
    }

    // Validate the form definition has required fields
    if (!formDefinition.title || !formDefinition.pages) {
      throw new Error('Generated form is missing required fields (title or pages)');
    }

    // Create a form ID from the name
    const formId = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Create a URL slug (similar to formId but potentially different)
    const urlSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Create form configuration
    const formConfig = {
      id: formId,
      name: name,
      description: description,
      urlSlug: urlSlug,
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString(),
      generatedBy: 'GPT-4o',
      formDefinition: formDefinition,
      settings: {
        enableWebhook: !!webhookUrl,
        enableFileUploads: true,
        enableCSVExport: true
      }
    };

    // Save to the consolidated forms directory
    const formsDir = path.join(__dirname, 'forms');
    await ensureDirectory(formsDir);
    await fs.writeFile(
      path.join(formsDir, `${formId}.json`),
      JSON.stringify(formConfig, null, 2)
    );

    // Create the submission directory structure
    const submissionsDir = path.join(__dirname, 'submissions');
    const formSubmissionDir = path.join(submissionsDir, formId);
    await ensureDirectory(formSubmissionDir);

    // Create basic CSV structure file (empty, ready for submissions)
    const csvHeaders = ['Submission ID', 'Timestamp', 'Full Name', 'Email'];
    const csvPath = path.join(formSubmissionDir, 'responses.csv');
    await fs.writeFile(csvPath, csvHeaders.join(',') + '\n');
    
    // Create form structure markdown file
    const mdContent = `# ${name}\n\n${description}\n\n## Generated by AI\n\nThis form was automatically generated using GPT-4o on ${new Date().toLocaleDateString()}.\n\n**Form ID:** ${formId}\n**Webhook:** ${webhookUrl || 'None'}\n`;
    await fs.writeFile(path.join(formSubmissionDir, 'form-structure.md'), mdContent);

    console.log(`✅ Form "${name}" generated successfully with ID: ${formId}`);

    res.json({
      success: true,
      formId: formId,
      formName: name,
      formDefinition: formDefinition,
      message: 'Form generated successfully by GPT-5',
      config: formConfig
    });

  } catch (error) {
    console.error('❌ Form generation error:', error);
    
    // Provide specific error messages for different scenarios
    let errorMessage = 'Failed to generate form';
    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API key not configured';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'AI generated invalid form structure';
    } else if (error.message.includes('GPT-5')) {
      errorMessage = 'AI model temporarily unavailable';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Main form submission endpoint
app.post('/api/forms/:formId/submit', upload.any(), async (req, res) => {
  try {
    const { formId } = req.params;
    const { formDefinition, webhookUrl, ...submissionData } = req.body;
    
    console.log(`📝 Processing submission for form: ${formId}`);
    
    // Parse form definition if it's a string
    let formData = {};
    if (formDefinition) {
      try {
        formData = typeof formDefinition === 'string' 
          ? JSON.parse(formDefinition) 
          : formDefinition;
      } catch (error) {
        console.error('Error parsing form definition:', error);
      }
    }
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        submissionData[file.fieldname] = {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        };
      });
    }
    
    // Generate documentation files
    await Promise.all([
      generateFormDocs(formId, formData, submissionData),
      updateCSV(formId, submissionData)
    ]);
    
    // Send webhook if configured
    if (webhookUrl) {
      await sendWebhook(webhookUrl, formId, submissionData);
    }
    
    res.json({ 
      success: true, 
      message: 'Form submitted successfully',
      submissionId: `${formId}_${Date.now()}`,
      filesUploaded: req.files?.length || 0
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Form submission failed',
      error: error.message 
    });
  }
});

// Get form submissions
app.get('/api/forms/:formId/submissions', async (req, res) => {
  try {
    const { formId } = req.params;
    const csvPath = path.join(__dirname, 'submissions', formId, 'responses.csv');
    
    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      res.json({
        success: true,
        totalSubmissions: Math.max(0, lines.length - 1), // Subtract header row
        lastSubmission: lines.length > 1 ? lines[lines.length - 1] : null,
        csvPath
      });
    } catch (error) {
      res.json({
        success: true,
        totalSubmissions: 0,
        message: 'No submissions yet'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download CSV responses for a form
app.get('/api/forms/:formId/submissions/csv', async (req, res) => {
  try {
    const { formId } = req.params;
    const csvPath = path.join(__dirname, 'submissions', formId, 'responses.csv');
    
    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${formId}-responses.csv"`);
      
      res.send(csvContent);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'No responses found for this form'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'NAFormDashboard API'
  });
});

// Get all forms and their submission counts
app.get('/api/forms', async (req, res) => {
  try {
    const formsDir = path.join(__dirname, 'forms');
    const submissionsDir = path.join(__dirname, 'submissions');

    try {
      const formFiles = await fs.readdir(formsDir);
      const forms = await Promise.all(
        formFiles
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            try {
              // Read form configuration from the single source of truth
              const formPath = path.join(formsDir, file);
              const formContent = await fs.readFile(formPath, 'utf-8');
              const config = JSON.parse(formContent);

              // Count submissions from the submissions directory
              const csvPath = path.join(submissionsDir, config.id, 'responses.csv');
              let submissionCount = 0;
              try {
                const csvContent = await fs.readFile(csvPath, 'utf-8');
                const lines = csvContent.split('\n').filter(line => line.trim());
                submissionCount = Math.max(0, lines.length - 1);
              } catch (error) {
                submissionCount = 0; // No submissions file found
              }

              return {
                id: config.id,
                name: config.name,
                description: config.description,
                createdAt: config.createdAt,
                generatedBy: config.generatedBy,
                webhookUrl: config.webhookUrl,
                submissionCount,
                settings: config.settings
              };
            } catch (error) {
              console.error(`Error processing form file ${file}:`, error);
              return null; // Skip invalid form files
            }
          })
      );

      const validForms = forms.filter(form => form !== null);
      res.json({ success: true, forms: validForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    } catch (error) {
      // This error occurs if the 'forms' directory doesn't exist
      res.json({ success: true, forms: [] });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get form definition by ID
app.get('/api/forms/:formId/definition', async (req, res) => {
  try {
    const { formId } = req.params;
    const formsDir = path.join(__dirname, 'forms'); // Use the new consolidated directory
    const formPath = path.join(formsDir, `${formId}.json`);
    
    try {
      const formConfigContent = await fs.readFile(formPath, 'utf-8');
      const formConfig = JSON.parse(formConfigContent);
      
      res.json({
        success: true,
        formConfig: formConfig,
        formDefinition: formConfig.formDefinition
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Form not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get form definition by URL slug (for public forms)
app.get('/api/forms/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const formsDir = path.join(__dirname, 'forms');
    
    // Read all form files to find matching slug
    try {
      const files = await fs.readdir(formsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let matchingForm = null;
      
      for (const file of jsonFiles) {
        const formPath = path.join(formsDir, file);
        const formConfigContent = await fs.readFile(formPath, 'utf-8');
        const formConfig = JSON.parse(formConfigContent);
        
        if (formConfig.urlSlug === slug) {
          matchingForm = formConfig;
          break;
        }
      }
      
      if (!matchingForm) {
        return res.status(404).json({
          success: false,
          error: 'Form not found'
        });
      }
      
      // Check if form is public
      if (!matchingForm.isPublic) {
        return res.status(403).json({
          success: false,
          error: 'Form is not publicly accessible'
        });
      }
      
      res.json({
        success: true,
        formConfig: matchingForm,
        formDefinition: matchingForm.formDefinition
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error reading forms directory'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Webhook test endpoint
app.post('/api/webhook/test', async (req, res) => {
  const { webhookUrl, testData } = req.body;
  
  try {
    const payload = {
      test: true,
      timestamp: new Date().toISOString(),
      data: testData || { message: 'Test webhook from NAFormDashboard' },
      source: 'NAFormDashboard-Test'
    };
    
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    res.json({
      success: true,
      status: response.status,
      message: 'Webhook test successful'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NAFormDashboard API Server running on port ${PORT}`);
  console.log(`📁 Submissions will be stored in: ${path.join(__dirname, 'submissions')}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});