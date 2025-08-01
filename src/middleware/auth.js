import crypto from 'crypto';

const API_TOKENS = new Set([
    'motorq-api-token-12345',
    'motorq-admin-token-67890',
    'fleet-management-token-abc123'
]);

// Authorization: Bearer <token>
// x-api-key header:
// x-api-key: <token>
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.headers['x-api-key']) {
            token = req.headers['x-api-key'];
        }

        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required', 
                message: 'Please provide an API token in Authorization header (Bearer token) or x-api-key header' 
            });
        }

        if (!API_TOKENS.has(token)) {
            return res.status(403).json({ 
                error: 'Invalid API token', 
                message: 'The provided token is not valid or has been revoked' 
            });
        }

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

export const generateApiToken = (prefix = 'motorq-api-token') => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}-${randomBytes}`;
};

export const addApiToken = (token) => {
    API_TOKENS.add(token);
    return token;
};

export const revokeApiToken = (token) => {
    return API_TOKENS.delete(token);
};

export const getAllTokens = () => {
    return Array.from(API_TOKENS);
};
