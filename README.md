# NA Form Dashboard

A modern, responsive form management dashboard built with React, Vite, and Tailwind CSS v4. This application provides a comprehensive interface for creating, managing, and viewing form submissions with an intelligent AI-powered form builder.

## ✨ Features

- **📊 Dashboard Overview**: Visual grid/list layout displaying all forms with status indicators and search
- **🤖 AI Form Builder**: GPT-4o powered intelligent form generation from natural language descriptions
- **📝 Dynamic Forms**: SurveyJS-powered forms with conditional logic and multi-step wizards
- **✏️ Form Content Editor**: Advanced JSON editor with real-time validation and error checking
- **🧭 Smart Navigation**: Context-aware routing that remembers where you came from
- **🎨 Modern Design System**: Built with Tailwind CSS v4 using custom design tokens and OKLCH colors
- **📱 Responsive Design**: Container queries for true responsive components
- **🔌 Webhook Integration**: Real-time form submission notifications
- **💾 Auto Data Export**: CSV export and file upload handling
- **⚡ Performance Optimized**: Vite build system with hot module replacement
- **🔒 Authentication System**: JWT-based secure access with configurable credentials

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 with React Router DOM 7.8.2
- **Build Tool**: Vite 6.3.5 with hot module replacement
- **Styling**: Tailwind CSS v4.1.12 with custom design tokens
- **Forms**: SurveyJS (survey-core 2.3.4, survey-react-ui 2.3.4)
- **Backend**: Node.js Express server with file handling
- **Icons**: Heroicons (inline SVG)
- **AI Integration**: GPT-5 powered form generation

## 🎯 Design System

This project showcases modern Tailwind CSS v4 features:

