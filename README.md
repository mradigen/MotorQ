# Motorq Fleet Management System

A comprehensive fleet management system built with Node.js, Express, and PostgreSQL for managing vehicle fleets, real-time telemetry data, and alerts.

## Features

### Core Functionality
- **Vehicle Fleet Management**: Manage vehicles across multiple manufacturers and fleets
- **Real-time Telemetry Processing**: Handle GPS coordinates, speed, engine status, fuel levels, and diagnostic data
- **Alert System**: Automated alerts for speed violations and low fuel levels
- **Analytics Dashboard**: Fleet-level analytics including active/inactive vehicles, fuel consumption, and distance tracking

### Database Models
- **Fleets**: Corporate, Rental, Personal fleet types
- **Vehicles**: VIN-based vehicle identification with manufacturer details
- **Telemetry Data**: Time-series data for vehicle metrics
- **Alerts**: Severity-based alert system with violation tracking
- **Fleet Analytics**: Pre-computed analytics for performance optimization

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- pnpm (recommended) or npm

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd assignment_
pnpm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE motorq_fleet;
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=motorq_fleet
```

4. Run database migrations:
```bash
pnpm run migrate
```

5. Initialize database with sample data:
```bash
pnpm run db:init
```

### 3. Configuration

Update alert thresholds and analytics intervals in `.env`:

```env
# Speed thresholds in km/h
HIGH_SPEED_THRESHOLDS=[50, 80, 100, 120]

# Fuel thresholds in percentage
LOW_FUEL_THRESHOLDS=[15, 10, 5]

# Analytics calculation interval in seconds
ANALYTICS_INTERVAL_SECONDS=300
```

### 4. Start the Application

Development mode (with auto-reload):
```bash
pnpm run dev
```

Production mode:
```bash
pnpm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Vehicle Management

#### Create Vehicle
```http
POST /vehicle/create/:vin
Content-Type: application/json

{
  "manufacturer": "Tesla",
  "model": "Model S",
  "fleet_id": "1",
  "owner": "owner123",
  "registration_status": "Active"
}
```

#### List All Vehicles
```http
GET /vehicle/list
```

#### List Vehicles by Fleet
```http
GET /vehicle/list/fleet/:fleet_id
```

#### Get Vehicle Details
```http
GET /vehicle/details/:vin
```

#### Delete Vehicle
```http
DELETE /vehicle/delete/:vin
```

### Telemetry Data

#### Submit Telemetry Data
```http
POST /telemetry/:vin
Content-Type: application/json

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "speed": 65,
  "engine_status": "On",
  "fuel_level": 75.5,
  "odometer": 15000,
  "diagnostic_codes": "P0001",
  "timestamp": "2024-08-01T10:30:00Z"
}
```

#### Bulk Telemetry Upload
```http
POST /telemetry/bulk
Content-Type: application/json

{
  "telemetry_data": [
    {
      "vin": "VIN123",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "speed": 65,
      "engine_status": "On",
      "fuel_level": 75.5,
      "odometer": 15000
    }
  ]
}
```

#### Get Telemetry History
```http
GET /telemetry/history/:vin?limit=100
```

#### Get Latest Telemetry
```http
GET /telemetry/latest/:vin
```

#### Get Fleet Telemetry History
```http
GET /telemetry/history/fleet/:fleet_id?limit=1000
```

### Alerts

#### Get Alert History
```http
GET /alerts/history/:vin?limit=100
```

#### Get Alert Summary
```http
GET /alerts/summary/:vin
```

#### Get Latest Alert
```http
GET /alerts/latest/:vin
```

#### Get Alert by ID
```http
GET /alerts/history/id/:alert_id
```

#### Get Fleet Alerts
```http
GET /alerts/fleet/:fleet_id?limit=1000
```

#### Get Alerts by Type
```http
GET /alerts/type/:violation_type?vehicle_id=123
```

#### Get Alerts by Severity
```http
GET /alerts/severity/:min_severity?vehicle_id=123
```

#### Get Alert Statistics
```http
GET /alerts/stats/fleet/:fleet_id?hours=24
```

### Analytics

#### Get Fleet Analytics
```http
GET /analytics/:fleet_id?refresh=true
```

#### Get All Fleet Analytics
```http
GET /analytics/
```

#### Get Vehicle Status Details
```http
GET /analytics/:fleet_id/vehicles/status
```

#### Get Alerts Summary
```http
GET /analytics/:fleet_id/alerts/summary?hours=24
```

#### Manual Analytics Refresh
```http
POST /analytics/refresh
```

## Database Schema

### Tables

1. **fleets**
   - `id` (Primary Key)
   - `name` (Fleet name)
   - `description` (Optional description)
   - `type` (Corporate, Rental, Personal)
   - `created_at`, `updated_at`

