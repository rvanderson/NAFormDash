# Architecture Document

This document outlines the architecture for the Form Dashboard application.

## Tech Stack

*   **Build Tool**: Vite 6.3.5 with hot module replacement
*   **Frontend Framework**: React 19.1.1 with React Router DOM 7.8.2
*   **Styling**: Tailwind CSS v4.1.12 with custom design tokens and OKLCH colors
*   **Form Rendering**: SurveyJS Library (survey-core 2.3.4, survey-react-ui 2.3.4)
*   **Form Management**: Custom form content editor with JSON validation
*   **AI-Powered Form Generation**: GPT-4o powered form generation service
*   **Backend**: Node.js Express server with file-based storage

## Project Structure

```
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── Dashboard.jsx         # Main dashboard with form grid/list view
│   │   ├── FormContentEditor.jsx # JSON form content editor with validation
│   │   ├── Header.jsx            # Navigation header with search/filters
│   │   ├── FormBuilderModal.jsx  # AI-powered form creation modal
│   │   └── dashboard/            # Dashboard-specific components
│   │       ├── FormCard.jsx      # Grid view form cards
│   │       ├── FormList.jsx      # List view form rows
│   │       └── ActionMenu.jsx    # Form action dropdown menu
│   ├── forms/                    # Form-related components
│   │   ├── DynamicForm.jsx       # Dynamic form renderer with admin controls
│   │   └── PublicForm.jsx        # Public form submission interface
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── config/                   # Configuration files
│   │   └── formConfigs.js        # Form configurations and API settings
│   ├── services/                 # API and business logic
│   │   └── formSubmissionService.js # Form submission handling
│   ├── utils/                    # Utility functions
│   │   └── logger.js             # Logging utilities
│   ├── index.css                 # Tailwind config + custom utilities
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # React app entry point
└── server/                       # Backend API server
    ├── server.js                 # Express server with all endpoints
    ├── package.json              # Server dependencies
    ├── data/                     # Data storage directory
    │   ├── forms/                # Generated form definitions (JSON)
    │   └── submissions/          # Form submission data
    │       └── [form-id]/        # Each form gets its own directory
    │           ├── responses.csv # All submissions in CSV format
    │           └── uploads/      # File uploads directory
    └── .env                      # Server environment variables
```

## Core Features

### 1. AI-Powered Form Generation
- **Natural Language Processing**: Convert plain English descriptions into SurveyJS form definitions
- **GPT-4o Integration**: Advanced form generation with proper field types and validation
- **Real-time Preview**: Instant form generation and preview capability
- **Webhook Configuration**: Optional webhook setup during form creation

### 2. Form Content Management
- **Dual Editing Modes**: 
  - Metadata editing (title, description, settings)
  - Raw JSON content editing with validation
- **Context-Aware Navigation**: Smart return-to-source routing
- **JSON Validation**: Comprehensive syntax and structure validation
- **Real-time Error Feedback**: Immediate validation feedback with detailed error messages

### 3. Form Management Dashboard
- **Multiple View Modes**: Grid and list views with responsive design
- **Search & Filtering**: Full-text search with status and tag filtering
- **Status Management**: Public/Internal/Archived form states
- **Bulk Operations**: CSV export, archiving, and visibility controls

### 4. Dynamic Form System
- **SurveyJS Integration**: Full-featured form rendering with conditional logic
- **Multi-step Support**: Progress tracking and step navigation
- **File Upload Handling**: Secure file uploads with unique naming
- **Responsive Design**: Mobile-optimized form interfaces

## Backend Services

### Form Generation Service
*   **Endpoint**: `/api/forms/generate`
*   **Method**: `POST`
*   **Request Body**: 
    ```json
    {
      "title": "Form title",
      "description": "Natural language form description",
      "webhookUrl": "optional webhook URL",
      "urlSlug": "optional URL slug"
    }
    ```
*   **Response**: Complete SurveyJS form definition with metadata

### Form Management API
*   **Get Forms**: `GET /api/forms` - Retrieve all forms with metadata
*   **Get Form Definition**: `GET /api/forms/:formId/definition` - Get specific form
*   **Update Form**: `PATCH /api/forms/:formId` - Update form metadata or content
*   **Submit Form**: `POST /api/forms/:formId/submit` - Process form submissions
*   **Export Data**: `GET /api/forms/:formId/submissions/csv` - Download CSV export

### Authentication System
*   **Login**: `POST /api/auth/login` - JWT-based authentication
*   **Token Validation**: `GET /api/auth/validate` - Verify authentication status
*   **Environment-based**: Configurable admin credentials via environment variables

## Navigation Architecture

### Route Structure
```
/ (Dashboard)
├── ?edit={formId}&returnTo={path}    # Edit form metadata with return context
├── /forms/{formId}                   # Form detail/submission page
├── /forms/{formId}/edit-content      # JSON content editor
│   └── ?returnTo={path}              # Context-aware return navigation
└── /f/{slug}                         # Public form submission (slug-based)
```

### Context-Aware Navigation
- **Dashboard → Edit**: Returns to dashboard after save/cancel
- **Form Page → Edit**: Returns to form page after save/cancel
- **Back Button**: Always navigates to dashboard from form pages
- **URL Parameters**: `returnTo` parameter preserves navigation context

## Data Storage

### File-Based Architecture
- **Forms Storage**: JSON files in `/data/forms/` directory
- **Submissions**: CSV files in `/data/submissions/{formId}/` directories  
- **File Uploads**: Organized in `/data/submissions/{formId}/uploads/`
- **Atomic Updates**: Safe file writing with error handling

### Form Validation System
- **JSON Syntax Validation**: Parse errors with detailed error messages
- **SurveyJS Structure Validation**: 
  - Required properties validation (title, pages, elements)
  - Type checking for all properties
  - Element structure validation
  - Error aggregation with specific location information

## Design System Integration

### Tailwind CSS v4 Features
- **OKLCH Color Space**: Consistent colors across all components
- **Container Queries**: Responsive components based on container size
- **Custom Utilities**: Standardized button classes and component patterns
- **Design Tokens**: Centralized color, spacing, and typography definitions

### Component Standards
- **Button System**: Standardized `btn-primary`, `btn-secondary`, `btn-sm`, `btn-md` classes
- **Error Handling**: Consistent validation error display with icons and formatting
- **Focus Management**: Proper focus rings and keyboard navigation
- **Loading States**: Unified loading indicators and disabled states
