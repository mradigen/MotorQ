import dotenv from 'dotenv';
dotenv.config();

export default {
    alerts: {
        highSpeed: JSON.parse(process.env.HIGH_SPEED_THRESHOLDS), // convert to integer
        lowFuel: JSON.parse(process.env.LOW_FUEL_THRESHOLDS)
    },
    analytics: {
        bufferInterval: process.env.ANALYTICS_INTERVAL_SECONDS * 1
    }
};