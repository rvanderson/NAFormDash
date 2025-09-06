import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

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
      timeout: 10000,
      maxRedirects: 3
    });
    
    console.log(`✅ Webhook sent successfully for form ${formId}:`, response.status);
  } catch (error) {
    console.error(`❌ Webhook failed for form ${formId}:`, error.message);
  }
}

// Ensure directory exists
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

// Log submission data (Vercel functions can't write files)
function logSubmission(formId, submissionData) {
  const enrichedData = {
    submission_id: `${formId}_${Date.now()}`,
    submitted_at: new Date().toISOString(),
    ...submissionData
  };
  
  console.log(`📝 Form ${formId} submission:`, JSON.stringify(enrichedData, null, 2));
  console.log(`✅ Submission logged for form ${formId}`);
  
  // TODO: In production, save to external database or service
  // For now, submissions are only logged and sent to webhooks
}

export default async function handler(req, res) {
  const { formId } = req.query;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    
    // Log submission data (can't write files in Vercel)
    logSubmission(formId, submissionData);
    
    // Send webhook if configured
    if (webhookUrl) {
      await sendWebhook(webhookUrl, formId, submissionData);
    }
    
    res.json({ 
      success: true, 
      message: 'Form submitted successfully',
      submissionId: `${formId}_${Date.now()}`,
      filesUploaded: 0 // TODO: Handle file uploads
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Form submission failed',
      error: error.message 
    });
  }
}