#!/usr/bin/env node

/**
 * Form Migration Script for NAFormDashboard
 * 
 * This script uploads local form configurations to a remote server (like Railway).
 * It reads form JSON files from the local data directory and creates them on the remote server
 * using the API endpoints.
 * 
 * Usage:
 *   node scripts/migrate-forms.js --target production
 *   node scripts/migrate-forms.js --target local --dry-run
 *   node scripts/migrate-forms.js --forms form1,form2 --target production
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  local: {
    apiUrl: 'http://localhost:3001',
    requiresAuth: true
  },
  production: {
    apiUrl: process.env.PRODUCTION_API_URL || 'https://naformdash-production.up.railway.app',
    requiresAuth: true
  }
};

// Command line argument parsing
const args = process.argv.slice(2);
const target = args.find(arg => arg.startsWith('--target='))?.split('=')[1] || 
               (args.includes('--target') ? args[args.indexOf('--target') + 1] : 'production');
const dryRun = args.includes('--dry-run');
const specificForms = args.find(arg => arg.startsWith('--forms='))?.split('=')[1]?.split(',');
const verbose = args.includes('--verbose');

// Validate target
if (!CONFIG[target]) {
  console.error(`❌ Invalid target: ${target}. Valid targets: ${Object.keys(CONFIG).join(', ')}`);
  process.exit(1);
}

const config = CONFIG[target];

/**
 * Authenticate with the server and get a JWT token
 */