- **CSS-first configuration** using `@theme` directive
- **OKLCH color space** for better color consistency
- **Container queries** for responsive components
- **Custom utility classes** with `@utility` directive
- **Design tokens** for consistent spacing, typography, and colors

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (required for Tailwind CSS v4)
- Modern browser (Safari 16.4+, Chrome 111+, Firefox 128+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd NAFormDashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser
open http://localhost:5173
```

### Available Scripts

```bash
# Frontend (React + Vite)
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint

# Backend API Server
cd server
npm install      # Install server dependencies
npm run dev      # Start API server with file watching (port 3001)
npm start        # Start production API server
```

## 📁 Project Structure

```
├── src/                 # Frontend React application
│   ├── components/      # Reusable UI components
│   │   ├── Dashboard.jsx        # Main dashboard with form grid/list view
│   │   ├── FormContentEditor.jsx # JSON form content editor with validation
│   │   ├── Header.jsx           # Navigation header with search
│   │   ├── FormBuilderModal.jsx # AI-powered form creation modal
│   │   ├── LoginPage.jsx        # Authentication interface
│   │   └── dashboard/           # Dashboard-specific components
│   │       ├── FormCard.jsx     # Grid view form cards
│   │       ├── FormList.jsx     # List view form rows
│   │       └── ActionMenu.jsx   # Form action dropdown menu
│   ├── config/          # Configuration files
│   │   └── formConfigs.js      # Form configurations and API settings
│   ├── services/        # API and business logic
│   │   └── formSubmissionService.js # Form submission handling
│   ├── forms/           # Form-related components
│   │   ├── DynamicForm.jsx     # Dynamic form renderer with admin view
│   │   └── PublicForm.jsx      # Public form submission page
│   ├── assets/          # Static assets
│   ├── index.css        # Tailwind config + custom utilities
│   ├── App.jsx         # Main app component with routing
│   └── main.jsx        # React app entry point
└── server/             # Backend API server
    ├── server.js       # Express server with AI form generation
    ├── package.json    # Server dependencies
    ├── forms/          # Generated form definitions (JSON)
    └── submissions/    # Form submission data
        └── [form-id]/  # Each form gets its own directory
            ├── responses.csv        # All submissions in CSV
            └── uploads/             # File uploads directory
```

## 🎨 Design Features

### Color System
- **Brand Colors**: OKLCH-based blues for consistent branding
- **Semantic Colors**: Success (green), Warning (yellow), Info (purple)
- **Surface Colors**: Layered backgrounds with subtle tints

### Typography
- **Font Family**: Inter for optimal readability
- **Responsive Sizing**: Container-based text scaling
- **Font Smoothing**: Optimized for modern displays

### Components
- **Cards**: Elevated surfaces with hover animations
- **Buttons**: Primary, secondary, and icon variants
- **Forms**: Multi-step wizards with progress indicators
- **Status Badges**: Color-coded indicators for form states

## 🔧 Customization

### Adding Custom Colors
```css
@theme {
  --color-custom-500: oklch(0.6 0.15 180);
  --color-custom-600: oklch(0.5 0.18 180);
}
```

### Creating Utility Classes
```css
@utility my-component {
  background-color: var(--color-surface);
  border-radius: 0.75rem;
  padding: 1rem;
}
```

### Container Queries
```html
<div class="@container">
  <div class="p-4 @lg:p-8 @xl:p-12">
    Content adapts to container size
  </div>
</div>
```

## 📱 Responsive Breakpoints

- **@xs**: 320px+ (extra small containers)
- **@sm**: 480px+ (small containers)  
- **@md**: 768px+ (medium containers)
- **@lg**: 1024px+ (large containers)
- **@xl**: 1280px+ (extra large containers)
- **@4xl**: 1920px+ (ultra-wide containers)

## 🔍 Form Features

### AI Form Builder
- **Natural Language Input**: Describe your form in plain English
- **GPT-4o Integration**: Intelligent form generation with proper field types
- **Webhook Configuration**: Optional webhook URL setup during creation
- **Form Validation**: Built-in validation and error handling
- **Real-time Preview**: Instant form generation and preview

### Form Content Editor
- **JSON Editing**: Direct editing of SurveyJS form definitions
- **Real-time Validation**: Comprehensive JSON syntax and structure validation
- **Error Prevention**: Detailed error messages prevent form breakage
- **Context-Aware Navigation**: Smart routing that returns you to your starting point
- **Visual Error Feedback**: Clear validation errors with specific location information

### Dynamic Forms
- **SurveyJS Engine**: Powerful form rendering with conditional logic
- **Multi-step Support**: Progress tracking and step navigation
- **File Uploads**: Secure file upload capability with unique naming
- **Mobile Optimized**: Responsive design for all devices
- **Admin View**: Form editing and submission management

### Form Management
- **Dashboard Views**: Grid and list view with search and filtering
- **Status Tracking**: Live form status indicators (API health)
- **Response Analytics**: Submission counting and statistics
- **Public URLs**: Shareable form links with slug-based routing
- **Download Responses**: CSV export of all form submissions

## 📤 Form Submission System

### Automatic Data Processing
- **CSV Export**: All submissions automatically saved to CSV files
- **JSON Backup**: Complete form definitions stored as JSON
- **Markdown Documentation**: Human-readable form structure generated
- **File Handling**: Secure file uploads with unique naming

### Webhook Integration
- **Real-time Notifications**: Instant webhook delivery on form submission
- **Configurable URLs**: Set webhook URLs per form in configuration
- **Test Functionality**: Built-in webhook testing
- **Error Handling**: Robust error handling with fallback options

### Data Structure
Each form creates its own directory with:
```
server/
├── forms/                     # Form definitions
│   └── [form-id].json        # SurveyJS form definition
└── submissions/[form-id]/     # Form submission data
    ├── responses.csv          # All submissions in CSV format
    └── uploads/               # File attachments
```

### API Endpoints
- `POST /api/forms/generate` - Generate new form with AI
- `GET /api/forms` - Get all forms with metadata
- `GET /api/forms/:formId/definition` - Get form definition
- `PATCH /api/forms/:formId` - Update form metadata or content
- `POST /api/forms/:formId/submit` - Submit form data
- `GET /api/forms/:formId/submissions` - Get submission stats
- `GET /api/forms/:formId/submissions/csv` - Download CSV export
- `POST /api/webhook/test` - Test webhook functionality
- `POST /api/auth/login` - User authentication
- `GET /api/auth/validate` - Validate authentication token
- `GET /api/health` - Server health check

### Webhook Configuration
Configure webhooks per form in `src/config/formConfigs.js`:
```javascript
export const FORM_CONFIGS = {
  'your-form-id': {
    title: 'Your Form Title',
    description: 'Form description',
    webhookUrl: 'https://your-webhook-url.com',
    settings: {
      enableWebhook: true,
      enableFileUploads: true,
      enableCSVExport: true
    }
  }
}
```

### AI Form Generation
Create forms using natural language with the AI form builder:
```javascript
// Example form generation request
{
  title: "Customer Feedback Survey",
  webhookUrl: "https://webhook.site/your-url",
  description: "I need a customer feedback form with rating scales for service quality, product satisfaction, and likelihood to recommend. Include fields for customer name, email, and detailed comments."
}
```

## 🌐 Browser Support

- **Chrome**: 111+
- **Firefox**: 128+
- **Safari**: 16.4+
- **Edge**: 111+

*Note: Tailwind CSS v4 requires modern browsers for OKLCH color support and container queries.*

## 🧭 Navigation System

### Smart Context-Aware Routing
The application features intelligent navigation that remembers where you came from:

**From Dashboard:**
- Edit Form → Returns to Dashboard
- Edit Content → Returns to Dashboard

**From Form Page:**
- Edit Form → Returns to Form Page
- Edit Content → Returns to Form Page
- Back Button → Always goes to Dashboard

### Route Structure
```
/ (Dashboard)
├── ?edit={formId}&returnTo={path}    # Edit form metadata with context
├── /forms/{formId}                   # Form detail/submission page
├── /forms/{formId}/edit-content      # JSON content editor
│   └── ?returnTo={path}              # Smart return navigation
└── /f/{slug}                         # Public form submission (slug-based)
```

### Button Standardization
All buttons use consistent styling classes:
- **Primary Actions**: `btn-primary` (blue background)
- **Secondary Actions**: `btn-secondary` (white background, blue text)
- **Sizes**: `btn-sm` (small), `btn-md` (medium)
- **Additional Variants**: `btn-brand`, `btn-neutral`, `btn-ghost`

## 🔧 Form Content Editing

### JSON Validation Features
The form content editor includes comprehensive validation:

**Syntax Validation:**
- Real-time JSON parsing
- Detailed syntax error messages
- Line-specific error reporting

**Structure Validation:**
- Required SurveyJS properties check
- Page and element validation
- Type checking for all properties
- Detailed error aggregation

**Visual Feedback:**
- Error highlighting in textarea
- Comprehensive error messages with icons
- Prevention of form-breaking changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Tailwind CSS Team** for the amazing v4 features
- **SurveyJS** for the powerful form builder
- **Heroicons** for the beautiful icon set
- **Vite Team** for the lightning-fast build tool
