#!/bin/bash
set -e

echo "Waiting for postgres"
until pg_isready -h postgres -U postgres; do
  sleep 1
done

echo "Running db migrations"
pnpm run migrate

echo "Adding sample data"
pnpm run db:seed

echo "DB initialized, starting app"
exec "$@"
