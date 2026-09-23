# Login 401 Unauthorized - Troubleshooting Guide

## Issue
Frontend is getting 401 Unauthorized when trying to login.

## Default Credentials

**Email**: `admin@joviq.com`
**Password**: `Admin@123`

These should have been seeded automatically when the API started.

---

## Test Login with cURL

```bash
# Test the login endpoint directly
curl -X POST https://localhost:7001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -k \
  -d '{
    "email": "admin@joviq.com",
    "password": "Admin@123",
    "rememberMe": false
  }'
```

**Expected Response** (Success):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ0eXAi...",
    "refreshToken": "...",
    "userSummary": { ... }
  },
  "message": "Login successful."
}
```

**Actual Response** (Error):
```json
{
  "title": "Invalid email or password.",
  "status": 401
}
```

---

## Possible Causes & Solutions

### 1. Seed Admin User Not Created
**Check**: Query database for admin user
```sql
SELECT * FROM "AspNetUsers" WHERE "Email" = 'admin@joviq.com';
```

**If not found**:
- Restart API (seeding runs on startup)
- Check API logs for seed errors
- Manually create user (see below)

### 2. Wrong Credentials
**Try**: Both email and password exactly as shown:
- Email: `admin@joviq.com` (all lowercase)
- Password: `Admin@123` (exactly, case-sensitive)

### 3. Account Status
**Check**: Verify account is active
```sql
SELECT "Id", "Email", "AccountStatus", "EmailConfirmed" 
FROM "AspNetUsers" 
WHERE "Email" = 'admin@joviq.com';
```

**Should show**:
- `AccountStatus`: Active (not Locked, Suspended, etc.)
- `EmailConfirmed`: true

### 4. User Role
**Check**: Verify user has Admin role
```sql
SELECT 
  u."Email", 
  r."Name" as Role
FROM "AspNetUsers" u
LEFT JOIN "AspNetUserRoles" ur ON u."Id" = ur."UserId"
LEFT JOIN "AspNetRoles" r ON ur."RoleId" = r."Id"
WHERE u."Email" = 'admin@joviq.com';
```

---

## Manual User Creation (If Seeding Failed)

### Option 1: Via PostgreSQL (Direct)
```sql
-- First, check if user exists
SELECT * FROM "AspNetUsers" WHERE "Email" = 'admin@joviq.com';

-- If not, create user (you'll need to know the password hash)
-- This is complex, use Option 2 instead
```

### Option 2: Restart API with Fresh Database
```bash
# Stop API
# Delete: api/bin and api/obj (build artifacts)
# Delete PostgreSQL database or clear all tables
# Restart API (seeding will run automatically)
```

### Option 3: Use Admin Panel (After First Login)
```
Once logged in with first admin:
1. Go to Admin Panel
2. Create new admin user
3. Set credentials
```

---

## Environment File Issue (Recently Fixed)

The frontend `.env.local` was recently changed:
```diff
- VITE_API_BASE_URL=http://localhost:5001
+ VITE_API_BASE_URL=https://localhost:7001
```

**If still seeing old URL**: 
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache completely
- Check Network tab in DevTools to confirm new URL

---

## API Server Check

### Verify API is Running Correctly
```bash
# Get API health
curl https://localhost:7001 -k

# Check if Auth endpoints exist
curl https://localhost:7001/api/v1/auth/providers -k -s | jq

# View API logs
# Check terminal window running the API
```

### Check Database Connection
```bash
# Via psql
psql -h localhost -U postgres -d Joviq

# Then in psql:
\dt  -- List tables
SELECT COUNT(*) FROM "AspNetUsers";
```

---

## Fix Steps (In Order)

### Step 1: Hard Refresh Frontend
- **Windows**: Ctrl+Shift+R in browser
- **Mac**: Cmd+Shift+R in browser
- OR: Clear browser cache completely

### Step 2: Verify API URL
- Open DevTools (F12)
- Go to Network tab
- Try login
- Check the request URL in Network tab
- **Should be**: `https://localhost:7001/api/v1/auth/login`
- **NOT**: `http://localhost:5001/...`

### Step 3: Test with curl
```bash
curl -X POST https://localhost:7001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -k \
  -d '{"email":"admin@joviq.com","password":"Admin@123","rememberMe":false}'
```

If this works, the problem is frontend-side (browser cache)
If this fails, the problem is API-side (credentials or database)

### Step 4: Check Database
```sql
-- Connect to database
psql -h localhost -U postgres -d Joviq

-- Verify admin user exists
SELECT * FROM "AspNetUsers" WHERE "Email" = 'admin@joviq.com';

-- Should return 1 row with Active status and EmailConfirmed = true
```

### Step 5: Restart if Needed
```bash
# Stop API (Ctrl+C in API terminal)
# Restart API
# This will re-run seeding
```

---

## Common Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| `Invalid email or password` | Wrong credentials or user not found | Verify creds, check DB, reseed |
| `Account is locked` | Too many failed login attempts | Unlock via SQL or restart |
| `Email not verified` | User created but didn't verify email | Check AccountStatus, verify manually |
| `CORS error` | Frontend/API URL mismatch | Check .env.local URL |
| `Connection refused` | API not running | Start API server |

---

## Quick Debug Checklist

- [ ] Frontend URL is `https://localhost:7173` (not 5001)
- [ ] API URL shows `https://localhost:7001` (not 5001)
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Credentials exact: `admin@joviq.com` / `Admin@123`
- [ ] API server running (check terminal)
- [ ] Admin user exists in database
- [ ] Admin user status is Active
- [ ] Admin user has Admin role

---

## Still Having Issues?

1. **Check API logs** in the terminal running the API
2. **Check browser console** (F12 → Console tab)
3. **Check Network tab** to see actual request/response
4. **Check database** via psql
5. **Restart everything**:
   ```bash
   # Stop both web and API
   # Restart API first
   # Wait 10 seconds
   # Restart web
   # Try login again
   ```

---

## Success Indicators

✅ **Login works when**:
- You see `Login successful` message
- You're redirected to dashboard
- Token appears in localStorage
- Authenticated requests work

🔴 **Login fails when**:
- You see `Invalid email or password` (user not found or wrong password)
- Browser shows CORS error (frontend/API URL mismatch)
- Network tab shows 401 response
- Network tab shows 404 (endpoint doesn't exist)

---

**Last Updated**: September 22, 2026
**Status**: Troubleshooting Guide
