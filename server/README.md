# NAFormDashboard API Server

A Node.js/Express API server for handling form submissions with file uploads, CSV generation, and webhook integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (with file watching)
npm run dev

# Start production server
npm start
```

Server runs on `http://localhost:3001` by default.

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server health status.

### Form Submission
```
POST /api/forms/:formId/submit
```
Submit form data with optional file uploads and webhook integration.

**Request Body:**
- `formDefinition` (JSON string) - The SurveyJS form definition
- `webhookUrl` (string, optional) - URL to send webhook notification
- Form field data as key-value pairs
- File uploads via multipart/form-data

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "client-onboarding_1683123456789",
  "filesUploaded": 2
}
```

### Get Form Submissions
```
GET /api/forms/:formId/submissions
```
Get submission statistics for a specific form.

**Response:**
```json
{
  "success": true,
  "totalSubmissions": 15,
  "lastSubmission": "2023-05-03T10:30:00Z",
  "csvPath": "/path/to/responses.csv"
}
```

### List All Forms
```
GET /api/forms
```
Get all forms and their submission counts.

### Test Webhook
```
POST /api/webhook/test
```
Test webhook functionality.

**Request Body:**
```json
{
  "webhookUrl": "https://your-webhook-url.com",
  "testData": { "message": "Test data" }
}
```

## 📁 File Storage Structure

The server automatically creates the following structure:

```
server/submissions/
├── client-onboarding/
│   ├── form-structure.md       # Human-readable form documentation
│   ├── form-definition.json    # SurveyJS form definition
│   ├── responses.csv          # All form submissions
│   └── uploads/               # File uploads directory
│       ├── 2023-05-03T10-30-00_resume.pdf
│       └── 2023-05-03T10-30-00_portfolio.zip
├── project-brief/
│   └── ... (same structure)
└── design-feedback/
    └── ... (same structure)
```

## 📝 Generated Files

### 1. Markdown Documentation (`form-structure.md`)
Human-readable documentation of the form structure with the latest submission data.

### 2. JSON Definition (`form-definition.json`)
Complete SurveyJS form definition for backup and analysis.

### 3. CSV Responses (`responses.csv`)
All form submissions in CSV format with:
- `submission_id` - Unique identifier
- `submitted_at` - ISO timestamp
- All form fields as columns
- File upload information

## 🔗 Webhook Integration

When a webhook URL is configured, the server sends POST requests with this payload:

```json
{
  "formId": "client-onboarding",
  "submissionId": "client-onboarding_1683123456789",
  "submittedAt": "2023-05-03T10:30:00.000Z",
  "data": {
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "email": "john@acme.com"
  },
  "source": "NAFormDashboard"
}
```

## 🛡️ Features

- **File Uploads**: Automatic file handling with unique names
- **CSV Generation**: Automatic CSV export of all submissions
- **Webhook Support**: Real-time notifications to external systems
- **Error Handling**: Comprehensive error handling and logging
- **CORS Enabled**: Ready for frontend integration
- **Auto Documentation**: Generates human-readable form docs

## 🔧 Configuration

Environment variables:
- `PORT` - Server port (default: 3001)

## 📊 Monitoring

The server logs all operations:
- ✅ Successful submissions
- ❌ Failed submissions
- 📤 Webhook deliveries
- 📁 File operations

## 🧪 Testing

Test the webhook functionality:
```bash
curl -X POST http://localhost:3001/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-webhook.com", "testData": {"test": true}}'
```

Test form submission:
```bash
curl -X POST http://localhost:3001/api/forms/test-form/submit \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "formDefinition={\"title\":\"Test Form\"}"
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **multer** - File upload handling
- **csv-writer** - CSV generation
- **axios** - HTTP client for webhooks

## 🔄 Development

The server uses Node.js `--watch` flag for automatic restarting during development. Any changes to `server.js` will automatically restart the server.

## 🚨 Important Notes

1. **File Security**: Files are stored with sanitized names and timestamps
2. **Memory Usage**: Large file uploads are streamed to disk
3. **Webhook Timeout**: Webhooks timeout after 10 seconds
4. **CSV Headers**: Headers are dynamically generated based on form fields
5. **Error Recovery**: Failed webhooks don't prevent successful form submission