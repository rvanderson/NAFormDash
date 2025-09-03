# NA Form Dashboard

A modern, responsive form management dashboard built with React, Vite, and Tailwind CSS v4. This application provides a comprehensive interface for creating, managing, and viewing form submissions for design projects.

## ✨ Features

- **📊 Dashboard Overview**: Visual grid layout displaying all forms with status indicators
- **📝 Dynamic Form Builder**: Client onboarding forms with multi-step wizards
- **🎨 Modern Design System**: Built with Tailwind CSS v4 using OKLCH color space
- **📱 Responsive Design**: Container queries for true responsive components
- **♿ Accessibility First**: WCAG compliant with proper focus management
- **🚀 Performance Optimized**: Vite build system with hot module replacement

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 with React Router DOM
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4.1.12 with custom design tokens
- **Forms**: SurveyJS for dynamic form generation
- **Icons**: Heroicons (SVG-based)

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
│   │   ├── Dashboard.jsx   # Main dashboard with form grid
│   │   ├── Header.jsx      # Navigation header
│   │   └── Sidebar.jsx     # Navigation sidebar
│   ├── config/          # Configuration files
│   │   └── formConfigs.js  # Form configurations and API settings
│   ├── services/        # API and business logic
│   │   └── formSubmissionService.js # Form submission handling
│   ├── forms/           # Form-related components
│   │   ├── ClientOnboardingForm.jsx # Multi-step client intake
│   │   └── survey-theme.css         # SurveyJS custom styling
│   ├── index.css        # Tailwind config + custom utilities
│   ├── App.jsx         # Main app component with routing
│   └── main.jsx        # React app entry point
└── server/             # Backend API server
    ├── server.js       # Express server with submission handling
    ├── package.json    # Server dependencies
    ├── README.md       # Server documentation
    └── submissions/    # Generated form data (created at runtime)
        ├── client-onboarding/
        │   ├── form-structure.md    # Human-readable documentation
        │   ├── form-definition.json # SurveyJS form definition
        │   ├── responses.csv        # All submissions in CSV
        │   └── uploads/             # File uploads directory
        └── [form-id]/   # Additional forms follow same structure
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

### Client Onboarding Form
- **Multi-step Process**: 4-page wizard with progress tracking
- **Dynamic Validation**: Real-time field validation
- **File Uploads**: Brand asset upload capability
- **Conditional Logic**: Show/hide fields based on responses
- **Mobile Optimized**: Touch-friendly interface

### Form Management
- **Status Tracking**: Published, Draft, Archived states
- **Response Counting**: Live submission statistics  
- **Date Sorting**: Chronological form organization
- **Quick Actions**: One-click form access and editing

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
submissions/client-onboarding/
├── form-structure.md       # Documentation
├── form-definition.json    # SurveyJS definition  
├── responses.csv          # All submissions
└── uploads/               # File attachments
```

### API Endpoints
- `POST /api/forms/:formId/submit` - Submit form data
- `GET /api/forms/:formId/submissions` - Get submission stats
- `POST /api/webhook/test` - Test webhook functionality
- `GET /api/health` - Server health check

### Webhook Configuration
Configure webhooks in `src/config/formConfigs.js`:
```javascript
'client-onboarding': {
  webhookUrl: 'https://your-webhook-url.com',
  settings: {
    enableWebhook: true,
    enableFileUploads: true,
    enableCSVExport: true
  }
}
```

## 🌐 Browser Support

- **Chrome**: 111+
- **Firefox**: 128+
- **Safari**: 16.4+
- **Edge**: 111+

*Note: Tailwind CSS v4 requires modern browsers for OKLCH color support and container queries.*

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
