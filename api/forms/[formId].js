import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { formId } = req.query;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const formsDir = path.join(process.cwd(), 'data', 'forms');
    const formPath = path.join(formsDir, `${formId}.json`);
    
    if (req.method === 'GET') {
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
    } 
    else if (req.method === 'PATCH') {
      try {
        const formConfigContent = await fs.readFile(formPath, 'utf-8');
        const formConfig = JSON.parse(formConfigContent);
        const updates = req.body;
        
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
          if (updates.isPublic) {
            updatedConfig.status = 'Public';
          } else if (updatedConfig.status !== 'Archived') {
            updatedConfig.status = 'Internal';
          }
        }
        
        if (updates.status) {
          updatedConfig.status = updates.status;
          if (updates.status === 'Public') {
            updatedConfig.isPublic = true;
          } else if (updates.status === 'Internal') {
            updatedConfig.isPublic = false;
          }
        }
        
        if (updates.completeText) {
          updatedConfig.formDefinition.completeText = updates.completeText;
        }
        
        updatedConfig.updatedAt = new Date().toISOString();
        
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
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}