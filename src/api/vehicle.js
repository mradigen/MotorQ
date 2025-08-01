import express from 'express';
import { Vehicle, Fleet } from '../storage/index.js';

const router = express.Router();

/*
{
    "vin": "12345",
    "manufacturer": "Ford",
    "model": "Testing",
    "fleet_id": "23456",
    "owner": "owner_id",
    "registration_status": "Active"
}
*/
router.post('/create/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        const { manufacturer, model, fleet_id, owner, registration_status = 'Active' } = req.body;

        // Validate required fields
        if (!manufacturer || !model || !fleet_id) {
            return res.status(400).json({ error: 'Missing required fields: manufacturer, model, fleet_id' });
        }

        // Check if vehicle already exists
        const existingVehicle = await Vehicle.findByVin(vin);
        if (existingVehicle) {
            return res.status(400).json({ error: 'Vehicle with this VIN already exists' });
        }

        // Check if fleet exists, create if it doesn't
        let fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            fleet = await Fleet.create({
                id: fleet_id,
                name: `Fleet ${fleet_id}`,
                type: 'Corporate'
            });
        }

        // Create vehicle
        const vehicle = await Vehicle.createWithMetadata({
            vin,
            manufacturer,
            model,
            fleet_id,
            owner,
            registration_status
        });

        res.status(201).json({
            message: 'Vehicle created successfully',
            vehicle: {
                id: vehicle.id,
                vin: vehicle.vin,
                manufacturer: vehicle.manufacturer,
                model: vehicle.model,
                fleet_id: vehicle.fleet_id,
                owner: vehicle.owner,
                registration_status: vehicle.registration_status
            }
        });
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        const vehicleList = vehicles.map(v => ({
            vin: v.vin,
            manufacturer: v.manufacturer,
            model: v.model,
            fleet_id: v.fleet_id,
            owner: v.owner,
            registration_status: v.registration_status
        }));
        res.json(vehicleList);
    } catch (error) {
        console.error('Error listing vehicles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/list/fleet/:fleet_id', async (req, res) => {
    try {
        const { fleet_id } = req.params;
        
        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        const vehicles = await Vehicle.findByFleetId(fleet_id);
        const vehicleList = vehicles.map(v => ({
            vin: v.vin,
            manufacturer: v.manufacturer,
            model: v.model,
            fleet_id: v.fleet_id,
            owner: v.owner,
            registration_status: v.registration_status
        }));
        
        res.json(vehicleList);
    } catch (error) {
        console.error('Error listing fleet vehicles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/details/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        
        const vehicle = await Vehicle.findByVinWithLatestTelemetry(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.json({
            vehicle: {
                vin: vehicle.vin,
                manufacturer: vehicle.manufacturer,
                model: vehicle.model,
                fleet_id: vehicle.fleet_id,
                owner: vehicle.owner,
                registration_status: vehicle.registration_status
            },
            latest_telemetry: vehicle.latest_telemetry
        });
    } catch (error) {
        console.error('Error getting vehicle details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/delete/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        
        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await Vehicle.delete(vehicle.id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;