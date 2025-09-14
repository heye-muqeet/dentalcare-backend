# Dental Care Management System - API Documentation

## Overview

This is a comprehensive role-based dental care management system with hierarchical access control. The system supports multiple organizations, branches, and user roles with specific permissions.

## Role Hierarchy

```
Super Admin (1 only)
    ↓
Organization (1 → many)
    ↓
Organization Admin (1 → many per org)
    ↓
Branch (1 → many per org)
    ↓
Branch Admin (1 per branch)
    ↓
Receptionists & Doctors (many per branch)
    ↓
Patients (many per branch)
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "super_admin" | "organization_admin" | "branch_admin" | "doctor" | "receptionist" | "patient"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "super_admin",
    "organizationId": "org_id",
    "branchId": "branch_id",
    "profileImage": "image_url",
    "isActive": true
  },
  "access_token": "jwt_token",
  "role": "super_admin",
  "organizationId": "org_id",
  "branchId": "branch_id"
}
```

### Create Super Admin
```http
POST /auth/super-admin
Content-Type: application/json

{
  "username": "superadmin",
  "firstName": "Super",
  "lastName": "Admin",
  "email": "superadmin@dentalcare.com",
  "password": "SuperAdmin123!"
}
```

### Create Organization Admin
```http
POST /auth/organization-admin
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "orgadmin@example.com",
  "password": "password123",
  "phone": "1234567890",
  "organizationId": "org_id"
}
```

### Create Branch Admin
```http
POST /auth/branch-admin
Authorization: Bearer <organization-admin-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "branchadmin@example.com",
  "password": "password123",
  "phone": "1234567890",
  "branchId": "branch_id",
  "organizationId": "org_id"
}
```

### Create Doctor
```http
POST /auth/doctor
Authorization: Bearer <branch-admin-token>
Content-Type: application/json

{
  "firstName": "Dr. John",
  "lastName": "Smith",
  "email": "doctor@example.com",
  "password": "password123",
  "phone": "1234567890",
  "specialization": "General Dentistry",
  "licenseNumber": "DENT123456",
  "branchId": "branch_id",
  "organizationId": "org_id"
}
```

### Create Receptionist
```http
POST /auth/receptionist
Authorization: Bearer <branch-admin-token>
Content-Type: application/json

{
  "firstName": "Mary",
  "lastName": "Johnson",
  "email": "receptionist@example.com",
  "password": "password123",
  "phone": "1234567890",
  "branchId": "branch_id",
  "organizationId": "org_id"
}
```

### Create Patient
```http
POST /auth/patient
Authorization: Bearer <receptionist-token>
Content-Type: application/json

{
  "firstName": "Patient",
  "lastName": "Name",
  "email": "patient@example.com",
  "password": "password123",
  "phone": "1234567890",
  "branchId": "branch_id",
  "organizationId": "org_id"
}
```

---

## 🏢 Organization Management

### Get All Organizations
```http
GET /organizations
Authorization: Bearer <token>
```

### Get Organization by ID
```http
GET /organizations/:id
Authorization: Bearer <token>
```

### Create Organization
```http
POST /organizations
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "name": "Dental Care Center",
  "description": "Premium dental care services",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001",
  "phone": "1234567890",
  "email": "info@dentalcare.com",
  "website": "https://dentalcare.com"
}
```

### Update Organization
```http
PATCH /organizations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Organization
```http
DELETE /organizations/:id
Authorization: Bearer <super-admin-token>
```

### Get Organization Admins
```http
GET /organizations/:id/admins
Authorization: Bearer <token>
```

### Create Organization Admin
```http
POST /organizations/:id/admins
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "Name",
  "email": "admin@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### Get Organization Stats
```http
GET /organizations/:id/stats
Authorization: Bearer <token>
```

---

## 🏥 Branch Management

### Get All Branches
```http
GET /branches
Authorization: Bearer <token>
```

### Get Branch by ID
```http
GET /branches/:id
Authorization: Bearer <token>
```

