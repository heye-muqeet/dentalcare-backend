# Dental Care API - Postman Collection Usage Guide

## Files Created
- `Dental_Care_API.postman_collection.json` - Complete API collection
- `Dental_Care_Environment.postman_environment.json` - Environment variables

## Setup Instructions

### 1. Import Collection and Environment
1. Open Postman
2. Click "Import" in the top left
3. Import both files:
   - `Dental_Care_API.postman_collection.json`
   - `Dental_Care_Environment.postman_environment.json`

### 2. Select Environment
1. In the top right corner, select "Dental Care Environment" from the environment dropdown
2. Make sure the `baseUrl` is set to your server URL (default: `http://localhost:3000/api`)

## Authentication Flow

### Step 1: Register (First Time Setup)
1. Use the **Authentication > Register** request
2. This creates:
   - Organization owner account
   - Organization record
   - Main location record
3. The response will include user details and set authentication cookie

### Step 2: Login (Subsequent Sessions)
1. Use the **Authentication > Login** request
2. The test script automatically extracts the JWT token from cookies
3. Token is stored in `authToken` environment variable for subsequent requests

### Step 3: Test Authentication
1. Use **Authentication > Get Profile** to verify authentication
2. This should return user details with organization and location info

## API Endpoints Overview

### Authentication (`/auth`)
- `POST /register` - Register organization owner
- `POST /login` - User login
- `GET /profile` - Get user profile (requires auth)
- `POST /logout` - User logout

### Dashboard (`/dashboard`)
- `GET /` - Get dashboard statistics (role-based data)

### Users Management (`/users`) - Owner Only
- `GET /` - List organization users (paginated)
- `POST /` - Create new user (doctor/receptionist)
- `PUT /:id` - Update user details
- `DELETE /:id` - Delete user
- `GET /doctors` - List doctors only

### Patients Management (`/patients`)
- `GET /` - List patients (with search and pagination)
- `POST /` - Create new patient (Owner/Receptionist)
- `GET /:id/details` - Get patient details

### Appointments (`/appointments`)
- `GET /` - List appointments (with filters)
- `POST /` - Create appointment (Owner/Receptionist)
- `GET /available-slots` - Get available time slots
- `PUT /:id/cancel` - Cancel appointment

### Services (`/services`)
- `GET /` - List dental services
- `POST /` - Create service (Owner/Receptionist)

### Treatments (`/treatments`)
- `GET /` - List treatments (filtered by role)
- `POST /` - Create treatment (Owner/Doctor)

### Invoices (`/invoices`) - Owner/Receptionist Only
- `GET /` - List invoices (with filters)
- `PUT /:id/mark-paid` - Mark invoice as paid

### Payments (`/payments`)
- `POST /` - Record payment

### Reports (`/reports`)
- `POST /` - Create medical report
- `GET /patient/:patientId` - Get patient reports

### Media (`/media`)
- `POST /upload` - Upload file (multipart/form-data)
- `GET /:id` - Get media file

## Role-Based Access

### Owner
- Full access to all endpoints
- Can manage users, patients, appointments, services, treatments, invoices, expenses

### Receptionist
- Can manage patients, appointments, services, invoices, expenses
- Cannot manage users or create treatments

### Doctor
- Can view dashboard, patients, appointments, services
- Can create treatments and reports
- Cannot manage administrative functions

## Environment Variables

The environment includes these variables that you can customize:
- `baseUrl` - API base URL
- `authToken` - JWT token (auto-populated on login)
- `userId`, `organizationId`, `locationId` - User context IDs
- `patientId`, `doctorId`, `appointmentId`, etc. - Entity IDs for testing

## Usage Tips

1. **Start with Registration**: Create your first organization owner account
2. **Login to Get Token**: The login request automatically sets the auth token
3. **Create Test Data**: Use the create endpoints to add patients, services, etc.
4. **Use Variables**: Replace placeholder IDs with actual IDs from your responses
5. **Check Roles**: Some endpoints are restricted by user role
6. **File Uploads**: Use the media upload endpoint for images, X-rays, documents

## Common Workflow

1. Register/Login → Get authentication
2. Create patients → Add patient records
3. Create services → Define dental services
4. Create users → Add doctors/receptionists (if owner)
5. Create appointments → Schedule patient visits
6. Create treatments → Record completed treatments
7. View reports → Access patient reports and analytics

## Troubleshooting

- **401 Unauthorized**: Make sure you're logged in and token is set
- **403 Forbidden**: Check if your user role has permission for the endpoint
- **400 Bad Request**: Verify required fields in request body
- **File Upload Issues**: Use form-data format for media uploads
