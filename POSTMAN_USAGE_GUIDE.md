# Dental Care Management System - Postman Usage Guide

## 🚀 Quick Start

### 1. Import Files
- Import `Dental_Care_Management_System.postman_collection.json`
- Import `Dental_Care_Management_System.postman_environment.json`
- Select the environment in Postman

### 2. Follow the Setup Sequence
**IMPORTANT**: Always follow this exact order to avoid authorization errors:

#### Step 1: Initial Setup
1. **Create Super Admin** - Creates the initial super admin account
2. **Login - Super Admin** - Gets the super admin token
3. **Create Organization** - Creates an organization (requires super admin token)
4. **Create Organization Admin** - Creates an organization admin (requires super admin token)
5. **Login - Organization Admin** - Gets the organization admin token

#### Step 2: Branch Setup
6. **Create Branch** - Creates a branch (requires organization admin token)
7. **Create Branch Admin** - Creates a branch admin (requires organization admin token)
8. **Login - Branch Admin** - Gets the branch admin token

#### Step 3: Staff Setup
9. **Create Doctor** - Creates a doctor (requires branch admin token)
10. **Create Receptionist** - Creates a receptionist (requires branch admin token)
11. **Login - Doctor** - Gets the doctor token
12. **Login - Receptionist** - Gets the receptionist token

#### Step 4: Patient Setup
13. **Create Patient** - Creates a patient (requires receptionist token)
14. **Login - Patient** - Gets the patient token

## 🔧 Automatic Features

### Token Management
- **Auto-extraction**: Tokens are automatically extracted from login responses
- **Auto-assignment**: The `auth_token` variable is automatically set to the most specific token available
- **Validation**: Pre-request scripts validate required tokens before making requests

### ID Management
- **Organization ID**: Automatically extracted when creating organizations
- **Branch ID**: Automatically extracted when creating branches
- **User IDs**: Automatically extracted from user creation responses

## 🛡️ Authorization Rules

### Role Hierarchy
```
Super Admin
    ↓ (creates)
Organization Admin
    ↓ (creates)
Branch Admin
    ↓ (creates)
Doctor & Receptionist
    ↓ (receptionist creates)
Patient
```

### Token Requirements
- **Super Admin Token**: Required for creating organizations and organization admins
- **Organization Admin Token**: Required for creating branches and branch admins
- **Branch Admin Token**: Required for creating doctors and receptionists
- **Receptionist Token**: Required for creating patients

## 🚨 Common Issues & Solutions

### "Unauthorized" Error
**Problem**: Getting 401 Unauthorized when creating users
**Solution**: 
1. Ensure you're logged in with the correct role
2. Check that the token is valid (not expired)
3. Follow the proper sequence (see Quick Start)

### Missing Organization/Branch ID
**Problem**: Getting errors about missing organization_id or branch_id
**Solution**:
1. Create the organization first (as super admin)
2. Create the branch second (as organization admin)
3. The IDs are automatically extracted and stored

### Token Expired
**Problem**: Getting 401 Unauthorized after some time
**Solution**:
1. Re-login with the appropriate role
2. The new token will automatically replace the old one

## 📋 Environment Variables

### Auto-Managed Variables
- `super_admin_token` - Super admin access token
- `organization_admin_token` - Organization admin access token
- `branch_admin_token` - Branch admin access token
- `doctor_token` - Doctor access token
- `receptionist_token` - Receptionist access token
- `patient_token` - Patient access token
- `auth_token` - Currently active token (auto-set)
- `organization_id` - Current organization ID
- `branch_id` - Current branch ID

### Manual Variables
- `base_url` - API base URL (default: http://localhost:3000)
- `user_id` - Current user ID
- `public_id` - File public ID for uploads

## 🔄 Testing Workflow

### Complete System Test
1. Run the "🚀 Setup & Initialization" folder in order
2. Test organization management endpoints
3. Test branch management endpoints
4. Test file upload endpoints
5. Test user management endpoints

### Individual Role Testing
1. Login with specific role
2. Test role-specific endpoints
3. Verify proper access control

## 📝 Notes

- All tokens are automatically managed - no manual copying needed
- Pre-request scripts validate requirements before making requests
- Test scripts extract and store IDs automatically
- The collection is organized hierarchically for easy navigation
- Each request includes proper error handling and validation

## 🆘 Troubleshooting

If you encounter issues:
1. Check the Postman console for error messages
2. Verify the backend server is running
3. Ensure you're following the proper sequence
4. Check that all required environment variables are set
5. Try re-logging in if tokens seem invalid
