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

// Update CSV with submission data
async function updateCSV(formId, submissionData) {
  const formDir = path.join(process.cwd(), 'server', 'submissions', formId);
  const csvPath = path.join(formDir, 'responses.csv');
  
  await ensureDirectory(formDir);
  
  // Add metadata to submission
  const enrichedData = {
    submission_id: `${formId}_${Date.now()}`,
    submitted_at: new Date().toISOString(),
    ...submissionData
  };
  
  // Check if CSV exists
  let csvExists = false;
  try {
    await fs.access(csvPath);
    csvExists = true;
  } catch (error) {
    csvExists = false;
  }
  
  // Create CSV content
  const headers = Object.keys(enrichedData);
  const values = headers.map(key => {
    const value = enrichedData[key];
    if (typeof value === 'object') {
      return JSON.stringify(value).replace(/"/g, '""');
    }
    return String(value).replace(/"/g, '""');
  });
  
  let csvContent = '';
  if (!csvExists) {
    // Add headers if file doesn't exist
    csvContent += headers.join(',') + '\\n';
  }
  csvContent += values.map(v => `"${v}"`).join(',') + '\\n';
  
  await fs.appendFile(csvPath, csvContent);
  console.log(`✅ CSV updated for form ${formId}`);
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
    
    // Update CSV with submission data
    await updateCSV(formId, submissionData);
    
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