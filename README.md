# Dental Care Backend

A NestJS backend application for a dental care management system with MongoDB and Mongoose.

## Features

- **NestJS Framework**: Modern, scalable Node.js framework
- **MongoDB with Mongoose**: NoSQL database with ODM
- **Environment Configuration**: Secure configuration management
- **CORS Support**: Ready for frontend integration
- **User Management**: Complete CRUD operations for users
- **Appointment System**: Schema for appointment management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy the .env file and update the MongoDB URI
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/dental-care
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Users
- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Database Schemas

### User Schema
- firstName: string (required)
- lastName: string (required)
- email: string (required, unique)
- password: string (required)
- role: 'patient' | 'dentist' | 'admin' (default: 'patient')
- phone: string (optional)
- address: string (optional)
- dateOfBirth: Date (optional)
- isActive: boolean (default: true)
- profileImage: string (optional)

### Appointment Schema
- patientId: ObjectId (required)
- dentistId: ObjectId (required)
- appointmentDate: Date (required)
- startTime: string (required)
- endTime: string (required)
- status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
- notes: string (optional)
- treatment: string (optional)
- cost: number (default: 0)
- isPaid: boolean (default: false)

## Project Structure

```
src/
├── config/
│   └── database.config.ts    # Database configuration
├── modules/
│   └── users/
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── schemas/
│   ├── appointment.schema.ts
│   └── user.schema.ts
├── app.module.ts
├── main.ts
└── ...
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `DB_NAME`: Database name
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: JWT secret key (for future authentication)
- `JWT_EXPIRES_IN`: JWT expiration time

## Next Steps

1. Set up authentication and authorization
2. Add more business logic modules (appointments, treatments, etc.)
3. Implement validation pipes
4. Add error handling middleware
5. Set up logging
6. Add API documentation with Swagger