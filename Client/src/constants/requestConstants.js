/**
 * Request System Constants
 * Shared across all dashboards for consistency
 */

// Request Status
export const REQUEST_STATUS = {
    OPEN: 'OPEN',
    ASSIGNED: 'ASSIGNED',
    FULFILLED: 'FULFILLED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED'
};

// Request Urgency Levels
export const REQUEST_URGENCY = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
};

// Blood Groups
export const BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

// Blood Components
export const BLOOD_COMPONENTS = {
    WHOLE_BLOOD: 'WHOLE_BLOOD',
    RED_CELLS: 'RED_CELLS',
    PLASMA: 'PLASMA',
    PLATELETS: 'PLATELETS',
    CRYOPRECIPITATE: 'CRYOPRECIPITATE'
};

// Blood Component Labels
export const COMPONENT_LABELS = {
    [BLOOD_COMPONENTS.WHOLE_BLOOD]: 'Whole Blood',
    [BLOOD_COMPONENTS.RED_CELLS]: 'Red Blood Cells',
    [BLOOD_COMPONENTS.PLASMA]: 'Plasma',
    [BLOOD_COMPONENTS.PLATELETS]: 'Platelets',
    [BLOOD_COMPONENTS.CRYOPRECIPITATE]: 'Cryoprecipitate'
};

// Status Colors for UI
export const STATUS_COLORS = {
    [REQUEST_STATUS.OPEN]: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
        dot: 'bg-blue-500'
    },
    [REQUEST_STATUS.ASSIGNED]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        dot: 'bg-yellow-500'
    },
    [REQUEST_STATUS.FULFILLED]: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        dot: 'bg-green-500'
    },
    [REQUEST_STATUS.CANCELLED]: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        dot: 'bg-gray-500'
    },
    [REQUEST_STATUS.EXPIRED]: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        dot: 'bg-red-500'
    }
};

// Urgency Colors for UI
export const URGENCY_COLORS = {
    [REQUEST_URGENCY.CRITICAL]: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-500',
        icon: 'text-red-600'
    },
    [REQUEST_URGENCY.HIGH]: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-500',
        icon: 'text-orange-600'
    },
    [REQUEST_URGENCY.MEDIUM]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-500',
        icon: 'text-yellow-600'
    },
    [REQUEST_URGENCY.LOW]: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-500',
        icon: 'text-green-600'
    }
};

// Blood Unit Status
export const UNIT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    RESERVED: 'RESERVED',
    ISSUED: 'ISSUED',
    EXPIRED: 'EXPIRED',
    TESTED: 'TESTED',
    QUARANTINED: 'QUARANTINED'
};

// Distance Ranges (in km)
export const DISTANCE_RANGES = {
    VERY_NEAR: 5,
    NEAR: 10,
    MODERATE: 25,
    FAR: 50
};

// Request Filters for UI
export const REQUEST_FILTERS = {
    STATUS: Object.values(REQUEST_STATUS),
    URGENCY: Object.values(REQUEST_URGENCY),
    BLOOD_GROUP: BLOOD_GROUPS
};

// Time Thresholds for Alerts
export const TIME_THRESHOLDS = {
    CRITICAL_RESPONSE: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    HIGH_RESPONSE: 6 * 60 * 60 * 1000, // 6 hours
    OVERDUE_WARNING: 24 * 60 * 60 * 1000 // 24 hours
};

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
};

// Helper Functions
export const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS[REQUEST_STATUS.OPEN];

export const getUrgencyColor = (urgency) => URGENCY_COLORS[urgency] || URGENCY_COLORS[REQUEST_URGENCY.MEDIUM];

export const getComponentLabel = (component) => COMPONENT_LABELS[component] || component;

export const isRequestUrgent = (urgency) => [REQUEST_URGENCY.CRITICAL, REQUEST_URGENCY.HIGH].includes(urgency);

export const isRequestActive = (status) => [REQUEST_STATUS.OPEN, REQUEST_STATUS.ASSIGNED].includes(status);

export const formatDistance = (distanceKm) => {
    if (!distanceKm && distanceKm !== 0) return 'N/A'; // Handle undefined/null
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
};

export const getDistanceBadge = (distanceKm) => {
    if (distanceKm <= DISTANCE_RANGES.VERY_NEAR) return { label: 'Very Near', color: 'green' };
    if (distanceKm <= DISTANCE_RANGES.NEAR) return { label: 'Near', color: 'blue' };
    if (distanceKm <= DISTANCE_RANGES.MODERATE) return { label: 'Moderate', color: 'yellow' };
    return { label: 'Far', color: 'gray' };
};

export const calculateResponseTime = (createdAt, fulfilledAt) => {
    const created = new Date(createdAt);
    const fulfilled = fulfilledAt ? new Date(fulfilledAt) : new Date();
    const diffMs = fulfilled - created;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const isRequestOverdue = (createdAt, urgency) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;

    if (urgency === REQUEST_URGENCY.CRITICAL && diffMs > TIME_THRESHOLDS.CRITICAL_RESPONSE) {
        return true;
    }
    if (urgency === REQUEST_URGENCY.HIGH && diffMs > TIME_THRESHOLDS.HIGH_RESPONSE) {
        return true;
    }
    return diffMs > TIME_THRESHOLDS.OVERDUE_WARNING;
};

export const getCompatibleBloodGroups = (requestedGroup) => {
    const compatibility = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    };
    return compatibility[requestedGroup] || [requestedGroup];
};

export const getDonorCompatibleGroups = (donorGroup) => {
    // Returns which request blood groups a donor can fulfill
    const canDonateTo = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    };
    return canDonateTo[donorGroup] || [donorGroup];
};
