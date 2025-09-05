import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

Return ONLY the JSON object, no additional text or explanation.`;

    const userPrompt = `Create a professional form for: "${name}"

Description: ${description}

Generate a complete SurveyJS form definition that captures all the necessary information based on this description. Make it user-friendly, logical, and comprehensive.`;

    // Call GPT-4o API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      console.error('❌ Failed to parse GPT-4o JSON response:', parseError);
      throw new Error('GPT-4o returned invalid JSON format');
    }

    // Validate the form definition has required fields
    if (!formDefinition.title || !formDefinition.pages) {
      throw new Error('Generated form is missing required fields (title or pages)');
    }

    // Post-process the form definition
    if (formDefinition.pages.length === 1) {
      formDefinition.showProgressBar = false;
      delete formDefinition.progressBarType;
    }

    // Create a form ID from the name
    const formId = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const urlSlug = formId;

    // Create form configuration
    const formConfig = {
      id: formId,
      name: name,
      description: formDefinition.description || description,
      urlSlug: urlSlug,
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString(),
      generatedBy: 'GPT-4o',
      formDefinition: formDefinition,
      status: 'Internal',
      tags: [],
      isPublic: false,
      settings: {
        enableWebhook: !!webhookUrl,
        enableFileUploads: true,
        enableCSVExport: true
      }
    };

    // Save to the forms directory
    const formsDir = path.join(process.cwd(), 'data', 'forms');
    await ensureDirectory(formsDir);
    await fs.writeFile(
      path.join(formsDir, `${formId}.json`),
      JSON.stringify(formConfig, null, 2)
    );

    console.log(`✅ Form "${name}" generated successfully with ID: ${formId}`);

    res.json({
      success: true,
      formId: formId,
      formName: name,
      formDefinition: formDefinition,
      message: 'Form generated successfully by GPT-4o',
      config: formConfig
    });

  } catch (error) {
    console.error('❌ Form generation error:', error);
    
    let errorMessage = 'Failed to generate form';
    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API key not configured';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'AI generated invalid form structure';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}