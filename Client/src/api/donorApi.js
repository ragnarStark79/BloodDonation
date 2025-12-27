import client from "./client";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

/**
 * Donor API endpoints
 */
export const donorApi = {
    /**
     * Get donor profile with eligibility status
     */
    getMe: async () => {
        const res = await client.get(`${API_BASE}/api/donor/me`);
        return res.data;
    },

    /**
     * Get donor stats with monthly breakdown
     */
    getStats: async () => {
        const res = await client.get(`${API_BASE}/api/donor/stats`);
        return res.data;
    },

    /**
     * Get nearby blood requests
     * @param {object} params - { lat, lng, km, urgency, group }
     */
    getNearbyRequests: async (params) => {
        const res = await client.get(`${API_BASE}/api/donor/requests/nearby`, { params });
        return res.data;
    },

    /**
     * Mark interest in a request
     */
    markInterest: async (requestId, comment = "") => {
        const res = await client.post(`${API_BASE}/api/donor/requests/${requestId}/interest`, {
            comment,
        });
        return res.data;
    },

    /**
     * Get donor appointments
     * @param {string} status - UPCOMING, COMPLETED, CANCELLED, or undefined for all
     */
    getAppointments: async (status) => {
        const params = status ? { status } : {};
        const res = await client.get(`${API_BASE}/api/donor/appointments`, { params });
        return res.data;
    },

    /**
     * Search organizations (hospitals/blood banks) for booking appointments
     * @param {string} query - Search query (name or city)
     * @param {string} type - Optional: 'HOSPITAL' or 'BANK'
     */
    searchOrganizations: async (query, type) => {
        const params = { query };
        if (type) params.type = type;
        const res = await client.get(`${API_BASE}/api/donor/organizations/search`, { params });
        return res.data;
    },

    /**
     * Book new appointment
     */
    bookAppointment: async (data) => {
        const res = await client.post(`${API_BASE}/api/donor/appointments`, data);
        return res.data;
    },

    /**
     * Cancel appointment
     */
    cancelAppointment: async (id, reason) => {
        const res = await client.put(`${API_BASE}/api/donor/appointments/${id}/cancel`, {
            reason,
        });
        return res.data;
    },

    /**
     * Reschedule appointment
     */
    rescheduleAppointment: async (id, dateTime) => {
        const res = await client.put(`${API_BASE}/api/donor/appointments/${id}/reschedule`, {
            dateTime,
        });
        return res.data;
    },

    /**
     * Get donation history with filters
     * @param {object} filters - { startDate, endDate, status }
     */
    getHistory: async (filters = {}) => {
        const res = await client.get(`${API_BASE}/api/donor/history`, { params: filters });
        return res.data;
    },

    /**
     * Get recent donations (last 5)
     */
    getRecentDonations: async () => {
        const res = await client.get(`${API_BASE}/api/donor/donations/recent`);
        return res.data;
    },

    /**
     * Get donor profile
     */
    getProfile: async () => {
        const res = await client.get(`${API_BASE}/api/donor/profile`);
        return res.data;
    },

    /**
     * Update donor profile
     */
    updateProfile: async (data) => {
        const res = await client.put(`${API_BASE}/api/donor/profile`, data);
        return res.data;
    },

    /**
     * Request profile update (requires admin approval)
     */
    requestProfileUpdate: async (data) => {
        const res = await client.post(`${API_BASE}/api/donor/profile-update`, data);
        return res.data;
    },

    /**
     * Get available donation camps
     */
    getCamps: async (params) => {
        const res = await client.get(`${API_BASE}/api/donor/camps`, { params });
        return res.data;
    },

    /**
     * Register for a camp
     */
    registerForCamp: async (campId) => {
        const res = await client.post(`${API_BASE}/api/donor/camps/${campId}/register`);
        return res.data;
    },

    /**
     * Unregister from a camp
     */
    unregisterFromCamp: async (campId) => {
        const res = await client.delete(`${API_BASE}/api/donor/camps/${campId}/unregister`);
        return res.data;
    },

    /**
     * Get registered camps for the current donor
     */
    getMyCamps: async () => {
        const res = await client.get(`${API_BASE}/api/donor/my-camps`);
        return res.data;
    }
};

export default donorApi;
