import { Vehicle, Fleet, TelemetryData, Alert } from './src/storage/index.js'

async function testDatabaseSetup() {
	try {
		console.log('Testing database connectivity...')

		console.log('Creating test fleet...')
		const fleet = await Fleet.create({
			name: 'Test Fleet',
			type: 'Corporate',
			description: 'Test fleet for validation',
		})
		console.log('Fleet created:', fleet)

		console.log('Creating test vehicle...')
		const vehicle = await Vehicle.createWithMetadata({
			vin: 'TEST123456789',
			manufacturer: 'Tesla',
			model: 'Model S',
			fleet_id: fleet.id,
			owner: 'test_owner',
			registration_status: 'Active',
		})
		console.log('Vehicle created:', vehicle)

		console.log('Creating test telemetry...')
		const telemetry = await TelemetryData.createForVehicle(vehicle.id, {
			latitude: 37.7749,
			longitude: -122.4194,
			speed: 65,
			engine_status: 'On',
			fuel_level: 75.5,
			odometer: 15000,
			diagnostic_codes: null,
			timestamp: new Date(),
		})
		console.log('Telemetry created:', telemetry)

		console.log('Creating test alert...')
		const alert = await Alert.createForVehicle(vehicle.id, {
			violation_type: 'Overspeeding',
			severity: 2,
			description: 'Vehicle exceeded speed limit',
			telemetry_data: {
				speed: 85,
				location: 'Highway 101',
			},
			timestamp: new Date(),
		})
		console.log('Alert created:', alert)

		console.log('Testing queries...')
		const vehicleWithTelemetry =
			await Vehicle.findByVinWithLatestTelemetry('TEST123456789')
		console.log(
			'Vehicle with telemetry:',
			vehicleWithTelemetry?.latest_telemetry,
		)

		const fleetWithVehicles = await Fleet.findByIdWithVehicles(fleet.id)
		console.log('Fleet with vehicles:', fleetWithVehicles?.vehicles?.length)

		console.log('✅ Database setup test completed successfully!')

		// Cleanup
		await Vehicle.delete(vehicle.id)
		await Fleet.delete(fleet.id)
		console.log('Test data cleaned up')
	} catch (error) {
		console.error('❌ Database setup test failed:', error)
		process.exit(1)
	} finally {
		process.exit(0)
	}
}

testDatabaseSetup()
