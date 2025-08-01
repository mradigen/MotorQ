import db from '../src/db/config.js';

async function initializeDatabase() {
    try {
        console.log('Running database migrations...');
        
        await db.migrate.latest();
        
        console.log('Database migrations completed successfully');
        
        const sampleFleet = await db('fleets')
            .insert({
                id: 1,
                name: 'Corporate Fleet',
                type: 'Corporate',
                description: 'Main corporate vehicle fleet'
            })
            .onConflict('id')
            .ignore()
            .returning('*');

        console.log('Sample fleet created or already exists');
        
        console.log('Database initialization completed');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

initializeDatabase();
