import express from 'express';
import { generateApiToken, addApiToken, revokeApiToken, getAllTokens } from '../middleware/auth.js';

const router = express.Router();

// Simple admin authentication (in production, this should use proper admin auth)
const ADMIN_TOKEN = 'motorq-admin-super-secret-key';

const authenticateAdmin = (req, res, next) => {
    const adminToken = req.headers['x-admin-key'];
    if (!adminToken || adminToken !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Generate a new API token
router.post('/tokens/generate', authenticateAdmin, (req, res) => {
    try {
        const { prefix } = req.body;
        const newToken = generateApiToken(prefix);
        addApiToken(newToken);
        
        res.json({ 
            message: 'API token generated successfully',
            token: newToken 
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Revoke an API token
router.delete('/tokens/:token', authenticateAdmin, (req, res) => {
    try {
        const { token } = req.params;
        const revoked = revokeApiToken(token);
        
        if (revoked) {
            res.json({ message: 'Token revoked successfully' });
        } else {
            res.status(404).json({ error: 'Token not found' });
        }
    } catch (error) {
        console.error('Error revoking token:', error);
        res.status(500).json({ error: 'Failed to revoke token' });
    }
});

// List all active tokens (admin only)
router.get('/tokens', authenticateAdmin, (req, res) => {
    try {
        const tokens = getAllTokens();
        res.json({ 
            message: 'Active API tokens',
            count: tokens.length,
            tokens: tokens 
        });
    } catch (error) {
        console.error('Error listing tokens:', error);
        res.status(500).json({ error: 'Failed to list tokens' });
    }
});

// Add a custom token
router.post('/tokens/add', authenticateAdmin, (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        addApiToken(token);
        res.json({ 
            message: 'Token added successfully',
            token: token 
        });
    } catch (error) {
        console.error('Error adding token:', error);
        res.status(500).json({ error: 'Failed to add token' });
    }
});

export default router;
