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
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import validator from 'validator';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Data persistence configuration for Railway
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const FORMS_DIR = path.join(DATA_DIR, 'forms');
const SUBMISSIONS_DIR = path.join(DATA_DIR, 'submissions');

// Ensure data directories exist on startup
async function initializeDataDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(FORMS_DIR, { recursive: true });
    await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
    console.log('📁 Data directories initialized:', { DATA_DIR, FORMS_DIR, SUBMISSIONS_DIR });
  } catch (error) {
    console.error('❌ Failed to initialize data directories:', error);
    process.exit(1);
  }
}

// Initialize on startup
initializeDataDirectories();
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow form embedding
}));

// Configure CORS with proper security settings
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://dashboard.northernarmy.com'])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit AI generation to 5 per hour
  message: { error: 'AI generation rate limit exceeded. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit webhook tests to 10 per 5 minutes
  message: { error: 'Webhook test rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware (basic implementation for admin endpoints)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no JWT_SECRET is set, allow access (development mode)
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set. Authentication disabled for development.');
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Input validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Utility function to sanitize form ID to prevent path traversal
function sanitizeFormId(formId) {
  if (!formId || typeof formId !== 'string') {
    return 'unknown';
  }
  return formId.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50) || 'unknown';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const formId = sanitizeFormId(req.body.formId);
    const uploadsDir = path.join(SUBMISSIONS_DIR, formId, 'uploads');
    
    // Verify path is within expected directory to prevent path traversal
    const resolvedPath = path.resolve(uploadsDir);
    const basePath = path.resolve(SUBMISSIONS_DIR);
    if (!resolvedPath.startsWith(basePath)) {
      return cb(new Error('Invalid path detected'), false);
    }
    
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Whitelist allowed MIME types
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
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
  const formDir = path.join(SUBMISSIONS_DIR, formId);
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
  const formDir = path.join(SUBMISSIONS_DIR, formId);
  await ensureDirectory(formDir);
  
  await fs.writeFile(
    path.join(formDir, 'form-definition.json'), 
    JSON.stringify(formData, null, 2)
  );
}

// Update CSV with submission data
async function updateCSV(formId, submissionData) {
  const formDir = path.join(SUBMISSIONS_DIR, formId);
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

// Validate webhook URL to prevent SSRF attacks
function validateWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Block private IP ranges and localhost
    const hostname = parsed.hostname.toLowerCase();
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^127\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
      /^localhost$/i
    ];
    
    if (privateRanges.some(range => range.test(hostname)) || 
        hostname === 'localhost' || hostname === '0.0.0.0') {
      throw new Error('Private IP addresses and localhost not allowed');
    }
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }
    
    // Require HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw new Error('HTTPS required in production');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Invalid webhook URL: ${error.message}`);
  }
}

// Send webhook notification
async function sendWebhook(webhookUrl, formId, submissionData) {
  if (!webhookUrl) {
    console.log('No webhook URL configured for form:', formId);
    return;
  }
  
  try {
    // Validate webhook URL to prevent SSRF
    validateWebhookUrl(webhookUrl);
    
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
      timeout: 10000,
      maxRedirects: 3 // Limit redirects to prevent redirect loops
    });
    
    console.log(`✅ Webhook sent successfully for form ${formId}:`, response.status);
  } catch (error) {
    console.error(`❌ Webhook failed for form ${formId}:`, error.message);
  }
}