async function authenticate() {
  if (!config.requiresAuth) return null;
  
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  
  try {
    console.log(`🔐 Authenticating with ${target} server...`);
    const response = await axios.post(`${config.apiUrl}/api/auth/login`, {
      username,
      password
    });
    
    if (response.data.success && response.data.token) {
      console.log('✅ Authentication successful');
      return response.data.token;
    } else {
      throw new Error('Authentication failed - no token received');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

/**
 * Read all form files from the local data directory
 */
async function readLocalForms() {
  const formsDir = path.join(__dirname, '..', 'data', 'forms');
  
  try {
    const files = await fs.readdir(formsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const forms = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(formsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const formConfig = JSON.parse(content);
        
        // Filter by specific forms if requested
        if (specificForms && !specificForms.includes(formConfig.id)) {
          continue;
        }
        
        forms.push({ file, config: formConfig });
      } catch (error) {
        console.warn(`⚠️  Skipping invalid form file ${file}:`, error.message);
      }
    }
    
    return forms;
  } catch (error) {
    console.error('❌ Failed to read local forms directory:', error.message);
    process.exit(1);
  }
}

/**
 * Check if a form already exists on the remote server
 */
async function formExists(formId, token) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${config.apiUrl}/api/forms/${formId}/definition`, {
      headers,
      timeout: 10000
    });
    return response.data.success;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Upload a single form to the remote server
 */
async function uploadForm(form, token, options = {}) {
  const { config: formConfig, file } = form;
  const { overwrite = false, skipExisting = false } = options;
  
  try {
    // Check if form already exists
    const exists = await formExists(formConfig.id, token);
    
    if (exists && skipExisting) {
      console.log(`⏭️  Skipping existing form: ${formConfig.name} (${formConfig.id})`);
      return { success: true, action: 'skipped', formId: formConfig.id };
    }
    
    if (exists && !overwrite) {
      console.log(`⚠️  Form already exists: ${formConfig.name} (${formConfig.id}) - use --overwrite to replace`);
      return { success: false, action: 'exists', formId: formConfig.id };
    }
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    if (exists && overwrite) {
      // Update existing form
      console.log(`🔄 Updating form: ${formConfig.name} (${formConfig.id})`);
      
      const updateResponse = await axios.patch(`${config.apiUrl}/api/forms/${formConfig.id}`, {
        title: formConfig.name,
        description: formConfig.description,
        urlSlug: formConfig.urlSlug,
        webhookUrl: formConfig.webhookUrl,
        status: formConfig.status,
        tags: formConfig.tags,
        isPublic: formConfig.isPublic
      }, { headers, timeout: 30000 });
      
      return { success: true, action: 'updated', formId: formConfig.id, response: updateResponse.data };
    } else {
      // Create new form by recreating it via the generation API
      // This is a bit of a hack, but it ensures the form gets created with the right structure
      console.log(`📝 Creating form: ${formConfig.name} (${formConfig.id})`);
      
      // We need to reconstruct the form creation request
      // Since we can't directly create forms with existing IDs, we'll need to use a different approach
      
      // For now, let's create the form directory structure directly
      // This would require filesystem access on the server, which we don't have
      
      // Alternative: Use a special migration endpoint (we'd need to add this to the server)
      console.warn(`⚠️  Cannot create new forms via API - form ID already determined. Consider adding a migration endpoint to the server.`);
      return { success: false, action: 'unsupported', formId: formConfig.id };
    }
    
  } catch (error) {
    console.error(`❌ Failed to upload form ${formConfig.name}:`, error.response?.data?.error || error.message);
    return { success: false, action: 'error', formId: formConfig.id, error: error.message };
  }
}

/**
 * Add a special migration endpoint to upload form configurations directly
 * This would need to be added to the server
 */
async function uploadFormDirect(form, token) {
  const { config: formConfig } = form;
  
  try {
    const headers = token ? { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
    
    console.log(`📤 Uploading form: ${formConfig.name} (${formConfig.id})`);
    
    // This would be a new endpoint we need to add to the server
    const response = await axios.post(`${config.apiUrl}/api/forms/migrate`, formConfig, {
      headers,
      timeout: 30000
    });
    
    return { success: true, action: 'migrated', formId: formConfig.id, response: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️  Migration endpoint not available. Need to add /api/forms/migrate to server.`);
      return { success: false, action: 'no-endpoint', formId: formConfig.id };
    }
    
    console.error(`❌ Failed to migrate form ${formConfig.name}:`, error.response?.data?.error || error.message);
    return { success: false, action: 'error', formId: formConfig.id, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateforms() {
  console.log(`\n🚀 Form Migration Script`);
  console.log(`Target: ${target} (${config.apiUrl})`);
  console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}`);
  if (specificForms) {
    console.log(`Specific Forms: ${specificForms.join(', ')}`);
  }
  console.log('');
  
  // Read local forms
  console.log('📂 Reading local forms...');
  const forms = await readLocalForms();
  console.log(`Found ${forms.length} forms to migrate`);
  
  if (verbose) {
    forms.forEach(form => {
      console.log(`  - ${form.config.name} (${form.config.id})`);
    });
  }
  
  if (forms.length === 0) {
    console.log('✅ No forms to migrate');
    return;
  }
  
  if (dryRun) {
    console.log('\n🧪 Dry run - no changes will be made');
    return;
  }
  
  // Authenticate
  const token = await authenticate();
  
  // Migrate forms
  console.log(`\n📤 Migrating ${forms.length} forms to ${target}...`);
  const results = [];
  
  for (const form of forms) {
    try {
      // Try the direct migration approach first
      const result = await uploadFormDirect(form, token);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.action}: ${form.config.name} (${form.config.id})`);
      } else if (result.action === 'no-endpoint') {
        // Fallback to update approach for existing forms
        const fallbackResult = await uploadForm(form, token, { overwrite: true });
        results[results.length - 1] = fallbackResult;
        
        if (fallbackResult.success) {
          console.log(`✅ ${fallbackResult.action}: ${form.config.name} (${form.config.id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${form.config.name}:`, error.message);
      results.push({ success: false, action: 'error', formId: form.config.id, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Migration Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed forms:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.formId}: ${r.action} (${r.error || 'unknown error'})`);
    });
  }
  
  console.log(`\n🎉 Migration completed! Check your ${target} dashboard.`);
}

// Handle CLI help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Form Migration Script for NAFormDashboard

Usage:
  node scripts/migrate-forms.js [options]

Options:
  --target <env>      Target environment: local, production (default: production)
  --forms <list>      Comma-separated list of specific form IDs to migrate
  --dry-run          Show what would be migrated without making changes
  --verbose          Show detailed information
  --help, -h         Show this help message

Examples:
  node scripts/migrate-forms.js --target production
  node scripts/migrate-forms.js --target local --dry-run
  node scripts/migrate-forms.js --forms test-form,contact-form --target production
  
Environment Variables:
  PRODUCTION_API_URL   Production server URL (default: Railway URL)
  ADMIN_USERNAME       Admin username for authentication
  ADMIN_PASSWORD       Admin password for authentication
`);
  process.exit(0);
}

// Run the migration
migrateforms().catch(error => {
  console.error('💥 Migration failed:', error.message);
  process.exit(1);
});