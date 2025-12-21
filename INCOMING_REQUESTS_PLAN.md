# 🏦 Incoming Requests System - Implementation Plan

## 🎯 Current Status

### ✅ **Working Features**
1. **IncomingRequestsPage** - Displays hospital requests matching blood bank inventory
2. **ReserveUnitsModal** - Select and reserve blood units
3. **Backend API** - `/api/org/requests/incoming` and `/api/org/inventory/batch/reserve`

### ⚠️ **Issues Fixed**
1.  **API Endpoint Mismatch** - Changed from `requestApi.reserveUnits()` to `orgApi.batchReserveUnits()`

---

## 🚀 **Enhancement Plan**

### **Phase 1: Stock Availability Calculation (BACKEND)** 🔴 CRITICAL

**Problem:** Requests don't show if blood bank can fulfill them

**Solution:** Update `/api/org/requests/incoming` endpoint to:
1. Calculate available units for each blood group
2. Add `canFulfill` boolean field
3. Add `availableUnits` count
4. Calculate distance from blood bank to hospital

**Backend Changes Needed:**
```javascript
// In Backend/Router/org.js - Line 495
router.get("/requests/incoming", auth([ROLES.ORGANIZATION]), canViewIncoming, async (req, res) => {
  try {
    const orgId = req.user.userId;
    
    // Get blood bank location
    const org = await User.findById(orgId).select('locationGeo Name').lean();
    
    // Get available groups with counts
    const inventoryCounts = await BloodUnit.aggregate([
      { $match: { organizationId: orgId, status: "AVAILABLE" } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
    ]);
    
    const availableGroups = inventoryCounts.map(g => g._id);
    const groupCountMap = Object.fromEntries(inventoryCounts.map(g => [g._id, g.count]));
    
    // Get requests with geospatial distance
    const requests = await Request.aggregate([
      {
        $match: {
          bloodGroup: { $in: availableGroups },
          status: REQUEST_STATUS.OPEN,
          createdBy: { $ne: orgId }
        }
      },
      {
        $geoNear: {
          near: org.locationGeo,
          distanceField: "distance",
          spherical: true,
          distanceMultiplier: 0.001 // Convert to km
        }
      },
      { $limit: 50 },
      { $sort: { urgency: -1, createdAt: -1 } }
    ]);
    
    // Enrich with availability
    const enrichedRequests = await Promise.all(requests.map(async req => {
      const populated = await Request.populate(req, {
        path: 'createdBy',
        select: 'Name organizationName City Email Phone'
      });
      
      return {
        ...populated,
        canFulfill: groupCountMap[req.bloodGroup] >= req.units,
        availableUnits: groupCountMap[req.bloodGroup] || 0,
        distance: req.distance
      };
    }));
    
    res.json(enrichedRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
```

---

### **Phase 2: Smart Unit Selection (FRONTEND)** 🟡 MEDIUM

**Enhancement:** Auto-select oldest units first to prevent wastage

**Add to ReserveUnitsModal.jsx:**
```javascript
const handleSmartSelect = () => {
    // Sort by expiry date (oldest first)
    const sorted = [...availableUnits].sort((a, b) => 
        new Date(a.expiryDate) - new Date(b.expiryDate)
    );
    
    // Select required number of units
    const toSelect = sorted
        .slice(0, request.unitsNeeded)
        .map(u => u._id);
    
    setSelectedUnits(toSelect);
    toast.success(`Auto-selected ${toSelect.length} units (oldest first)`);
};

// Add button in modal
<button onClick={handleSmartSelect} className="...">
    Smart Select (Oldest First)
</button>
```

---

### **Phase 3: Reservation Tracking System** 🟡 MEDIUM

**Problem:** No way to track what happens after reservation

**Solution:** Create comprehensive reservation tracking system

#### **A. Backend Schema Update**
Add to `Request.js`:
```javascript
reservations: [{
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodUnit' }],
    reservedAt: Date,
    status: {
        type: String,
        enum: ['RESERVED', 'ISSUED', 'CANCELLED'],
        default: 'RESERVED'
    },
    issuedAt: Date,
    deliveryNotes: String
}]
```

#### **B. New Backend Endpoint**
```javascript
// Reserve units FOR a specific request
router.post("/requests/:id/reserve-for", auth([ROLES.ORGANIZATION]), async (req, res) => {
    const { id } = req.params;
    const{ unitIds, deliveryNotes } = req.body;
    const orgId = req.user.userId;
    
    // Reserve units in inventory
    await BloodUnit.updateMany(
        { _id: { $in: unitIds } },
        { 
            $set: { 
                status: "RESERVED",
                reservedFor: id,
                reservedBy: orgId,
                reservedAt: new Date()
            }
        }
    );
    
    // Add reservation to request
    const request = await Request.findByIdAndUpdate(
        id,
        {
            $push: {
                reservations: {
                    bloodBankId: orgId,
                    unitIds,
                    reservedAt: new Date(),
                    status: 'RESERVED',
                    deliveryNotes
                }
            }
        },
        { new: true }
    );
    
    res.json({ message: "Units reserved", request });
});
```

#### **C. Frontend Reservation Modal**
Create `ReservationDetailsModal.jsx`:
- Show reserved units
- Add delivery notes
- Confirm reservation
- Provide tracking number

---

### **Phase 4: Issue & Transfer Flow** 🟢 LOW

**Add:** Complete workflow from reservation to delivery

#### **Steps:**
1. **Reserve Units** → Units marked RESERVED
2. **Prepare for Transfer** → Print labels, pack units
3. **Issue Units** → Mark as ISSUED, provide tracking
4. **Confirm Delivery** → Hospital confirms receipt
5. **Auto-Fulfill** → Request marked FULFILLED

#### **New UI Components:**
1. **Reservation History Tab** - View all reservations
2. **Issue Units Modal** - Mark units as issued with delivery details
3. **Transfer Tracking** - Track in-transit units

---

### **Phase 5: Communication System** 🟢 LOW

**Add:** Blood bank ↔ Hospital messaging

#### **Features:**
- Send message when reserving units
- Hospital can reply with pickup/delivery preference
- Auto-notifications for key events
- Delivery scheduling

---

## 📋 **Implementation Checklist**

### **Must-Do (This Session):**
- [x] Fix API endpoint mismatch in ReserveUnitsModal
- [ ] Update backend to calculate stock availability
- [ ] Add distance calculation to incoming requests
- [ ] Test the full reserve flow

### **Should-Do (Next Session):**
- [ ] Add smart unit selection (oldest first)
- [ ] Create reservation tracking system
- [ ] Add reservation history view
- [ ] Implement issue units flow

### **Nice-to-Have (Future):**
- [ ] Communication system
- [ ] Delivery scheduling
- [ ] Print labels for blood bags
- [ ] Analytics (fulfillment rate, response time)

---

## 🎯 **Immediate Next Steps**

**What should we do RIGHT NOW?**

**Option A:** Fix the backend to properly show stock availability
- Update `/api/org/requests/incoming` endpoint
- Add `canFulfill` and `availableUnits` fields
- Calculate distance

**Option B:** Add smart features to the modal
- Auto-select oldest units
- Show expiry warnings prominently
- Add bulk actions

**Option C:** Test the current implementation
- Add sample data
- Test the complete flow
- Identify bugs

**Which would you like to tackle first?**
