import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Removed custom survey-theme.css - using SurveyJS flat-light theme instead
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
