#!/bin/bash

# Run migrations (allow failure - will retry on next start)
echo "🗄️  Running migrations..."
php artisan migrate --force || echo "⚠️  Migrations failed, will retry on next start"

# Run seeders (allow failure)
echo "🌱 Seeding database..."
php artisan db:seed --force || echo "⚠️  Seeding failed, will retry on next start"

# Generate Swagger documentation (allow failure)
echo "📚 Generating Swagger documentation..."
php artisan l5-swagger:generate || echo "⚠️  Swagger generation failed"

# Execute the main command
exec "$@"

