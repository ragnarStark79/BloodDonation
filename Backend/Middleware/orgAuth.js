import { ORG_TYPES } from "../config/constants.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ROLES } from "../config/constants.js";

/**
 * Organization Authentication Middleware
 * Verifies JWT token and ensures the user has ORGANIZATION role
 */
export const orgAuth = (req, res, next) => {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;

        // Check if user has ORGANIZATION role
        if (decoded.role !== ROLES.ORGANIZATION) {
            return res.status(403).json({
                message: "Access denied. This endpoint is only for organizations."
            });
        }

        return next();
    } catch (err) {
        return res.status(401).json({ message: "Token is not valid" });
    }
};

/**
 * Middleware to restrict access based on organization type
 * @param {Array<string>} allowedTypes - Array of allowed organization types (e.g., ['HOSPITAL', 'BANK'])
 */
export const requireOrgType = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userOrgType = req.user.organizationType;

        if (!userOrgType) {
            return res.status(403).json({
                message: "Organization type not set. Please contact support."
            });
        }

        if (!allowedTypes.includes(userOrgType)) {
            return res.status(403).json({
                message: `Access denied. This feature is only available for ${allowedTypes.join(' or ')} organizations.`
            });
        }

        next();
    };
};

/**
 * Helper to check if org can manage inventory (Blood Banks only)
 */
export const canManageInventory = requireOrgType([ORG_TYPES.BLOOD_BANK]);

/**
 * Helper to check if org can create blood requests (Hospitals only)
 */
export const canCreateRequests = requireOrgType([ORG_TYPES.HOSPITAL]);

/**
 * Helper to check if org can view incoming requests (Blood Banks only)
 */
export const canViewIncoming = requireOrgType([ORG_TYPES.BLOOD_BANK]);
