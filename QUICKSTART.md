# Quick Start Guide - Admin User Management API

## 5-Minute Setup

### 1. Install & Start Server
```bash
cd /Users/prajesh/Documents/Web\ Project\ Sem\ 5/Backend/Stockex-Backend/backend/stockex
npm install  # if needed
npm run dev
```
Server runs on: `http://localhost:3000`

---

## Common Tasks

### Create Your First Admin

#### Step 1: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "confirmPassword": "admin123",
    "fullName": "Test Admin"
  }'
```

#### Step 2: Update Role in MongoDB
```javascript
// In MongoDB shell or Mongo client:
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)
```

#### Step 3: Login & Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```
**Copy the `token` from response**

---

### Create a User (with Image)

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "confirmPassword=password123" \
  -F "fullName=John Doe" \
  -F "role=user" \
  -F "image=@/path/to/image.jpg"
```

**Response includes:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "fullName": "John Doe",
    "image": "/uploads/image-1706525000-123456789.jpg",
    "role": "user"
  }
}
```

**Access image at:** `http://localhost:3000/uploads/image-1706525000-123456789.jpg`

---

### Get All Users
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Update User (Change Role + Image)

```bash
# Get user ID first from GET all users
curl -X PUT http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "role=admin" \
  -F "image=@/path/to/new-image.jpg"
```

---

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Update Your Own Profile

```bash
# Get your token from login response (you must be authenticated)
curl -X PUT http://localhost:3000/api/auth/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "fullName=My New Name" \
  -F "image=@/path/to/my-profile.jpg"
```

---

## Endpoints at a Glance

| Method | Endpoint | Requires Admin | Purpose |
|--------|----------|---|---------|
| POST | `/api/admin/users` | ✅ Yes | Create user with image |
| GET | `/api/admin/users` | ✅ Yes | List all users |
| GET | `/api/admin/users/:id` | ✅ Yes | Get user details |
| PUT | `/api/admin/users/:id` | ✅ Yes | Update user + image |
| DELETE | `/api/admin/users/:id` | ✅ Yes | Delete user |
| POST | `/api/auth/register` | ❌ No | Register |
| POST | `/api/auth/login` | ❌ No | Login (get token) |
| PUT | `/api/auth/:id` | ✅ Token | Update own profile + image |

---

## Image Upload Rules

- ✅ Formats: JPEG, PNG, GIF, WebP
- ✅ Max Size: 5MB
- ✅ Field Name: `image` (in multipart form)
- ✅ Old images auto-deleted on update
- ✅ Images auto-deleted when user deleted
- ✅ Served as static files from `/uploads`

---

## Common Errors & Fixes

### 401 Unauthorized
**Problem:** Token missing or invalid
```
Response: "Unauthorized JWT invalid"
```
**Fix:** Make sure token is included: `Authorization: Bearer <token>`

### 403 Forbidden
**Problem:** User is not admin
```
Response: "Forbidden not admin"
```
**Fix:** Update user role to 'admin' in MongoDB

### 400 Bad Request
**Problem:** Invalid data or file format
```
Response: "Only image files are allowed"
```
**Fix:** Use valid image format (JPEG, PNG, GIF, WebP) and size < 5MB

### 404 Not Found
**Problem:** User doesn't exist
```
Response: "User not found"
```
**Fix:** Check user ID and try again

---

## File Upload with Postman

1. **Create POST request** to `http://localhost:3000/api/admin/users`

2. **Set Headers:**
   - Authorization: Bearer YOUR_TOKEN

3. **Body → form-data:**
   - `email` (text): user@example.com
   - `password` (text): password123
   - `confirmPassword` (text): password123
   - `fullName` (text): John Doe
   - `role` (text): user
   - `image` (file): Select image file

4. **Send** → Done!

---

## Useful MongoDB Commands

```javascript
// View all users
db.users.find().pretty()

// Update user role to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Delete user
db.users.deleteOne({ email: "user@example.com" })

// Find by ID
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })
```

---

## Documentation Files

📄 **API_DOCUMENTATION.md** - Detailed endpoint documentation
📄 **IMPLEMENTATION_SUMMARY.md** - What was built and why
📄 **MIDDLEWARE_DOCUMENTATION.md** - How authentication works
📄 **COMPLETION_CHECKLIST.md** - Full feature checklist

---

## Support

- Check error messages - they're descriptive
- Verify token is valid and not expired (30 days)
- Ensure user role is 'admin' for admin endpoints
- Check file format and size for image uploads
