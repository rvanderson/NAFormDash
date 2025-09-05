export default function handler(req, res) {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'NAFormDashboard API'
  });
}