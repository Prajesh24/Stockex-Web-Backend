# Admin Middleware Implementation Details

## Overview
The admin middleware has been successfully implemented and integrated into the admin routes. It works in conjunction with the authorization middleware to provide complete access control.

## Middleware Chain

### How Admin Authorization Works

```
Request → authorizedMiddleware → adminMiddleware → Controller
                ↓                        ↓
          Extract JWT token     Check user.role
          Verify JWT            Verify role === 'admin'
          Attach user to req    Attach user to req
          Next → Next           Next → Controller
```

## Middleware Details

### 1. `authorizedMiddleware`
**Location:** `src/middlewears/middlewear.ts`

**What it does:**
- Extracts JWT token from `Authorization: Bearer <token>` header
- Verifies token signature using `JWT_SECRET`
- Fetches user from database using decoded token ID
- Attaches user object to `req.user`
- Passes request to next middleware/controller

**Error Cases:**
- `401 Unauthorized` - No token, invalid format, or invalid token
- `401 Unauthorized` - User not found in database

### 2. `adminMiddleware`
**Location:** `src/middlewears/middlewear.ts`

**What it does:**
- Checks if `req.user` exists (set by authorizedMiddleware)
- Verifies `req.user.role === 'admin'`
- Passes request to controller if authorized
- Returns `403 Forbidden` if user is not admin

**Error Cases:**
- `401 Unauthorized` - No user info attached to request
- `403 Forbidden` - User role is not 'admin'

## Protected Routes

All routes in `src/routes/admin.route.ts` are protected:

```typescript
// Middleware applied to ALL admin routes
router.use(authorizedMiddleware);
router.use(adminMiddleware);

// All routes below are protected
router.post("/users", uploadSingle.single('image'), adminController.createUser);
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", uploadSingle.single('image'), adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
```

## Using Protected Endpoints

### Step 1: Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "fullName": "User Name"
}
```

### Step 2: Promote User to Admin (via MongoDB)
First user must be manually promoted to admin role in MongoDB, or you can use admin endpoints after.

```javascript
// In MongoDB:
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Step 3: Login to Get Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

// Response includes JWT token (valid for 30 days)
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "admin"
  }
}
```

### Step 4: Use Admin Endpoints
Include the token in `Authorization` header:

```bash
GET /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Format

The JWT token structure:

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "admin",
    "iat": 1706525000,
    "exp": 1709203400  // 30 days from creation
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), SECRET)"
}
```

## User Roles

Currently, two roles are supported:

| Role | Access | Can Access Admin Endpoints |
|------|--------|---------------------------|
| `user` | Regular endpoints | ❌ No |
| `admin` | All endpoints | ✅ Yes |

## Error Responses

### Missing Authorization Header
```http
GET /api/admin/users
```
**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized JWT invalid"
}
```

### Invalid Token
```http
GET /api/admin/users
Authorization: Bearer invalid-token
```
**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized JWT unverified"
}
```

### User is Not Admin
```http
GET /api/admin/users
Authorization: Bearer valid-token-but-user-is-not-admin
```
**Response (403):**
```json
{
  "success": false,
  "message": "Forbidden not admin"
}
```

### Token Expired
After 30 days, token expires:
```http
GET /api/admin/users
Authorization: Bearer expired-token
```
**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized JWT unverified"
}
```

## Creating Additional Admins

Once you have an admin account with a valid token, you can create more admin users:

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "email=newadmin@example.com" \
  -F "password=password123" \
  -F "confirmPassword=password123" \
  -F "fullName=New Admin" \
  -F "role=admin" \
  -F "image=@/path/to/image.jpg"
```

## Best Practices

1. **Token Management**
   - Store tokens securely in frontend
   - Don't include tokens in URLs or logs
   - Refresh tokens before expiry (30 days)

2. **Admin Account**
   - Create admin account early in development
   - Use strong passwords for admin accounts
   - Keep admin credentials secure

3. **Error Handling**
   - Always check for authorization errors (401, 403)
   - Handle token expiry gracefully in frontend
   - Log failed authorization attempts

4. **Security**
   - JWT_SECRET is stored in environment variables
   - Never expose JWT_SECRET in code
   - Tokens cannot be revoked (design limitation)
   - Consider token blacklisting for logout functionality

## Testing Admin Middleware

### Postman Collection Example

**1. Register:**
- Method: POST
- URL: `http://localhost:3000/api/auth/register`
- Body (JSON):
  ```json
  {
    "email": "admin@test.com",
    "password": "admin123",
    "confirmPassword": "admin123",
    "fullName": "Admin Test"
  }
  ```

**2. Promote in MongoDB**
**3. Login:**
- Method: POST
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "admin@test.com",
    "password": "admin123"
  }
  ```
- Save token from response

**4. Test Admin Endpoint:**
- Method: GET
- URL: `http://localhost:3000/api/admin/users`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer YOUR_TOKEN_HERE`

## Troubleshooting

**Problem:** Getting 401 Unauthorized on admin endpoints
- **Solution:** Ensure token is valid, not expired, and user role is 'admin'

**Problem:** Getting 403 Forbidden on admin endpoints
- **Solution:** Check user role in database - must be exactly `'admin'`

**Problem:** Token not being recognized
- **Solution:** Ensure header format is exactly `Authorization: Bearer <token>`

**Problem:** User not found when accessing admin endpoints
- **Solution:** Ensure user exists in database and token contains valid user ID