// Generate form using GPT-5 API
app.post('/api/forms/generate', strictLimiter, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Form name required (1-100 characters)'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description required (1-1000 characters)'),
  body('webhookUrl').optional().isURL().withMessage('Invalid webhook URL')
], handleValidationErrors, async (req, res) => {
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
8. Generate a professional, concise description that describes what the form collects

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
- title and description (generate a professional description, don't copy user input)
- checkErrorsMode: "onNext" for multi-page forms, "onComplete" for single-page forms
- showProgressBar: "top" for multi-page forms, "false" for single-page forms
- progressBarType: "buttons" for multi-page forms
- showQuestionNumbers: "off" for cleaner look
- pages array with elements
- completeText: "Submit Form"

Example response format:
{
  "title": "Form Title",
  "description": "A professional description of what this form collects", 
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

    // Post-process the form definition to ensure single-page forms don't show progress bar
    if (formDefinition.pages.length === 1) {
      formDefinition.showProgressBar = false;
      // Remove progressBarType if only one page
      delete formDefinition.progressBarType;
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

    // Create form configuration using AI-generated description
    const formConfig = {
      id: formId,
      name: name,
      description: formDefinition.description || description, // Use AI-generated description if available
      urlSlug: urlSlug,
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString(),
      generatedBy: 'GPT-4o',
      formDefinition: formDefinition,
      status: 'Internal', // Default to Internal status
      tags: [], // Default empty tags
      isPublic: false, // Default to private
      settings: {
        enableWebhook: !!webhookUrl,
        enableFileUploads: true,
        enableCSVExport: true
      }
    };

    // Save to the consolidated forms directory
    const formsDir = FORMS_DIR;
    await ensureDirectory(formsDir);
    await fs.writeFile(
      path.join(formsDir, `${formId}.json`),
      JSON.stringify(formConfig, null, 2)
    );

    // Create the submission directory structure
    const submissionsDir = SUBMISSIONS_DIR;
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
app.get('/api/forms/:formId/submissions', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params;
    const csvPath = path.join(SUBMISSIONS_DIR, formId, 'responses.csv');
    
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
app.get('/api/forms/:formId/submissions/csv', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params;
    const csvPath = path.join(SUBMISSIONS_DIR, formId, 'responses.csv');
    
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

// Authentication login endpoint (basic implementation)
app.post('/api/auth/login', [
  body('username').trim().isLength({ min: 1 }).withMessage('Username required'),
  body('password').isLength({ min: 1 }).withMessage('Password required')
], handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple credential check (in production, use proper user management)
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token if secret is available
    if (process.env.JWT_SECRET) {
      const token = jwt.sign(
        { username, role: 'admin' }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        message: 'Authentication successful'
      });
    } else {
      res.json({
        success: true,
        message: 'Authentication successful (development mode)'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Validate authentication token
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  // If we get here, the token is valid (authenticateToken middleware passed)
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: 'admin', // In a real app, this would come from the token
      username: process.env.ADMIN_USERNAME || 'admin'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'NAFormDashboard API',
    security: {
      cors: 'enabled',
      rateLimit: 'enabled',
      helmet: 'enabled',
      auth: process.env.JWT_SECRET ? 'enabled' : 'disabled (dev mode)'
    }
  });
});

// Get all forms and their submission counts
app.get('/api/forms', async (req, res) => {
  try {
    const formsDir = FORMS_DIR;
    const submissionsDir = SUBMISSIONS_DIR;

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
                settings: config.settings,
                status: config.status,
                tags: config.tags,
                urlSlug: config.urlSlug,
                formDefinition: config.formDefinition,
                isPublic: config.isPublic
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
    const formsDir = FORMS_DIR;
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

// Migration endpoint to upload form configurations directly
app.post('/api/forms/migrate', authenticateToken, [
  body('id').trim().isLength({ min: 1, max: 50 }).withMessage('Form ID required (1-50 characters)'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Form name required (1-100 characters)'),
  body('formDefinition').isObject().withMessage('Form definition must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const formConfig = req.body;
    
    console.log(`🔄 Migrating form: ${formConfig.name} (${formConfig.id})`);
    
    // Validate required fields
    if (!formConfig.id || !formConfig.name || !formConfig.formDefinition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, formDefinition'
      });
    }
    
    // Ensure form has proper structure
    const migratedConfig = {
      id: formConfig.id,
      name: formConfig.name,
      description: formConfig.description || '',
      urlSlug: formConfig.urlSlug || formConfig.id,
      webhookUrl: formConfig.webhookUrl || null,
      createdAt: formConfig.createdAt || new Date().toISOString(),
      generatedBy: formConfig.generatedBy || 'Migration',
      formDefinition: formConfig.formDefinition,
      status: formConfig.status || 'Internal',
      tags: formConfig.tags || [],
      isPublic: formConfig.isPublic || false,
      settings: formConfig.settings || {
        enableWebhook: !!formConfig.webhookUrl,
        enableFileUploads: true,
        enableCSVExport: true
      }
    };
    
    // Save to forms directory
    const formPath = path.join(FORMS_DIR, `${formConfig.id}.json`);
    await fs.writeFile(formPath, JSON.stringify(migratedConfig, null, 2));
    
    // Create submissions directory structure if it doesn't exist
    const formSubmissionDir = path.join(SUBMISSIONS_DIR, formConfig.id);
    await ensureDirectory(formSubmissionDir);
    
    // Create empty CSV file if it doesn't exist
    const csvPath = path.join(formSubmissionDir, 'responses.csv');
    try {
      await fs.access(csvPath);
    } catch {
      // File doesn't exist, create empty CSV with headers
      const csvHeaders = ['Submission ID', 'Timestamp'];
      await fs.writeFile(csvPath, csvHeaders.join(',') + '\n');
    }
    
    console.log(`✅ Successfully migrated form: ${formConfig.name} (${formConfig.id})`);
    
    res.json({
      success: true,
      message: 'Form migrated successfully',
      formId: formConfig.id,
      formConfig: migratedConfig
    });
    
  } catch (error) {
    console.error('❌ Form migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update form configuration
app.patch('/api/forms/:formId', authenticateToken, [
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title too long (max 100 characters)'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long (max 1000 characters)'),
    body('webhookUrl').optional().custom(value => {
    if (value === '' || validator.isURL(value)) {
      return true;
    }
    throw new Error('Invalid webhook URL');
  }),
    body('urlSlug').optional().trim().custom(value => {
    if (value === '' || /^[a-z0-9-]+$/.test(value)) {
      return true;
    }
    throw new Error('URL slug must contain only lowercase letters, numbers, and hyphens');
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { formId } = req.params;
    const updates = req.body;
    
    console.log(`🔧 Updating form ${formId} with:`, JSON.stringify(updates, null, 2));
    const formsDir = FORMS_DIR;
    const formPath = path.join(formsDir, `${formId}.json`);
    
    try {
      // Read current form config
      const formConfigContent = await fs.readFile(formPath, 'utf-8');
      const formConfig = JSON.parse(formConfigContent);
      
      // Update the form configuration
      const updatedConfig = { ...formConfig };
      
      if (updates.title) updatedConfig.name = updates.title;
      if (updates.description) updatedConfig.description = updates.description;
      if (updates.urlSlug) updatedConfig.urlSlug = updates.urlSlug;
      if (updates.webhookUrl !== undefined) updatedConfig.webhookUrl = updates.webhookUrl;
      if (updates.tags !== undefined) updatedConfig.tags = updates.tags;
      
      // Handle isPublic and status synchronization
      if (updates.isPublic !== undefined) {
        updatedConfig.isPublic = updates.isPublic;
        // Automatically sync status with isPublic, but preserve Archived status
        if (updates.isPublic) {
          updatedConfig.status = 'Public';
        } else if (updatedConfig.status !== 'Archived') {
          updatedConfig.status = 'Internal';
        }
      }
      
      // Allow explicit status updates (this handles cases where status is explicitly set)
      if (updates.status) {
        updatedConfig.status = updates.status;
        // Sync isPublic based on status
        if (updates.status === 'Public') {
          updatedConfig.isPublic = true;
        } else if (updates.status === 'Internal') {
          updatedConfig.isPublic = false;
        }
        // Archived status doesn't change isPublic
      }
      
      // Update form definition fields
      if (updates.completeText) {
        updatedConfig.formDefinition.completeText = updates.completeText;
      }
      
      // Allow complete form definition replacement
      if (updates.formDefinition) {
        updatedConfig.formDefinition = updates.formDefinition;
      }
      
      // Update last modified timestamp
      updatedConfig.updatedAt = new Date().toISOString();
      
      // Write back to file
      await fs.writeFile(formPath, JSON.stringify(updatedConfig, null, 2));
      
      res.json({
        success: true,
        message: 'Form updated successfully',
        formConfig: updatedConfig
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
    const formsDir = FORMS_DIR;
    
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
app.post('/api/webhook/test', webhookLimiter, [
  body('webhookUrl').isURL().withMessage('Valid webhook URL required'),
  body('testData').optional().isObject().withMessage('Test data must be an object')
], handleValidationErrors, async (req, res) => {
  const { webhookUrl, testData } = req.body;
  
  try {
    // Validate webhook URL to prevent SSRF
    validateWebhookUrl(webhookUrl);
    
    const payload = {
      test: true,
      timestamp: new Date().toISOString(),
      data: testData || { message: 'Test webhook from NAFormDashboard' },
      source: 'NAFormDashboard-Test'
    };
    
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      maxRedirects: 3
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
  console.log(`📁 Submissions will be stored in: ${SUBMISSIONS_DIR}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});