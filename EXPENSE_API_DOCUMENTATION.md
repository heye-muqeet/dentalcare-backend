# Expense Management API Documentation

This document describes the CRUD API endpoints for managing expenses in the dental management system.

## Authentication
All expense endpoints require authentication. The user must be logged in and have appropriate role permissions.

## Role-based Access Control
- **Find/View Operations**: Owner, Receptionist, or Doctor
- **Create/Update Operations**: Owner or Receptionist only
- **Delete Operations**: Owner only

## Endpoints

### 1. Create Expense
**POST** `/api/expenses`

Creates a new expense record.

**Request Body:**
```json
{
  "description": "Office supplies",
  "amount": 150.50,
  "date": 1698764400000,
  "category": "supplies",
  "notes": "Pens, papers, and forms"
}
```

**Required Fields:**
- `description` (string)
- `amount` (number, must be positive)
- `category` (string)

**Optional Fields:**
- `date` (number, timestamp - defaults to current date)
- `notes` (string)

**Valid Categories:**
- `rent`
- `utilities`
- `supplies`
- `equipment`
- `salary`
- `maintenance`
- `other`

**Response:**
```json
{
  "status": "success",
  "message": "Expense created successfully",
  "data": {
    "id": 1,
    "expenseNumber": "EXP-202310-0001",
    "description": "Office supplies",
    "amount": 150.50,
    "date": 1698764400000,
    "category": "supplies",
    "notes": "Pens, papers, and forms",
    "organization": 1,
    "location": 1,
    "addedBy": 1,
    "createdAt": 1698764400000,
    "updatedAt": 1698764400000
  }
}
```

### 2. Get All Expenses
**GET** `/api/expenses`

Retrieves paginated list of expenses with optional filtering.

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `startDate` (string, optional) - Filter expenses from this date (ISO format)
- `endDate` (string, optional) - Filter expenses until this date (ISO format)
- `page` (number, optional, default: 1) - Page number for pagination
- `limit` (number, optional, default: 10) - Number of records per page

**Example Request:**
```
GET /api/expenses?category=supplies&startDate=2023-10-01&endDate=2023-10-31&page=1&limit=5
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "expenses": [
      {
        "id": 1,
        "expenseNumber": "EXP-202310-0001",
        "description": "Office supplies",
        "amount": 150.50,
        "date": 1698764400000,
        "category": "supplies",
        "notes": "Pens, papers, and forms",
        "organization": 1,
        "location": 1,
        "addedBy": {
          "id": 1,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "createdAt": 1698764400000,
        "updatedAt": 1698764400000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 25,
      "pages": 5
    },
    "summary": {
      "totalAmount": 1250.75,
      "count": 25
    }
  }
}
```

### 3. Get Single Expense
**GET** `/api/expenses/:id`

Retrieves a specific expense by ID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "expenseNumber": "EXP-202310-0001",
    "description": "Office supplies",
    "amount": 150.50,
    "date": 1698764400000,
    "category": "supplies",
    "notes": "Pens, papers, and forms",
    "organization": 1,
    "location": 1,
    "addedBy": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "createdAt": 1698764400000,
    "updatedAt": 1698764400000
  }
}
```

### 4. Update Expense
**PUT** `/api/expenses/:id`

Updates an existing expense. Only provided fields will be updated.

**Request Body (all fields optional):**
```json
{
  "description": "Updated office supplies",
  "amount": 175.25,
  "date": 1698764400000,
  "category": "equipment",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Expense updated successfully",
  "data": {
    "id": 1,
    "expenseNumber": "EXP-202310-0001",
    "description": "Updated office supplies",
    "amount": 175.25,
    "date": 1698764400000,
    "category": "equipment",
    "notes": "Updated notes",
    "organization": 1,
    "location": 1,
    "addedBy": 1,
    "createdAt": 1698764400000,
    "updatedAt": 1698850800000
  }
}
```

### 5. Delete Expense
**DELETE** `/api/expenses/:id`

Permanently deletes an expense record. Only owners can delete expenses.

**Response:**
```json
{
  "status": "success",
  "message": "Expense deleted successfully"
}
```

### 6. Get Expense Summary
**GET** `/api/expenses/summary`

Retrieves expense summary grouped by category with optional date filtering.

**Query Parameters:**
- `startDate` (string, optional) - Filter expenses from this date (ISO format)
- `endDate` (string, optional) - Filter expenses until this date (ISO format)

**Example Request:**
```
GET /api/expenses/summary?startDate=2023-10-01&endDate=2023-10-31
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "timePeriods": {
      "total": {
        "amount": 11000.00,
        "count": 2
      },
      "thisYear": {
        "amount": 11000.00,
        "count": 2
      },
      "thisMonth": {
        "amount": 0.00,
        "count": 0
      },
      "thisWeek": {
        "amount": 0.00,
        "count": 0
      }
    },
    "byCategory": [
      {
        "category": "supplies",
        "totalAmount": 450.75,
        "count": 3
      },
      {
        "category": "equipment",
        "totalAmount": 800.00,
        "count": 2
      },
      {
        "category": "utilities",
        "totalAmount": 300.50,
        "count": 4
      }
    ],
    "dateRange": {
      "startDate": "2023-10-01",
      "endDate": "2023-10-31"
    }
  }
}
```

## Error Responses

### Validation Errors
```json
{
  "status": "error",
  "error": {
    "code": "EXPENSE_001",
    "message": "Amount must be a positive number"
  }
}
```

```json
{
  "status": "error",
  "error": {
    "code": "EXPENSE_002",
    "message": "Invalid category. Must be one of: rent, utilities, supplies, equipment, salary, maintenance, other"
  }
}
```

### Authentication/Authorization Errors
```json
{
  "status": "error",
  "error": "User location is not available"
}
```

### Not Found Error
```json
{
  "status": "error",
  "error": "NOT_FOUND"
}
```

### Server Error
```json
{
  "status": "error",
  "error": "SERVER_ERROR"
}
```

## Notes

1. **Expense numbers are automatically generated** in the format `EXP-YYYYMM-NNNN` where YYYY is the year, MM is the month, and NNNN is a sequential number
2. All expenses are automatically associated with the authenticated user's organization and location
3. The `addedBy` field is automatically set to the authenticated user's ID
4. Dates are stored as Unix timestamps (milliseconds since epoch)
5. Category values are automatically converted to lowercase for consistency
6. Pagination is available on the main list endpoint for better performance
7. The summary endpoint provides useful analytics for reporting purposes
8. All monetary amounts should be provided as numbers (not strings)
9. Soft delete is not implemented - expenses are permanently deleted when using the delete endpoint 