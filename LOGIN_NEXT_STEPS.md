# 📋 Next Steps to Fix Login 401 Error

## Current Status
- ✅ API is running on `https://localhost:7001`
- ✅ Web is running on `http://localhost:5173`
- ✅ `.env.local` is configured correctly
- ❌ Login returns 401 Unauthorized

## What We Know
1. The API endpoint is being reached (not a connectivity issue)
2. The login endpoint is responding with 401
3. This means either:
   - The admin user doesn't exist in the database
   - OR the password doesn't match

---

## 🔧 Quick Fix (Recommended)

### Option 1: Register a New User

Since the default admin seed might not have worked, register a new admin account:

**Via Frontend**:
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create account with:
   - Email: `newadmin@joviq.com`
   - Password: `Password@123`
   - Phone: `+919999999999`
   - Agree to terms
4. Click Register
5. Try logging in with new credentials

**OR Via API (cURL)**:
```bash
curl -X POST https://localhost:7001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -k \
  -d '{
    "email": "mytest@joviq.com",
    "password": "Test@1234",
    "confirmPassword": "Test@1234",
    "fullName": "Test User",
    "phoneNumber": "+919999999999",
    "acceptedTerms": true
  }'
```

---

## 🔄 If That Works

Once you can register and login:

1. **Write down your credentials** (you'll need them)
2. **Login successfully** 
3. Now we know:
   - Database is working
   - Auth system is working
   - User can authenticate

---

## 🛠️ If Still Having Issues

### Detailed Diagnostic Steps

**Step 1**: Check if admin user seed ran

Add logging to see what happened. The API should show these logs on startup:

```
Seeded role Admin
Seeded role Student
Seeded role Instructor
...
Seeded default admin user admin@joviq.com
```

**If you see these logs**: Admin user exists
**If you DON'T see these logs**: Seeding didn't run

**Step 2**: If seeding didn't run

The issue is likely the database connection. Check:

1. PostgreSQL is running (check Windows Services)
2. Database `Joviq` exists
3. Connection string in `appsettings.json` is correct:
   ```json
   "DefaultConnection": "Host=localhost;Port=5432;Database=Joviq;Username=postgres;Password=raya"
   ```

**Step 3**: Recreate database from scratch

```bash
# WARNING: This will delete all data!
# 1. Stop API
# 2. In PostgreSQL admin tool, drop database Joviq
# 3. Create new empty database Joviq
# 4. Restart API (it will recreate schema and seed)
```

---

## 🎯 Recommended Action NOW

**Try this**:

1. Go to http://localhost:5173
2. Click "Sign Up" link (bottom of login page)
3. Create new account:
   - Email: `test@example.com`
   - Password: `Test@1234`
   - Name: `Test User`
   - Phone: `+919999999999`
4. Submit registration
5. Go back to login
6. Login with your new credentials

**If this works**: 
- ✅ System is functioning correctly
- ✅ Use these credentials going forward
- ✅ Later, make yourself an admin via API or admin panel

**If this fails**:
- ❌ There's a deeper database issue
- ❌ Let me know the exact error message

---

## 📝 Error Messages & What They Mean

| Message | Meaning | Solution |
|---------|---------|----------|
| `Invalid email or password` | User doesn't exist OR password wrong | Create new user via signup |
| `Email already exists` | That email already registered | Use different email or login |
| `CORS error` | Frontend/API URL mismatch | Hard refresh, check .env.local |
| `Connection refused` | API not running | Restart API |
| `Email verification required` | Email not confirmed | Check registration flow |

---

## 🚀 Once Login Works

After you successfully login:

1. **Note your email and password** for future reference
2. **Explore the dashboard**
3. **Go to Admin Panel** (if your user is admin)
4. **Create test programs** for payment testing
5. **Test the Cashfree payments** with the configured credentials

---

## 📞 If You're Stuck

Tell me:
1. **What error message** do you see on the frontend? (screenshot helpful)
2. **What's in the API logs** when you try to login?
3. **Can you create a new user** via signup or does that also fail?
4. **When the API started**, did you see "Seeded default admin user" message?

With this information, I can help you debug further.

---

## ✅ Success Path

```
Try Registration Flow
    ↓
SUCCESS: User created → Try login → Dashboard
    ↓
FAILURE: Error in registration → DB issue → Need deep debug

Try Login with admin@joviq.com
    ↓
SUCCESS: Logged in → Dashboard
    ↓
FAILURE: 401 error → Try registration instead
```

---

**Next Action**: Try signing up with a new email and password via the frontend. 

Let me know if that works or what error you get!
