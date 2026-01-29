# Admin User Management API Documentation

## Overview
This document outlines the Admin API endpoints for complete user management with image upload functionality. All admin endpoints require authentication and admin role authorization.

## Authentication & Authorization

### Middleware Requirements
All admin endpoints are protected by:
1. **`authorizedMiddleware`** - Verifies JWT token and attaches user to request
2. **`adminMiddleware`** - Ensures user has admin role

### How to Get Admin Access
1. Create a user via `/api/auth/register`
2. Update user role to 'admin' in MongoDB (manual or through admin endpoints after first admin is created)
3. Login via `/api/auth/login` to get JWT token
4. Include token in all requests: `Authorization: Bearer <token>`

---

## Admin Endpoints

### 1. Create User (with image)
**POST** `/api/admin/users`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
- email (string, required): User email
- password (string, required): Minimum 6 characters
- confirmPassword (string, required): Must match password
- fullName (string, optional): User's full name
- role (string, optional): 'user' or 'admin' (defaults to 'user')
- image (file, optional): User profile image (JPEG, PNG, GIF, WebP, max 5MB)
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "image": "/uploads/image-1234567890-123456789.jpg",
    "role": "user",
    "createdAt": "2024-01-29T10:00:00Z",
    "updatedAt": "2024-01-29T10:00:00Z"
  }
}
```

**Error Response (400/403):**
```json
{
  "success": false,
  "message": "Email already in use" | "Validation error message"
}
```

---

### 2. Get All Users
**GET** `/api/admin/users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user1@example.com",
      "fullName": "John Doe",
      "image": "/uploads/image-1234567890-123456789.jpg",
      "role": "user",
      "createdAt": "2024-01-29T10:00:00Z",
      "updatedAt": "2024-01-29T10:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "user2@example.com",
      "fullName": "Jane Smith",
      "image": null,
      "role": "admin",
      "createdAt": "2024-01-29T11:00:00Z",
      "updatedAt": "2024-01-29T11:00:00Z"
    }
  ]
}
```

---

### 3. Get User by ID
**GET** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): MongoDB user ID

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "image": "/uploads/image-1234567890-123456789.jpg",
    "role": "user",
    "createdAt": "2024-01-29T10:00:00Z",
    "updatedAt": "2024-01-29T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 4. Update User (with optional image)
**PUT** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**
- `id` (string, required): MongoDB user ID

**Body (all optional):**
```
- email (string): New email address
- fullName (string): New full name
- password (string): New password (will be hashed)
- role (string): 'user' or 'admin'
- image (file): New profile image (JPEG, PNG, GIF, WebP, max 5MB)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com",
    "fullName": "Updated Name",
    "image": "/uploads/image-new-1234567890-123456789.jpg",
    "role": "admin",
    "createdAt": "2024-01-29T10:00:00Z",
    "updatedAt": "2024-01-29T12:00:00Z"
  }
}
```

**Notes:**
- Old image is automatically deleted when new image is uploaded
- If email is changed, system checks for duplicates
- If password is changed, it's automatically hashed

---

### 5. Delete User
**DELETE** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): MongoDB user ID

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Notes:**
- User's profile image is automatically deleted from server
- User record is removed from database

---

## Auth Endpoints (Updated)

### Update Own Profile (with optional image)
**PUT** `/api/auth/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**
- `id` (string, required): User ID (must be own ID unless admin)

**Body (all optional):**
```
- email (string): New email address
- fullName (string): New full name
- password (string): New password (will be hashed)
- image (file): Profile image (JPEG, PNG, GIF, WebP, max 5MB)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "Updated Name",
    "image": "/uploads/image-1234567890-123456789.jpg",
    "role": "user",
    "createdAt": "2024-01-29T10:00:00Z",
    "updatedAt": "2024-01-29T12:00:00Z"
  }
}
```

**Authorization:**
- Users can only update their own profile
- Admins can update any user's profile

---

## File Upload Details

### Image Upload Configuration
- **Field Name:** `image`
- **Supported Formats:** JPEG, PNG, GIF, WebP
- **Max File Size:** 5MB
- **Storage Location:** `/uploads` directory
- **File Naming:** `fieldname-timestamp-randomId.extension`
- **Access URL:** `http://localhost:PORT/uploads/filename`

### Automatic Image Management
- Old images are automatically deleted when replaced
- Images are deleted when user is deleted
- If upload fails, file is automatically cleaned up

---

## Error Handling

### Common Error Responses

**401 Unauthorized (Missing/Invalid Token):**
```json
{
  "success": false,
  "message": "Unauthorized JWT invalid"
}
```

**403 Forbidden (Not Admin):**
```json
{
  "success": false,
  "message": "Forbidden not admin"
}
```

**400 Bad Request (Validation Failed):**
```json
{
  "success": false,
  "message": "[Object] - Email must be a valid email"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Example Usage with cURL

### Create Admin User with Image
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer your-jwt-token" \
  -F "email=newadmin@example.com" \
  -F "password=password123" \
  -F "confirmPassword=password123" \
  -F "fullName=Admin User" \
  -F "role=admin" \
  -F "image=@/path/to/image.jpg"
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your-jwt-token" \
  -F "fullName=Updated Name" \
  -F "image=@/path/to/newimage.jpg"
```

### Get All Users
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer your-jwt-token"
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your-jwt-token"
```

### Update Own Profile
```bash
curl -X PUT http://localhost:3000/api/auth/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your-jwt-token" \
  -F "fullName=My New Name" \
  -F "image=@/path/to/myimage.jpg"
```

---

## File Structure

```
src/
├── config/
│   └── multer.config.ts          # Multer configuration for file uploads
├── controllers/
│   ├── auth.controller.ts        # Auth endpoints (updated with PUT /:id)
│   └── admin/
│       └── admin.controller.ts   # Admin CRUD operations
├── routes/
│   ├── auth.route.ts             # Auth routes (updated with PUT /:id)
│   └── admin.route.ts            # Admin routes
├── middlewears/
│   └── middlewear.ts             # Authorization and admin middleware
├── models/
│   └── user.model.ts             # User model (updated with image field)
├── types/
│   └── user.type.ts              # User type (updated with image field)
└── services/
    └── user.service.ts           # User service (updated with CRUD methods)
```

---

## Notes

- All endpoints return consistent JSON responses with `success`, `message`, and `data` fields
- Authentication is enforced using JWT tokens from login
- Admin middleware ensures only admin users can access admin endpoints
- File uploads use multipart/form-data content type
- Images are stored on the server and served as static files
- Database operations use MongoDB with Mongoose ODM
