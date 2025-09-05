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
    const csvPath = path.join(process.cwd(), 'server', 'submissions', formId, 'responses.csv');
    
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
}