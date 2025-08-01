import config from './src/config/index.js';
import {db, fleet_db} from './src/storage/index.js';
import api from './src/api/index.js';
import analytics from './src/helpers/analytics.js';
import express from 'express';

// Create Express app
const app = express();

// Use the API routes
app.use('/api', api);

// Start the server
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`MotorQ Fleet API server running on port ${PORT}`);
    console.log(`Metrics endpoint available at: http://localhost:${PORT}/api/monitoring/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});