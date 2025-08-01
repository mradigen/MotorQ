import crypto from 'crypto';

// In a production system, these would be stored in a database or secure storage
// For this implementation, we'll use a simple in-memory store with some predefined tokens
const API_TOKENS = new Set([
    'motorq-api-token-12345',
    'motorq-admin-token-67890',
    'fleet-management-token-abc123'
]);

/**
 * Authentication middleware for API token verification
 * Expects the API token to be provided in the Authorization header as:
 * Authorization: Bearer <token>
 * or in the x-api-key header:
 * x-api-key: <token>
 */
export const authenticateToken = (req, res, next) => {
    try {
        // Check Authorization header first (Bearer token)
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        } else if (req.headers['x-api-key']) {
            // Check x-api-key header as alternative
            token = req.headers['x-api-key'];
        }

        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required', 
                message: 'Please provide an API token in Authorization header (Bearer token) or x-api-key header' 
            });
        }

        // Verify token
        if (!API_TOKENS.has(token)) {
            return res.status(403).json({ 
                error: 'Invalid API token', 
                message: 'The provided token is not valid or has been revoked' 
            });
        }

        // Token is valid, add token info to request for potential logging
        req.apiToken = token;
        req.authenticated = true;
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            error: 'Authentication service error',
            message: 'An error occurred while verifying your credentials'
        });
    }
};

/**
 * Generate a new API token (utility function for admin use)
 */
export const generateApiToken = (prefix = 'motorq-api-token') => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}-${randomBytes}`;
};

/**
 * Add a new API token to the valid tokens set
 */
export const addApiToken = (token) => {
    API_TOKENS.add(token);
    return token;
};

/**
 * Remove an API token from the valid tokens set
 */
export const revokeApiToken = (token) => {
    return API_TOKENS.delete(token);
};

/**
 * Get all valid API tokens (for admin purposes only)
 */
export const getAllTokens = () => {
    return Array.from(API_TOKENS);
};
