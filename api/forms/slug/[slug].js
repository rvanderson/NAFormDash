import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;
  
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
}