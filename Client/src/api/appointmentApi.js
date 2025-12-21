import client from './client';

/**
 * Appointment API - Handles all appointment operations
 */

const appointmentApi = {
    // ==================== DONOR METHODS ====================

    /**
     * Get donor's appointments
     * @param {string} status - 'UPCOMING', 'COMPLETED', 'CANCELLED', or 'ALL'
     */
    getMyAppointments: async (status = 'ALL') => {
        const response = await client.get('/api/appointments/donor', {
            params: { status }
        });
        return response.data;
    },

    /**
     * Book a new appointment (donor self-booking)
     * @param {object} data - { organizationId, dateTime, notes }
     */
    bookAppointment: async (data) => {
        const response = await client.post('/api/appointments/donor', data);
        return response.data;
    },

    /**
     * Cancel an appointment (donor side)
     * @param {string} appointmentId
     * @param {string} reason
     */
    cancelAppointment: async (appointmentId, reason) => {
        const response = await client.put(`/api/appointments/donor/${appointmentId}/cancel`, {
            reason
        });
        return response.data;
    },

    /**
     * Get donor's donation history
     */
    getDonationHistory: async () => {
        const response = await client.get('/api/appointments/donor/history');
        return response.data;
    },

    // ==================== ORGANIZATION METHODS ====================

    /**
     * Get organization's appointments
     * @param {object} params - { status, page, limit }
     */
    getOrgAppointments: async (params = {}) => {
        const response = await client.get('/api/appointments/org', { params });
        return response.data;
    },

    /**
     * Get appointment details
     * @param {string} appointmentId
     */
    getAppointmentDetails: async (appointmentId) => {
        const response = await client.get(`/api/appointments/org/${appointmentId}`);
        return response.data;
    },

    /**
     * Mark appointment as completed
     * @param {string} appointmentId
     * @param {object} data - { donationSuccessful, unitsCollected, notes }
     */
    completeAppointment: async (appointmentId, data) => {
        const response = await client.put(`/api/appointments/org/${appointmentId}/complete`, data);
        return response.data;
    },

    /**
     * Reschedule an appointment
     * @param {string} appointmentId
     * @param {object} data - { newDateTime, reason }
     */
    rescheduleAppointment: async (appointmentId, data) => {
        const response = await client.put(`/api/appointments/org/${appointmentId}/reschedule`, data);
        return response.data;
    },

    /**
     * Cancel appointment (organization side)
     * @param {string} appointmentId
     * @param {string} reason
     */
    cancelAppointmentOrg: async (appointmentId, reason) => {
        const response = await client.put(`/api/appointments/org/${appointmentId}/cancel`, {
            reason
        });
        return response.data;
    },

    // ==================== ADMIN METHODS ====================

    /**
     * Get all appointments (admin)
     * @param {object} params - { status, organizationId, donorId, page, limit }
     */
    getAllAppointments: async (params = {}) => {
        const response = await client.get('/api/appointments/admin/all', { params });
        return response.data;
    },

    /**
     * Get appointment statistics (admin)
     */
    getAppointmentStats: async () => {
        const response = await client.get('/api/appointments/admin/stats');
        return response.data;
    }
};

export default appointmentApi;
