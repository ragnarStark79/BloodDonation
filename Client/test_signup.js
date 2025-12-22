import axios from 'axios';

const signupHospital = async () => {
    try {
        const response = await axios.post('http://localhost:3000/api/signup', {
            Name: "Test Hospital User",
            Email: "hospital_test_" + Date.now() + "@test.com",
            Password: "password123",
            ConfirmPassword: "password123",
            City: "New York",
            PhoneNumber: "1234567890",
            Role: "hospital",
            Hospitalname: "General Hospital",
            Department: "ER",
            HospitalAddress: "123 Medical Way"
        });
    } catch (error) {
        if (error.response) {
            console.error("Signup Failed:", error.response.status, error.response.data);
        } else {
            console.error("Signup Error:", error.message);
        }
    }
};

signupHospital();
