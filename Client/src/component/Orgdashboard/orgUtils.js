// Organization type constants (must match backend)
export const ORG_TYPES = {
    HOSPITAL: "HOSPITAL",
    BLOOD_BANK: "BANK"
};

/**
 * Get permissions for an organization based on type
 * @param {string} orgType - Organization type (HOSPITAL, BANK)
 * @returns {object} Permissions object
 */
export const getOrgPermissions = (orgType) => {
    if (!orgType) {
        return {
            canManageInventory: false,
            canCreateRequests: false,
            canViewIncoming: false,
            canManageAppointments: false,
            canCreateCamps: false,
            canViewAnalytics: false
        };
    }

    return {
        canManageInventory: orgType === ORG_TYPES.BLOOD_BANK,
        canCreateRequests: orgType === ORG_TYPES.HOSPITAL,
        canViewIncoming: orgType === ORG_TYPES.BLOOD_BANK,
        canManageDonations: true, // All orgs (including hospitals)
        canManageAppointments: true, // All orgs
        canCreateCamps: orgType === ORG_TYPES.BLOOD_BANK, // Only blood banks (they have inventory)
        canViewAnalytics: true // All orgs
    };
};

/**
 * Get display name for organization type
 */
export const getOrgTypeLabel = (orgType) => {
    const labels = {
        [ORG_TYPES.HOSPITAL]: "Hospital",
        [ORG_TYPES.BLOOD_BANK]: "Blood Bank"
    };
    return labels[orgType] || "Organization";
};

/**
 * Get badge color for organization type
 */
export const getOrgTypeBadgeColor = (orgType) => {
    const colors = {
        [ORG_TYPES.HOSPITAL]: "bg-blue-100 text-blue-700",
        [ORG_TYPES.BLOOD_BANK]: "bg-red-100 text-red-700"
    };
    return colors[orgType] || "bg-gray-100 text-gray-700";
};
