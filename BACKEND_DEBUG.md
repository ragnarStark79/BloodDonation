# Blood Request System - Backend Debug Guide

## ✅ Current Status
- Backend is receiving POST requests at `/api/requests/org`
- User authentication is working (userId: 69419c16018bbef639affb8f)
- Request body is being received but seems incomplete

## 🔍 Debugging Steps

### Step 1: Check if all required fields are being sent
From the logs, we can see:
- bloodGroup: ✓
- component: ✓
- unitsNeeded: ✓
- urgency: ✓
- requiredBy: ✓
- contactPerson: ✓

**Missing from logs:**
- contactPhone
- caseDetails

### Step 2: Verify Request Model Required Fields
The Request model requires:
- bloodGroup ✓
- unitsNeeded ✓
- contactPerson ✓
- contactPhone ❌ (check if being sent)
- caseDetails ❌ (check if being sent)

### Step 3: Check Frontend Form Submission
The CreateRequestModal should be sending all fields. If contactPhone and caseDetails are missing, the backend will return:
- 400 error with message "Contact phone is required" OR
- 400 error with message "Case details are required"

But we're getting a 500 error, which suggests something else is wrong.

### Step 4: Possible Issues
1. **Mongoose validation error** - Model validation is failing
2. **Database connection issue** - Can't save to DB
3. **Data type mismatch** - Some field has wrong type
4. **Missing required field** - But should give 400, not 500

### Step 5: Solution
The backend code now has better logging. Check the full console output for:
- ❌ error messages
- The complete request body
- The organization data
- The exact error that's being thrown

## 🔧 Quick Fix
If the issue persists, try:
1. Check the backend console for the FULL error message
2. Verify the form is sending contactPhone and caseDetails
3. Check if the database is connected properly
