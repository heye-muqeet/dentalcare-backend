# Dental Care Backend API - Postman Collection

This Postman collection contains all the API endpoints for the Dental Care Management System backend.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Collection Structure](#collection-structure)
- [Environment Variables](#environment-variables)
- [Usage Instructions](#usage-instructions)
- [API Endpoints Overview](#api-endpoints-overview)
- [Testing Workflow](#testing-workflow)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

1. **Postman Desktop App** - Download and install from [postman.com](https://www.postman.com/downloads/)
2. **Dental Care Backend** - Make sure your backend server is running
3. **Database** - Ensure your database is properly configured and running

### Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `DentalCare_API_Collection.json` file
4. The collection will be imported with all endpoints organized by functionality

## 🔐 Authentication

This API uses **JWT (JSON Web Token)** authentication with cookies. Here's how it works:

### Authentication Flow

1. **Register** - Create a new user account (first time setup)
2. **Login** - Authenticate and receive JWT token (stored in cookies)
3. **Use Protected Endpoints** - All subsequent requests will automatically include the token
4. **Logout** - Clear the authentication token

### Important Notes

- The JWT token is automatically stored in cookies by the backend
- Most endpoints require authentication (except register and login)
- The token is automatically sent with each request
- No need to manually add Authorization headers

## 📁 Collection Structure

The collection is organized into the following folders:

### 🔑 Authentication
- **Register User** - Create new user account
- **Login User** - Authenticate user
- **Get Profile** - Get current user profile
- **Logout** - Clear authentication

### 📊 Dashboard
- **Get Dashboard Data** - Get overview statistics

### 👥 Users
- **Get All Users** - List all users in organization
- **Get Doctors** - List all doctors
- **Create User** - Add new user
- **Update User** - Modify user information
- **Delete User** - Remove user
- **Change Password** - Update user password

### 👤 Patients
- **Get All Patients** - List all patients
- **Create Patient** - Add new patient
- **Get Patient by ID** - Get specific patient
- **Get Patient Details** - Get detailed patient info
- **Update Patient** - Modify patient information

### 📅 Appointments
- **Get All Appointments** - List all appointments
- **Get Available Slots** - Get available time slots
- **Create Appointment** - Schedule new appointment
- **Get Appointment by ID** - Get specific appointment
- **Update Appointment** - Modify appointment
- **Cancel Appointment** - Cancel appointment

### 🏥 Treatments
- **Get All Treatments** - List all treatments
- **Create Treatment** - Add new treatment
- **Get Treatment by ID** - Get specific treatment
- **Update Treatment** - Modify treatment

### 💰 Invoices
- **Get All Invoices** - List all invoices
- **Create Invoice** - Generate new invoice
- **Get Invoice by ID** - Get specific invoice
- **Update Invoice** - Modify invoice
- **Mark Invoice as Paid** - Mark invoice as paid

### 💳 Payments
- **Get All Payments** - List all payments
- **Create Payment** - Record new payment

### 💸 Expenses
- **Get All Expenses** - List all expenses
- **Get Expense Summary** - Get expense statistics
- **Create Expense** - Add new expense
- **Get Expense by ID** - Get specific expense
- **Update Expense** - Modify expense
- **Delete Expense** - Remove expense

### 🛠️ Services
- **Get All Services** - List all services
- **Create Service** - Add new service
- **Get Service by ID** - Get specific service
- **Update Service** - Modify service
- **Delete Service** - Remove service

### 📋 Reports
- **Create Report** - Generate new report
- **Get Patient Reports** - Get reports for patient
- **Get Treatment Reports** - Get reports for treatment
- **Update Report** - Modify report
- **Delete Report** - Remove report

### 📁 Media
- **Upload Media** - Upload files
- **Get Media by ID** - Get specific media

## 🌍 Environment Variables

The collection uses the following environment variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:1337` | Base URL of your backend server |
| `token` | (empty) | JWT token (automatically managed) |

### Setting Up Environment Variables

1. In Postman, click on the **Environment** dropdown
2. Click **New** to create a new environment
3. Add the variables above
4. Save the environment

## 📖 Usage Instructions

### Step 1: Start Your Backend Server

```bash
# Navigate to your project directory
cd dentalcare-backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
# or
sails lift
```

### Step 2: Import and Configure Collection

1. Import the `DentalCare_API_Collection.json` file into Postman
2. Set up environment variables
3. Update the `baseUrl` variable if your server runs on a different port

### Step 3: Test Authentication

1. **Register a new user** (first time only):
   - Use the "Register User" request
   - This creates an organization, location, and owner user

2. **Login**:
   - Use the "Login User" request
   - The JWT token will be automatically stored in cookies

### Step 4: Test Other Endpoints

Once authenticated, you can test all other endpoints. The authentication token will be automatically included in requests.

## 🔍 API Endpoints Overview

### Base URL
```
http://localhost:1337/api
```

### Common Response Format

All endpoints return responses in this format:

```json
{
  "status": "success|error",
  "message": "Human readable message",
  "data": {
    // Response data
  }
}
```

### Error Response Format

```json
{
  "status": "error",
  "error": "Error code",
  "message": "Error description"
}
```

## 🧪 Testing Workflow

### Recommended Testing Order

1. **Authentication**
   - Register User
   - Login User
   - Get Profile

2. **Core Data**
   - Create User (doctor/receptionist)
   - Create Patient
   - Create Service

3. **Appointments & Treatments**
   - Create Appointment
   - Create Treatment
   - Update/Cancel Appointment

4. **Financial**
   - Create Invoice
   - Create Payment
   - Create Expense

5. **Reports & Media**
   - Create Report
   - Upload Media

### Testing Tips

- **Use realistic data** - Use proper names, emails, and phone numbers
- **Test error scenarios** - Try invalid data to test validation
- **Check responses** - Verify the response format and data
- **Test relationships** - Ensure related data is properly linked

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Refused
- **Problem**: Cannot connect to server
- **Solution**: Ensure your backend server is running on the correct port

#### 2. Authentication Errors
- **Problem**: 401 Unauthorized errors
- **Solution**: 
  - Make sure you've logged in successfully
  - Check if the token hasn't expired
  - Try logging in again

#### 3. Validation Errors
- **Problem**: 400 Bad Request with validation errors
- **Solution**: Check the request body format and required fields

#### 4. Database Errors
- **Problem**: 500 Internal Server Error
- **Solution**: Check your database connection and configuration

### Debug Steps

1. **Check Server Logs** - Look at your backend console for error messages
2. **Verify Database** - Ensure your database is running and accessible
3. **Test with curl** - Try the same request with curl to isolate the issue
4. **Check Network** - Verify network connectivity and firewall settings

### Getting Help

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the database is properly configured
4. Check that all required dependencies are installed

## 📝 Notes

- **Date Format**: Use ISO format (`YYYY-MM-DDTHH:mm:ss.sssZ`) for dates
- **Time Format**: Use 24-hour format (`HH:MM`) for times
- **File Uploads**: Use form-data for file uploads
- **Authentication**: JWT tokens are automatically managed via cookies
- **Organization/Location**: All data is scoped to the user's organization and location

## 🤝 Contributing

If you find issues or want to improve the collection:

1. Test all endpoints thoroughly
2. Update the collection with any new endpoints
3. Keep the documentation up to date
4. Follow the existing naming conventions

---

**Happy Testing! 🎉**
