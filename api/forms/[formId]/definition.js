import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { formId } = req.query;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formsDir = path.join(process.cwd(), 'data', 'forms');
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
}