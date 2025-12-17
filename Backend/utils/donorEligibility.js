/**
 * Donor Eligibility Utilities
 * Calculates and checks donor eligibility based on last donation
 */

/**
 * Calculate next eligible donation date
 * Males: 56 days, Females/Other: 84 days
 */
export function calculateNextEligibleDate(lastDonationDate, gender) {
    const days = (gender === 'MALE') ? 56 : 84;
    const nextDate = new Date(lastDonationDate);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

/**
 * Check if donor is currently eligible to donate
 */
export function isDonorEligible(donor) {
    if (!donor.nextEligibleDate) {
        return true; // Never donated, eligible
    }
    return new Date() >= new Date(donor.nextEligibleDate);
}

/**
 * Get days until donor is eligible
 */
export function getDaysUntilEligible(donor) {
    if (!donor.nextEligibleDate) {
        return 0;
    }

    const today = new Date();
    const eligible = new Date(donor.nextEligibleDate);

    if (today >= eligible) {
        return 0;
    }

    const diffTime = eligible - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
