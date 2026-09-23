# 🔧 Fix: Login 401 Unauthorized Error

## Problem
Frontend is getting `401 Unauthorized` when trying to login with `admin@joviq.com` / `Admin@123`

## Root Cause
The admin user may not have been properly seeded in the database, OR the login credentials don't match.

---

## ✅ Solution (Try These Steps in Order)

### Step 1: Hard Refresh Frontend Cache
The `.env.local` file was updated. Browser cache might be stale.

**Windows**: `Ctrl+Shift+R` in browser
**Mac**: `Cmd+Shift+R` in browser
**Or**: Open DevTools (F12) → Application → Storage → Clear All

Then try login again.

---

### Step 2: Verify Frontend is Pointing to Right API
Open DevTools (F12) and check Network tab:

1. Try to login
2. Look at the POST request
3. Check the URL should be: `https://localhost:7001/api/v1/auth/login`
4. NOT `http://localhost:5001/...`

**If URL is wrong**:
- File `web/.env.local` has: `VITE_API_BASE_URL=https://localhost:7001` ✓
- Hard refresh again: `Ctrl+Shift+R`
- Check Network tab again

---

### Step 3: Verify API Database Connection

The connection string in `appsettings.json`:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=Joviq;Username=postgres;Password=raya"
```

This should connect to local PostgreSQL.

**Check if PostgreSQL is running**:
- Windows: PostgreSQL should be running in Services
- Look for `postgres` process in Task Manager

**If not running**:
- Start PostgreSQL service
- Restart API server

---

### Step 4: Restart API to Re-seed Database

The seeding runs on API startup. Let's restart it:

1. **Stop** the API (press Ctrl+C in the API terminal)
2. **Wait** 3 seconds
3. **Start** again: `cd api && dotnet run --project src/Joviq.Lms.Api/Joviq.Lms.Api.csproj`
4. **Wait** for startup (about 10 seconds)
5. **Watch logs** for seed messages

**Look for logs like**:
```
Seeded role Admin
Seeded default admin user admin@joviq.com
```

**If you see these**, admin was seeded successfully.

---

### Step 5: Try Login Again

After API restarts:

1. **Hard refresh** frontend: `Ctrl+Shift+R`
2. Try login with:
   - **Email**: `admin@joviq.com`
   - **Password**: `Admin@123`
   - **Remember Me**: unchecked
3. **Should** see "Login successful"

---

## 🧪 If Still Not Working

Try this manual test:

### Test via API Directly

**Open PowerShell and run**:
```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$body = @{
    email = "admin@joviq.com"
    password = "Admin@123"
    rememberMe = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://localhost:7001/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -ErrorVariable err

if ($err) {
    Write-Host "Error: Login failed"
    Write-Host $err
} else {
    Write-Host "Success: Login worked!"
}
```

**Expected**:
- If successful: You see JSON with `accessToken`
- If failed: You see `401 Unauthorized`

**If this test passes** but frontend fails: Browser cache issue, try Step 1 again

**If this test fails** too: Database or API issue, continue to next step

---

## 🔍 Advanced Troubleshooting

### Check API Logs for Seed Errors

When API starts, it should show seeding logs. **Look for**:

✅ **Good**:
```
Seeded role Admin
Seeded role Student
Seeded role Instructor
Seeded default admin user admin@joviq.com
```

❌ **Bad** (looks like):
```
Failed to seed admin user: ...
Database connection failed: ...
```

**If you see errors**:
1. Check PostgreSQL is running
2. Check connection string is correct
3. Check database `Joviq` exists
4. Restart API

---

### Create Admin User Manually

If seeding keeps failing, create the user manually:

**Option A: Via API (Register endpoint)**
```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$body = @{
    email = "admin@joviq.com"
    password = "Admin@123"
    confirmPassword = "Admin@123"
    fullName = "Joviq Admin"
    phoneNumber = "+919999999999"
    acceptedTerms = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://localhost:7001/api/v1/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Option B: Via PostgreSQL Direct**
This is complex because passwords are hashed. Not recommended unless Option A fails.

---

## 🎯 Complete Fix Checklist

Follow this in order and try login after each step:

- [ ] **Step 1**: Hard refresh frontend (Ctrl+Shift+R)
- [ ] **Step 2**: Verify `.env.local` has correct URL
- [ ] **Step 3**: Check API logs when starting (look for seed messages)
- [ ] **Step 4**: Verify `admin@joviq.com` user exists
- [ ] **Step 5**: Try login
- [ ] **If still fails**: Restart API
- [ ] **Try login again**
- [ ] **If still fails**: Try manual register via API
- [ ] **If all fails**: Check PostgreSQL is running

---

## 📋 Quick Reference

| Issue | Solution |
|-------|----------|
| Still see `http://localhost:5001` in Network tab | Hard refresh (Ctrl+Shift+R) |
| Seed messages not in API logs | PostgreSQL might not be running |
| Can't connect to database | Check connection string, PostgreSQL status |
| Login works via curl but not frontend | Browser cache, hard refresh again |
| Everything fails | Restart API, then restart web server |

---

## ✅ Success Indicators

**Login is working when**:
- ✅ Network tab shows `https://localhost:7001/api/v1/auth/login`
- ✅ Response status is `200` (not 401)
- ✅ Response contains `accessToken`
- ✅ You're redirected to dashboard
- ✅ You see user profile in dashboard

**Login is failing when**:
- ❌ Network tab shows `http://localhost:5001`
- ❌ Response status is `401`
- ❌ Response says `Invalid email or password`
- ❌ You stay on login page

---

## 💡 Pro Tips

1. **Browser DevTools** is your friend:
   - F12 to open
   - Network tab to see requests
   - Console tab for any JavaScript errors
   - Application tab to clear storage

2. **API logs** tell you everything:
   - Check terminal where API is running
   - Look for errors during startup
   - Look for "Seeded" messages

3. **Restart fixes most issues**:
   - Restart API (seeding runs again)
   - Restart web server (picks up new URL)
   - Hard refresh browser (clear cache)

---

**Last Updated**: September 22, 2026
**Problem**: 401 Unauthorized Login Error
**Status**: Solutions provided above
