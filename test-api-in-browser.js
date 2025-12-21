// Test the incoming requests API endpoint directly
// This will help us see what data is actually being returned

// Instructions:
// 1. Open browser DevTools (F12)
// 2. Go to Console tab  
// 3. Copy and paste this code
// 4. Check the output

fetch('/api/org/requests/incoming', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})
    .then(res => res.json())
    .then(data => {
        console.log('📊 API Response:', data);
        console.log('\n📦 Total requests:', data.length);

        if (data.length > 0) {
            data.forEach((req, idx) => {
                console.log(`\n${idx + 1}. ${req.bloodGroup} Request:`);
                console.log('   Units Needed:', req.unitsNeeded);
                console.log('   Can Fulfill:', req.canFulfill);
                console.log('   Available Units:', req.availableUnits);
                console.log('   Distance:', req.distance);
                console.log('   Hospital:', req.hospitalName);
            });
        }
    })
    .catch(err => {
        console.error('❌ API Error:', err);
    });
