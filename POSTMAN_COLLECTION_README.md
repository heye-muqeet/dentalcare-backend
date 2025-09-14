# Dental Care Management System - Postman Collection

This Postman collection provides comprehensive API testing for the Dental Care Management System with role-based hierarchical access control.

## 📁 Files Included

- `Dental_Care_Management_System.postman_collection.json` - Main Postman collection
- `Dental_Care_Management_System.postman_environment.json` - Environment variables
- `POSTMAN_COLLECTION_README.md` - This documentation

## 🚀 Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `Dental_Care_Management_System.postman_collection.json`
   - `Dental_Care_Management_System.postman_environment.json`
4. Select the **Dental Care Management System - Environment** environment

### 2. Start the Backend Server

```bash
cd backend
npm run start:dev
```

### 3. Test the API

1. **Health Check**: Run the "Health Check" request to verify the server is running
2. **Login as Super Admin**: Use the default credentials to get your first token
3. **Create Organization**: Create your first organization
4. **Create Branch**: Create branches for your organization
5. **Create Users**: Create users for each role

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@dentalcare.com` | `SuperAdmin123!` |

## 📋 Collection Structure

### 🔐 Authentication
- **Login endpoints** for all 6 user roles
- **User creation endpoints** with proper authorization
- **Token management** for different user types

### 🏢 Organization Management
- Create, read, update, delete organizations
- Manage organization admins
- View organization statistics
- Role-based access control

### 🏥 Branch Management
- Create branches with automatic Branch Admin creation
- Manage branch-specific users (doctors, receptionists, patients)
- View branch statistics and details
- Operating hours configuration

### 📁 File Upload
- Upload images (JPG, PNG, GIF, WebP) - Max 5MB
- Upload documents (PDF, DOC, DOCX, TXT) - Max 10MB
- Delete files from Cloudinary
- Get file information

### 👥 User Management (Legacy)
- Legacy user management endpoints
- Use role-specific auth endpoints instead

### 🔧 System Health
- Basic health check endpoint

## 🔄 Workflow Examples

### Complete Setup Workflow

1. **Login as Super Admin**
   ```
   POST /auth/login
   {
     "email": "superadmin@dentalcare.com",
     "password": "SuperAdmin123!",
     "role": "super_admin"
   }
   ```

2. **Create Organization**
   ```
   POST /organizations
   Authorization: Bearer <super_admin_token>
   {
     "name": "My Dental Practice",
     "address": "123 Main St",
     "city": "New York",
     "state": "NY",
     "country": "USA",
     "postalCode": "10001",
     "phone": "1234567890"
   }
   ```

3. **Create Organization Admin**
   ```
   POST /auth/organization-admin
   Authorization: Bearer <super_admin_token>
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "orgadmin@example.com",
     "password": "password123",
     "phone": "1234567890",
     "organizationId": "<organization_id>"
   }
   ```

4. **Login as Organization Admin**
   ```
   POST /auth/login
   {
     "email": "orgadmin@example.com",
     "password": "password123",
     "role": "organization_admin"
   }
   ```

5. **Create Branch**
   ```
   POST /branches
   Authorization: Bearer <organization_admin_token>
   {
     "name": "Downtown Branch",
     "address": "456 Oak St",
     "city": "New York",
     "state": "NY",
     "country": "USA",
     "postalCode": "10002",
     "phone": "1234567891",
     "branchAdminFirstName": "Branch",
     "branchAdminLastName": "Admin",
     "branchAdminEmail": "branchadmin@example.com",
     "branchAdminPassword": "password123",
     "branchAdminPhone": "1234567892"
   }
   ```

6. **Continue with Branch Admin, Doctor, Receptionist, and Patient creation...**

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `super_admin_token` | Super Admin JWT token | Auto-populated after login |
| `organization_admin_token` | Organization Admin JWT token | Auto-populated after login |
| `branch_admin_token` | Branch Admin JWT token | Auto-populated after login |
| `doctor_token` | Doctor JWT token | Auto-populated after login |
| `receptionist_token` | Receptionist JWT token | Auto-populated after login |
| `patient_token` | Patient JWT token | Auto-populated after login |
| `organization_id` | Current organization ID | Auto-populated after creation |
| `branch_id` | Current branch ID | Auto-populated after creation |
| `user_id` | Current user ID | Auto-populated after creation |
| `public_id` | Cloudinary public ID | Auto-populated after file upload |

## 🎯 Testing Scenarios

### Scenario 1: Complete Organization Setup
1. Login as Super Admin
2. Create Organization
3. Create Organization Admin
4. Login as Organization Admin
5. Create Branch
6. Create Branch Admin
7. Create Doctor
8. Create Receptionist
9. Create Patient

### Scenario 2: File Upload Testing
1. Login with any role
2. Upload profile image
3. Upload document
4. Get file information
5. Delete file

### Scenario 3: Role-Based Access Testing
1. Test each role's permissions
2. Verify access restrictions
3. Test unauthorized access attempts

## 🔒 Security Features

- **JWT Authentication**: All protected endpoints require valid JWT tokens
- **Role-Based Access**: Each role has specific permissions
- **Hierarchical Control**: Higher roles can manage lower roles
- **No Self-Signup**: All accounts created by higher-level roles
- **File Upload Security**: Type validation, size limits, secure storage

## 📊 Response Examples

### Successful Login Response
```json
{
  "user": {
    "id": "user_id",
    "firstName": "Super",
    "lastName": "Admin",
    "email": "superadmin@dentalcare.com",
    "role": "super_admin",
    "organizationId": null,
    "branchId": null,
    "profileImage": null,
    "isActive": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "super_admin",
  "organizationId": null,
  "branchId": null
}
```

### Organization Creation Response
```json
{
  "_id": "68c58c7b868fba19a4168293",
  "name": "Dental Care Center",
  "description": "Premium dental care services",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001",
  "phone": "1234567890",
  "email": "info@dentalcare.com",
  "website": "https://dentalcare.com",
  "createdBy": "68c58c7b868fba19a4168292",
  "isActive": true,
  "createdAt": "2025-09-13T20:00:00.000Z",
  "updatedAt": "2025-09-13T20:00:00.000Z"
}
```

### File Upload Response
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "public_id": "dental-care/profile-images/abc123",
    "secure_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/dental-care/profile-images/abc123.jpg",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "bytes": 45678
  }
}
```

## 🚨 Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Organization not found",
  "error": "Not Found"
}
```

**409 Conflict**
```json
{
  "statusCode": 409,
  "message": "Organization Admin with this email already exists",
  "error": "Conflict"
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Server Not Running**
   - Ensure backend server is running on `http://localhost:3000`
   - Check console for any error messages

2. **Authentication Errors**
   - Verify JWT token is valid and not expired
   - Check if user has proper permissions for the endpoint

3. **File Upload Issues**
   - Ensure file size is within limits (5MB for images, 10MB for documents)
   - Check file type is supported
   - Verify Cloudinary credentials are configured

4. **Database Connection**
   - Ensure MongoDB is running
   - Check database connection string in `.env` file

## 📚 Additional Resources

- **API Documentation**: `API_DOCUMENTATION.md`
- **Cloudinary Setup**: `CLOUDINARY_SETUP.md`
- **Test Script**: `test-api.ps1`

## 🤝 Support

For issues or questions:
1. Check the API documentation
2. Review error messages in Postman console
3. Verify server logs for detailed error information
4. Ensure all environment variables are properly set

---

**Happy Testing! 🎉**