2. **vehicles**
   - `id` (Primary Key)
   - `vin` (Unique Vehicle Identification Number)
   - `manufacturer` (Tesla, BMW, Ford, etc.)
   - `model` (Vehicle model)
   - `fleet_id` (Foreign Key to fleets)
   - `owner` (Owner/Operator information)
   - `registration_status` (Active, Maintenance, Decommissioned)
   - `created_at`, `updated_at`

3. **telemetry_data**
   - `id` (Primary Key)
   - `vehicle_id` (Foreign Key to vehicles)
   - `latitude`, `longitude` (GPS coordinates)
   - `speed` (km/h)
   - `engine_status` (On, Off, Idle)
   - `fuel_level` (percentage)
   - `odometer` (total kilometers)
   - `diagnostic_codes` (JSON string)
   - `timestamp` (Data collection time)
   - `created_at`

4. **alerts**
   - `id` (Primary Key)
   - `alert_id` (External reference ID)
   - `vehicle_id` (Foreign Key to vehicles)
   - `violation_type` (Overspeeding, Low Fuel, etc.)
   - `severity` (0-5 scale)
   - `description` (Alert description)
   - `telemetry_data` (Related telemetry JSON)
   - `timestamp` (Alert time)
   - `created_at`

5. **fleet_analytics**
   - `id` (Primary Key)
   - `fleet_id` (Foreign Key to fleets)
   - `total_vehicles`, `active_vehicles`, `inactive_vehicles`
   - `average_fuel_level`
   - `total_distance_24h`
   - `alert_count`, `alert_count_severe`
   - `created_at`

### Indexes

- VIN index on vehicles table
- Vehicle and timestamp composite indexes on telemetry_data
- Vehicle ID indexes on alerts
- Fleet ID and timestamp indexes on analytics

## Alert System

### Speed Violations
- Configurable speed thresholds
- Severity increases with speed limit excess
- Prevents duplicate alerts within 5-minute windows

### Low Fuel Alerts
- Configurable fuel level thresholds
- Multiple severity levels (15%, 10%, 5%)
- Automatic alert aggregation

### Alert Severity Levels
- 0-1: Low priority
- 2-3: Medium priority
- 4-5: High priority

## Analytics Engine

### Real-time Metrics
- Active vs Inactive vehicles (based on 24-hour activity)
- Average fuel/battery levels
- Total distance traveled
- Alert counts and severity distribution

### Performance Optimizations
- Pre-computed analytics stored in database
- Automatic refresh every 5 minutes (configurable)
- Manual refresh endpoints available

## Performance Considerations

### Database Optimizations
- Proper indexing for frequent queries
- Efficient time-series data handling
- Connection pooling with Knex.js

### Query Optimizations
- Batch operations for bulk data
- Pagination for large datasets
- Optimized joins for analytics

### Scalability Features
- Stateless API design
- Database-driven architecture
- Horizontal scaling capability

## Migration Commands

```bash
# Run migrations
pnpm run migrate

# Rollback last migration
pnpm run migrate:rollback

# Create new migration
npx knex migrate:make migration_name
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test -- --coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `DB_NAME` | Database name | motorq_fleet |
| `HIGH_SPEED_THRESHOLDS` | Speed alert thresholds (JSON array) | [50, 80, 100, 120] |
| `LOW_FUEL_THRESHOLDS` | Fuel alert thresholds (JSON array) | [15, 10, 5] |
| `ANALYTICS_INTERVAL_SECONDS` | Analytics refresh interval | 300 |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

## Architecture Benefits

### Compared to In-Memory Storage

1. **Data Persistence**: All data survives application restarts
2. **Scalability**: Can handle large datasets efficiently
3. **Concurrent Access**: Multiple application instances can share data
4. **Data Integrity**: ACID compliance and referential integrity
5. **Query Performance**: Optimized indexes and query planning
6. **Backup & Recovery**: Built-in PostgreSQL backup solutions
7. **Analytics**: Efficient aggregation and reporting queries

### Model-Based Architecture

1. **Code Organization**: Clear separation of concerns
2. **Reusability**: Models can be used across different API endpoints
3. **Validation**: Centralized data validation logic
4. **Relationships**: Proper foreign key relationships
5. **Maintainability**: Easier to update and extend

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL service is running
   - Verify connection credentials in `.env`
   - Ensure database exists

2. **Migration Errors**
   - Check database permissions
   - Verify migration files syntax
   - Run migrations in order

3. **Performance Issues**
   - Check database indexes
   - Monitor query performance
   - Consider connection pool sizing

### Logs

Application logs include:
- Database connection status
- API request/response logs
- Alert generation events
- Analytics calculation results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Update documentation
5. Submit a pull request

## License

This project is licensed under the ISC License.
