# 🔍 Understanding "Incoming Requests" vs "My Requests"

## 📊 The Two Different Request Pages

Your organization dashboard has **TWO different pages** for viewing blood requests, and they serve different purposes:

---

## 1️⃣ **My Requests** (`/org/requests`)

### **Who sees this:** Hospitals (or Hospital+Blood Bank)

### **What it shows:**
Blood requests that **YOU created** when your hospital needs blood.

### **Purpose:**
- Track YOUR hospital's blood needs
- Manage YOUR requests
- Assign donors to YOUR requests
- Mark YOUR requests as fulfilled

### **Example:**
```
Your Hospital: "City Hospital"
You created 3 requests:
  - O+ blood, 2 units, CRITICAL
  - A- blood, 1 unit, HIGH  
  - B+ blood, 3 units, MEDIUM
```

**These show in YOUR "My Requests" page** ✅

---

## 2️⃣ **Incoming Requests** (`/org/incoming`)

### **Who sees this:** Blood Banks (or Hospital+Blood Bank)

### **What it shows:**
Blood requests from **OTHER hospitals** that you might be able to fulfill from your inventory.

### **Purpose:**
- See what OTHER hospitals need
- Help fulfill requests if you have matching blood
- Reserve units for hospitals
- Track what you're providing to others

### **Example:**
```
Your Blood Bank: "City Blood Bank"
You have O+ and A+ in inventory

Other hospitals' requests:
  - Metro Hospital needs O+, 2 units (YOU CAN HELP!)
  - General Hospital needs A+, 1 unit (YOU CAN HELP!)
  - District Hospital needs AB-, 3 units (You don't have AB-)
```

**These show in YOUR "Incoming Requests" page** ✅

---

## 🎯 **The Confusion Explained**

### **What You Saw:**

When you were logged in as **Blood Bank**, you saw 10 requests in "Incoming Requests".

### **Why You Saw Them:**

Those requests were from **OTHER organizations** (including potentially your hospital account if you're testing with multiple accounts).

### **This is CORRECT behavior!** ✅

If you have 2 test accounts:
- **Account A:** Hospital "City Hospital"
- **Account B:** Blood Bank "City Blood Bank"

**Flow:**
1. Login as **Account A** (Hospital)
2. Create a blood request for O+
3. Logout
4. Login as **Account B** (Blood Bank)  
5. Go to "Incoming Requests"
6. **YOU WILL SEE the request from City Hospital!** ✅

**Because the blood bank is supposed to see requests from hospitals!**

---

## ⚠️ **What Went Wrong**

When I ran the cleanup script, it deleted:
- ❌ Test data (good)
- ❌ Your legitimate hospital requests (bad!)

**I should have asked first instead of automatically cleaning everything.**

---

## 🛠️ **Going Forward: Proper Workflow**

### **Testing the System Properly:**

#### **Step 1: Create Hospital Request**
```
Login: Hospital User
Page: /org/requests (My Requests)
Action: Click "Create Request"
Result: New request created
```

#### **Step 2: Add Blood Bank Inventory**
```
Login: Blood Bank User  
Page: /org/inventory
Action: Add blood unit matching hospital's need
Result: Blood unit added
```

#### **Step 3: View Incoming Request**
```
Login: Blood Bank User
Page: /org/incoming (Incoming Requests)
Result: SEE the hospital's request ✅
```

#### **Step 4: Reserve Units**
```
Still as: Blood Bank User
Page: /org/incoming
Action: Click "Reserve Units" on the request
Result: Units reserved for hospital
```

---

## 🧪 **Safe Cleanup Script**

Created: `Backend/clean-requests-safe.js`

**Features:**
- Shows what will be deleted BEFORE deleting
- Asks for confirmation
- Options:
  1. Delete ALL requests
  2. Delete only OLD requests (>30 days)
  3. Delete only FULFILLED/CANCELLED
  4. Delete specific status
  5. Cancel

**Usage:**
```bash
cd Backend
node clean-requests-safe.js
```

---

## ✅ **Summary**

### **"My Requests" = Requests YOU created**
- Your hospital needs blood
- You manage your requests here

### **"Incoming Requests" = Requests from OTHERS**
- Other hospitals need blood
- You help fulfill them if you can

### **Both pages can show requests at the same time:**
- Same request appears in hospital's "My Requests"
- AND in blood bank's "Incoming Requests"
- **This is correct!** Different views of the same data.

---

## 🎯 **What To Do Now**

1. **Recreate your hospital requests** (if they were important)
2. **Use the system properly** with the understanding above
3. **Use safe cleanup script** in the future (asks before deleting)

**Need help recreating your requests?** I can guide you! 🩸
