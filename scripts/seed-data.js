import { Vehicle, Fleet, TelemetryData, Alert } from '../src/storage/index.js';

async function seedSampleData() {
    try {
        console.log('Seeding sample data...');

        // Create sample fleets
        const corporateFleet = await Fleet.create({
            name: 'Corporate Fleet',
            type: 'Corporate',
            description: 'Main corporate vehicle fleet'
        });

        const rentalFleet = await Fleet.create({
            name: 'Rental Fleet',
            type: 'Rental',
            description: 'Rental vehicle operations'
        });

        console.log('Fleets created:', { corporateFleet: corporateFleet.id, rentalFleet: rentalFleet.id });

        // Create sample vehicles
        const vehicles = [
            {
                vin: 'TESLA123456789',
                manufacturer: 'Tesla',
                model: 'Model S',
                fleet_id: corporateFleet.id,
                owner: 'corp_owner_1',
                registration_status: 'Active'
            },
            {
                vin: 'BMW987654321',
                manufacturer: 'BMW',
                model: 'X5',
                fleet_id: corporateFleet.id,
                owner: 'corp_owner_2',
                registration_status: 'Active'
            },
            {
                vin: 'FORD555666777',
                manufacturer: 'Ford',
                model: 'Explorer',
                fleet_id: rentalFleet.id,
                owner: 'rental_owner_1',
                registration_status: 'Active'
            },
            {
                vin: 'TOYOTA111222333',
                manufacturer: 'Toyota',
                model: 'Prius',
                fleet_id: rentalFleet.id,
                owner: 'rental_owner_2',
                registration_status: 'Maintenance'
            }
        ];

        const createdVehicles = [];
        for (const vehicleData of vehicles) {
            const vehicle = await Vehicle.createWithMetadata(vehicleData);
            createdVehicles.push(vehicle);
            console.log(`Vehicle created: ${vehicle.vin}`);
        }

        // Create sample telemetry data
        console.log('Creating sample telemetry data...');
        const now = new Date();
        const telemetryPromises = [];

        for (const vehicle of createdVehicles.slice(0, 3)) { // Skip maintenance vehicle
            // Create multiple telemetry entries for the last 24 hours
            for (let i = 0; i < 48; i++) { // Every 30 minutes for 24 hours
                const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000));
                const speed = Math.floor(Math.random() * 100) + 20; // 20-120 km/h
                const fuelLevel = Math.max(10, 100 - (i * 0.5)); // Gradually decreasing fuel
                
                telemetryPromises.push(
                    TelemetryData.createForVehicle(vehicle.id, {
                        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
                        longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
                        speed: speed,
                        engine_status: speed > 0 ? 'On' : 'Idle',
                        fuel_level: fuelLevel,
                        odometer: 15000 + (48 - i) * 25, // Increasing odometer
                        diagnostic_codes: Math.random() > 0.9 ? 'P0001' : null,
                        timestamp: timestamp
                    })
                );
            }
        }

        await Promise.all(telemetryPromises);
        console.log('Sample telemetry data created');

        // Create sample alerts
        console.log('Creating sample alerts...');
        const alertPromises = [];

        // Speed violation alert
        alertPromises.push(
            Alert.createForVehicle(createdVehicles[0].id, {
                violation_type: 'Overspeeding',
                severity: 3,
                description: 'Vehicle exceeded speed limit: 95 km/h',
                telemetry_data: { speed: 95, limit: 80 },
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
            })
        );

        // Low fuel alert
        alertPromises.push(
            Alert.createForVehicle(createdVehicles[1].id, {
                violation_type: 'Low Fuel',
                severity: 2,
                description: 'Vehicle fuel level is low: 12%',
                telemetry_data: { fuel_level: 12 },
                timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
            })
        );

        await Promise.all(alertPromises);
        console.log('Sample alerts created');

        console.log('✅ Sample data seeding completed successfully!');
        console.log('\nSample vehicles:');
        createdVehicles.forEach(v => console.log(`- ${v.vin} (${v.manufacturer} ${v.model})`));
        
    } catch (error) {
        console.error('❌ Sample data seeding failed:', error);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedSampleData().then(() => process.exit(0));
}

export default seedSampleData;
