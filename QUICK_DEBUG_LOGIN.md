# 🔍 Quick Debug: Why Login Failing

## Hypothesis
The admin user from seed data might not exist in the database, even though it's configured.

## Debug Steps

### Step 1: Check if seed ran by looking for audit logs

The seeding should create audit logs. Let me check what the exact error is.

The 401 means one of these happened:
1. **User not found**: `admin@joviq.com` doesn't exist in database
2. **User locked**: Account is locked after failed attempts  
3. **Password mismatch**: Password stored doesn't match `Admin@123`

### Step 2: Try Creating User via Registration Endpoint

Since login is failing, let's create a user via the public registration endpoint which should work:

```bash
curl -X POST https://localhost:7001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -k \
  -d '{
    "email": "test@joviq.com",
    "password": "Test@1234",
    "confirmPassword": "Test@1234",
    "fullName": "Test Admin",
    "phoneNumber": "+919999999999",
    "acceptedTerms": true
  }'
```

**If this works**:
- User created successfully
- Database connection is working
- Auth system is working
- **USE THIS NEW USER TO LOGIN**

**If this fails with error**:
- Let me know the exact error
- Something else is wrong with the database or API

### Step 3: Try Login with New User

Once registration succeeds, try logging in:

```bash
curl -X POST https://localhost:7001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -k \
  -d '{
    "email": "test@joviq.com",
    "password": "Test@1234",
    "rememberMe": false
  }'
```

**Expected Response** (Success):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "userSummary": {
      "id": "...",
      "email": "test@joviq.com",
      "name": "Test Admin"
    }
  },
  "message": "Login successful."
}
```

---

## Most Likely Solution

The seed admin data (`admin@joviq.com`) probably **doesn't exist** in the database because:

1. Database was created BEFORE seed data was added to config
2. Seeding only runs if certain conditions are met
3. Or there's a database migration issue

**Solution**: 
1. Create a new user via **REGISTRATION endpoint** (public, no auth needed)
2. Use that new user to login
3. Then you have a working admin account

---

## Action Plan

1. **Try registration** with curl above (or via frontend Sign Up form)
2. **Tell me** if it succeeds or what error you get
3. **If it succeeds**, try login with the new user
4. **If that works**, you're ready to use the system!

---

## Why This Works

- Registration endpoint is **public** (no auth required)
- It directly creates user in database
- We can bypass the seed data issue
- Once you have ONE working user, login should work

---

**Next**: Try the registration curl command above and let me know if it succeeds!
