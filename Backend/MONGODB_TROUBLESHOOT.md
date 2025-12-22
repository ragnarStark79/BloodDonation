# MongoDB Troubleshooting Guide

## Quick Diagnostic

Run this command to check MongoDB status:
```powershell
mongod --version
```

If you get an error, MongoDB may not be installed properly.

## Common Issues & Fixes

### 1. MongoDB Service Not Running
**Check if running:**
```powershell
Get-Service MongoDB
```

**Start the service:**
```powershell
Start-Service MongoDB
```

**If service doesn't exist, start manually:**
```powershell
mongod --dbpath "C:\data\db"
```

### 2. Port 27017 Already in Use
**Find what's using the port:**
```powershell
netstat -ano | findstr :27017
```

**Kill the process (replace PID with actual number):**
```powershell
taskkill /PID <PID> /F
```

### 3. Data Directory Missing
**Create the data directory:**
```powershell
mkdir C:\data\db
```

**Then start MongoDB:**
```powershell
mongod --dbpath "C:\data\db"
```

### 4. MongoDB Not Installed
**Download from:** https://www.mongodb.com/try/download/community

**Or use MongoDB Compass (GUI):**
- Easier to manage
- Visual interface
- Includes MongoDB server

## Alternative: Use MongoDB Atlas (Cloud)
If local MongoDB keeps failing:
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test
   ```

## Test Connection
Once MongoDB is running, test with:
```powershell
mongo
```

Should show MongoDB shell if working!