### Create Branch
```http
POST /branches
Authorization: Bearer <organization-admin-token>
Content-Type: application/json

{
  "name": "Downtown Branch",
  "description": "Main downtown location",
  "address": "456 Oak St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10002",
  "phone": "1234567891",
  "email": "downtown@dentalcare.com",
  "services": ["General Dentistry", "Orthodontics", "Cosmetic"],
  "operatingHours": {
    "monday": { "open": "09:00", "close": "17:00", "isOpen": true },
    "tuesday": { "open": "09:00", "close": "17:00", "isOpen": true },
    "wednesday": { "open": "09:00", "close": "17:00", "isOpen": true },
    "thursday": { "open": "09:00", "close": "17:00", "isOpen": true },
    "friday": { "open": "09:00", "close": "17:00", "isOpen": true },
    "saturday": { "open": "09:00", "close": "13:00", "isOpen": true },
    "sunday": { "open": "09:00", "close": "13:00", "isOpen": false }
  },
  "branchAdminFirstName": "Branch",
  "branchAdminLastName": "Admin",
  "branchAdminEmail": "branchadmin@example.com",
  "branchAdminPassword": "password123",
  "branchAdminPhone": "1234567892"
}
```

### Update Branch
```http
PATCH /branches/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Branch Name",
  "description": "Updated description"
}
```

### Delete Branch
```http
DELETE /branches/:id
Authorization: Bearer <token>
```

### Get Branch Admins
```http
GET /branches/:id/admins
Authorization: Bearer <token>
```

### Get Branch Doctors
```http
GET /branches/:id/doctors
Authorization: Bearer <token>
```

### Get Branch Receptionists
```http
GET /branches/:id/receptionists
Authorization: Bearer <token>
```

### Get Branch Patients
```http
GET /branches/:id/patients
Authorization: Bearer <token>
```

### Get Branch Stats
```http
GET /branches/:id/stats
Authorization: Bearer <token>
```

---

## 📁 File Upload Endpoints

### Upload Image
```http
POST /upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
folder: "dental-care/profile-images" (optional)
```

### Upload Document
```http
POST /upload/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <document_file>
folder: "dental-care/documents" (optional)
```

### Delete File
```http
DELETE /upload/:publicId
Authorization: Bearer <token>
```

### Get File Info
```http
GET /upload/:publicId
Authorization: Bearer <token>
```

---

## 🔒 Permission Matrix

| Role | Organizations | Branches | Doctors | Receptionists | Patients | Super Admin |
|------|---------------|----------|---------|---------------|----------|-------------|
| Super Admin | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Self |
| Organization Admin | ✅ Own | ✅ Own Org | ✅ Own Org | ✅ Own Org | ✅ Own Org | ❌ |
| Branch Admin | ❌ | ✅ Own | ✅ Own Branch | ✅ Own Branch | ✅ Own Branch | ❌ |
| Doctor | ❌ | ❌ | ❌ | ❌ | ✅ Own Branch | ❌ |
| Receptionist | ❌ | ❌ | ❌ | ❌ | ✅ Own Branch | ❌ |
| Patient | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Getting Started

1. **Start the application:**
   ```bash
   npm run start:dev
   ```

2. **Login as Super Admin:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "superadmin@dentalcare.com",
       "password": "SuperAdmin123!",
       "role": "super_admin"
     }'
   ```

3. **Create your first organization:**
   ```bash
   curl -X POST http://localhost:3000/organizations \
     -H "Authorization: Bearer <your-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Your Dental Practice",
       "address": "123 Main St",
       "city": "Your City",
       "state": "Your State",
       "country": "Your Country",
       "postalCode": "12345",
       "phone": "1234567890"
     }'
   ```

4. **Create branches and users as needed following the hierarchy.**

---

## 📝 Notes

- All passwords are hashed using bcrypt
- JWT tokens expire in 7 days (configurable)
- File uploads are stored on Cloudinary
- All timestamps are in UTC
- The system automatically creates a Branch Admin when a branch is created
- No self-signup is allowed - all accounts are created by higher-level roles
