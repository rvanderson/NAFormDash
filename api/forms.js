import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const formsDir = path.join(process.cwd(), 'server', 'forms');
      
      try {
        const formFiles = await fs.readdir(formsDir);
        const forms = await Promise.all(
          formFiles
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
              try {
                const formPath = path.join(formsDir, file);
                const formContent = await fs.readFile(formPath, 'utf-8');
                const config = JSON.parse(formContent);

                return {
                  id: config.id,
                  name: config.name,
                  description: config.description,
                  createdAt: config.createdAt,
                  generatedBy: config.generatedBy,
                  webhookUrl: config.webhookUrl,
                  submissionCount: 0, // TODO: Calculate from submissions
                  settings: config.settings,
                  status: config.status,
                  tags: config.tags,
                  urlSlug: config.urlSlug,
                  formDefinition: config.formDefinition,
                  isPublic: config.isPublic
                };
              } catch (error) {
                console.error(`Error processing form file ${file}:`, error);
                return null;
              }
            })
        );

        const validForms = forms.filter(form => form !== null);
        res.json({ 
          success: true, 
          forms: validForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
        });
      } catch (error) {
        res.json({ success: true, forms: [] });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}