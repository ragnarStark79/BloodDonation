import client from "./client";

export const orgApi = {
    // Dashboard
    getDashboard: async () => {
        const res = await client.get("/api/org/dashboard");
        return res.data;
    },
    getAnalytics: async () => {
        const res = await client.get("/api/org/analytics");
        return res.data;
    },

    // Inventory
    getInventory: async () => {
        const res = await client.get("/api/org/inventory");
        return res.data;
    },
    addInventory: async (data) => {
        const res = await client.post("/api/org/inventory", data);
        return res.data;
    },
    getExpiringInventory: async () => {
        const res = await client.get("/api/org/inventory/expiring");
        return res.data;
    },

    // Batch Operations
    batchReserveUnits: async (unitIds, requestId = null) => {
        const res = await client.put("/api/org/inventory/batch/reserve", { unitIds, requestId });
        return res.data;
    },
    batchIssueUnits: async (unitIds) => {
        const res = await client.put("/api/org/inventory/batch/issue", { unitIds });
        return res.data;
    },
    batchExpireUnits: async (unitIds) => {
        const res = await client.put("/api/org/inventory/batch/expire", { unitIds });
        return res.data;
    },

    // Requests
    getMyRequests: async () => {
        const res = await client.get("/api/org/requests");
        return res.data;
    },
    createRequest: async (data) => {
        const res = await client.post("/api/org/requests", data);
        return res.data;
    },
    updateRequestStatus: async (id, status) => {
        const res = await client.put(`/api/org/requests/${id}/status`, { status });
        return res.data;
    },
    fulfillRequest: async (id, data) => {
        const res = await client.put(`/api/org/requests/${id}/fulfill`, data);
        return res.data;
    },
    getMatches: async (id) => {
        const res = await client.get(`/api/org/requests/${id}/matches`);
        return res.data;
    },
    assignDonor: async (id, donorId) => {
        const res = await client.post(`/api/org/requests/${id}/assign-donor`, { donorId });
        return res.data;
    },
    getIncomingRequests: async () => {
        const res = await client.get("/api/org/requests/incoming");
        return res.data;
    },

    // Camps
    getCamps: async () => {
        const res = await client.get("/api/org/camps");
        return res.data;
    },
    createCamp: async (data) => {
        const res = await client.post("/api/org/camps", data);
        return res.data;
    },
    getCampParticipants: async (date) => {
        const params = date ? { date } : {};
        const res = await client.get("/api/org/camps/participants", { params });
        return res.data;
    },
    getCampAnalytics: async (id) => {
        const res = await client.get(`/api/org/camps/${id}/analytics`);
        return res.data;
    },
    exportCampReport: async (id) => {
        const res = await client.get(`/api/org/camps/${id}/export`, { responseType: 'blob' });
        return res.data;
    },

    // Appointments
    getAppointments: async () => {
        const res = await client.get("/api/org/appointments");
        return res.data;
    },
    completeAppointment: async (id, data) => { // data: { unitsCollected, notes, ... }
        const res = await client.put(`/api/org/appointments/${id}/complete`, data);
        return res.data;
    },
    startDonation: async (appointmentId) => {
        const res = await client.post(`/api/org/appointments/${appointmentId}/start-donation`);
        return res.data;
    },

    // Stats
    getStats: async () => {
        const res = await client.get("/api/org/stats");
        return res.data;
    },

    // Donation Stats
    getDonationStats: async () => {
        const res = await client.get("/api/org/donation-stats");
        return res.data;
    },

    // Chart Data
    getMonthlyDonationTrends: async () => {
        const res = await client.get("/api/org/monthly-donation-trends");
        return res.data;
    },
    getBloodGroupDistribution: async () => {
        const res = await client.get("/api/org/blood-group-distribution");
        return res.data;
    }
};

export default orgApi;
