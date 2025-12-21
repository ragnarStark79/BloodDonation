import client from './client';

/**
 * Request API - Handles all blood request operations across dashboards
 */

const requestApi = {
    // ==================== DONOR ENDPOINTS ====================

    /**
     * Get nearby blood requests for a donor
     * Filters by: blood group compatibility, eligibility, distance
     */
    getNearbyRequests: async (params = {}) => {
        const { page = 1, limit = 10, bloodGroup, urgency } = params;
        const response = await client.get('/api/requests/nearby', {
            params: { page, limit, bloodGroup, urgency }
        });
        return response.data;
    },

    /**
     * Get request details by ID
     */
    getRequestById: async (requestId) => {
        const response = await client.get(`/api/requests/${requestId}`);
        return response.data;
    },

    /**
     * Express interest in a request (donor)
     */
    expressInterest: async (requestId) => {
        const response = await client.post(`/api/requests/${requestId}/interest`);
        return response.data;
    },

    /**
     * Withdraw interest from a request (donor)
     */
    withdrawInterest: async (requestId) => {
        const response = await client.delete(`/api/requests/${requestId}/interest`);
        return response.data;
    },

    /**
     * Get requests assigned to donor (for booking appointments)
     */
    getAssignedRequests: async () => {
        const response = await client.get('/api/requests/assigned');
        return response.data;
    },

    // ==================== ORGANIZATION (HOSPITAL) ENDPOINTS ====================

    /**
     * Create a new blood request (Hospital)
     */
    createRequest: async (requestData) => {
        const response = await client.post('/api/requests/org', requestData);
        return response.data;
    },

    /**
     * Get organization's own requests (Hospital)
     */
    getMyRequests: async (params = {}) => {
        const { page = 1, limit = 10, status, urgency } = params;
        const response = await client.get('/api/requests/org/mine', {
            params: { page, limit, status, urgency }
        });
        return response.data;
    },

    /**
     * Get matching donors and blood banks for a request
     */
    getRequestMatches: async (requestId) => {
        const response = await client.get(`/api/requests/org/${requestId}/matches`);
        return response.data;
    },

    /**
     * Assign a donor or blood bank to a request
     */
    assignResponder: async (requestId, assignData) => {
        const response = await client.put(`/api/requests/org/${requestId}/assign`, assignData);
        return response.data;
    },

    /**
     * Mark request as fulfilled
     */
    fulfillRequest: async (requestId, fulfillmentData) => {
        const response = await client.put(`/api/requests/org/${requestId}/fulfill`, fulfillmentData);
        return response.data;
    },

    /**
     * Cancel a request
     */
    cancelRequest: async (requestId, reason) => {
        const response = await client.put(`/api/requests/org/${requestId}/cancel`, { reason });
        return response.data;
    },

    /**
     * Update request details
     */
    updateRequest: async (requestId, updateData) => {
        const response = await client.put(`/api/requests/org/${requestId}`, updateData);
        return response.data;
    },

    // ==================== ORGANIZATION (BLOOD BANK) ENDPOINTS ====================

    /**
     * Get incoming requests that blood bank can fulfill
     */
    getIncomingRequests: async (params = {}) => {
        const { page = 1, limit = 10, bloodGroup, urgency } = params;
        const response = await client.get('/api/org/requests/incoming', {  // FIXED: Changed from /api/requests/org/incoming
            params: { page, limit, bloodGroup, urgency }
        });
        return response.data;
    },

    /**
     * Reserve inventory units for a request (Blood Bank)
     */
    reserveUnits: async (requestId, reserveData) => {
        const response = await client.post(`/api/requests/org/${requestId}/reserve`, reserveData);
        return response.data;
    },

    /**
     * Issue reserved units to hospital
     */
    issueUnits: async (requestId, issueData) => {
        const response = await client.post(`/api/requests/org/${requestId}/issue`, issueData);
        return response.data;
    },

    /**
     * Release reserved units (cancel reservation)
     */
    releaseReservation: async (requestId, unitIds) => {
        const response = await client.delete(`/api/requests/org/${requestId}/reserve`, {
            data: { unitIds }
        });
        return response.data;
    },

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all requests with filters (Admin)
     */
    getAllRequests: async (params = {}) => {
        const { page = 1, limit = 20, status, urgency, city, organizationId } = params;
        const response = await client.get('/api/requests/admin/all', {
            params: { page, limit, status, urgency, city, organizationId }
        });
        return response.data;
    },

    /**
     * Get request statistics and summary (Admin)
     */
    getRequestsSummary: async () => {
        const response = await client.get('/api/requests/admin/summary');
        return response.data;
    },

    /**
     * Get unfulfilled requests alerts
     */
    getUnfulfilledAlerts: async () => {
        const response = await client.get('/api/requests/admin/alerts');
        return response.data;
    },

    /**
     * Broadcast notification to compatible donors
     */
    broadcastToDonors: async (requestId, message) => {
        const response = await client.post('/api/requests/admin/broadcast', {
            requestId,
            message,
            type: 'URGENT_REQUEST'
        });
        return response.data;
    },

    /**
     * Force assign a request (Admin intervention)
     */
    adminAssignRequest: async (requestId, assignData) => {
        const response = await client.put(`/api/requests/admin/${requestId}/assign`, assignData);
        return response.data;
    },

    /**
     * Get request analytics and trends
     */
    getRequestAnalytics: async (params = {}) => {
        const { startDate, endDate, groupBy = 'day' } = params;
        const response = await client.get('/api/requests/admin/analytics', {
            params: { startDate, endDate, groupBy }
        });
        return response.data;
    },

    // ==================== COMMON ENDPOINTS ====================

    /**
     * Get donor's request history
     */
    getDonorRequestHistory: async (params = {}) => {
        const { page = 1, limit = 10 } = params;
        const response = await client.get('/api/requests/donor/history', {
            params: { page, limit }
        });
        return response.data;
    },

    /**
     * Get organization's request statistics
     */
    getOrgRequestStats: async () => {
        const response = await client.get('/api/requests/org/stats');
        return response.data;
    },

    /**
     * Get request comments/activity log
     */
    getRequestActivity: async (requestId) => {
        const response = await client.get(`/api/requests/${requestId}/activity`);
        return response.data;
    },

    /**
     * Add comment to request
     */
    addRequestComment: async (requestId, comment) => {
        const response = await client.post(`/api/requests/${requestId}/comments`, { comment });
        return response.data;
    }
};

export default requestApi;
