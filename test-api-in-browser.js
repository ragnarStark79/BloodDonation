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
        if (data.length > 0) {
            data.forEach((req, idx) => {
                
            });
        }
    })
    .catch(err => {
        console.error('❌ API Error:', err);
    });
