#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres; do
  sleep 1
done

echo "Running database migrations..."
pnpm run migrate

echo "Seeding database with sample data..."
pnpm run db:seed

echo "Database initialization complete!"

echo "Starting the application..."
exec "$@"
