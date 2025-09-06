import axios from 'axios';

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

export default async function handler(req, res) {
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
}