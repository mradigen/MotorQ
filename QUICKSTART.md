# Quick Start Guide

## 1. Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- pnpm (recommended)

## 2. Database Setup

### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose logs postgres
```

### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally and create database
createdb motorq_fleet
```

## 3. Application Setup

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Update .env with your database credentials (if different from defaults)

# Run database migrations and seed data
pnpm run db:setup
```

## 4. Start the Application

```bash
# Development mode
pnpm run dev

# Production mode
pnpm start
```

## 5. Test the API

### Create a Vehicle
```bash
curl -X POST http://localhost:3000/vehicle/create/TEST123 \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturer": "Tesla",
    "model": "Model S",
    "fleet_id": 1,
    "owner": "test_owner"
  }'
```

### Submit Telemetry Data
```bash
curl -X POST http://localhost:3000/telemetry/TEST123 \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "speed": 65,
    "engine_status": "On",
    "fuel_level": 75.5,
    "odometer": 15000
  }'
```

### Get Analytics
```bash
curl http://localhost:3000/analytics/1
```

## 6. Database Management

### View Data (with PgAdmin)
```bash
# Start PgAdmin (if using Docker)
docker-compose up -d pgadmin

# Access at http://localhost:8080
# Email: admin@motorq.com
# Password: admin
```

### Direct Database Access
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d motorq_fleet

# View tables
\dt

# View sample data
SELECT * FROM vehicles;
SELECT * FROM telemetry_data LIMIT 10;
```

## 7. API Endpoints

- **Vehicles**: `/vehicle/*`
- **Telemetry**: `/telemetry/*`
- **Alerts**: `/alerts/*`
- **Analytics**: `/analytics/*`
- **Health Check**: `/health`

## 8. Sample Data

The setup includes sample data with:
- 2 fleets (Corporate, Rental)
- 4 vehicles (Tesla, BMW, Ford, Toyota)
- 48 hours of telemetry data
- Sample speed and fuel alerts

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Reset database
docker-compose down -v && docker-compose up -d postgres
```

### Migration Issues
```bash
# Rollback and retry
pnpm run migrate:rollback
pnpm run migrate

# Fresh start
dropdb motorq_fleet && createdb motorq_fleet
pnpm run db:setup
```

### Port Conflicts
Update ports in `docker-compose.yml` or `.env` if needed:
- PostgreSQL: 5432
- API Server: 3000
- PgAdmin: 8080
