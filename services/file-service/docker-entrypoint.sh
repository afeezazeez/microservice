#!/bin/sh

# Run migrations (allow failure - will retry on next start)
echo "🗄️  Running migrations..."
npm run migrate || echo "⚠️  Migrations failed, will retry on next start"

# Execute the main command
exec "$@"

