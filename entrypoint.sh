#!/bin/bash
set -e

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "Running migrations..."
python manage.py migrate --fake-initial --noinput

# If we get here, the import worked, so start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn cc_project.wsgi:application --bind 0.0.0.0:8000 --workers 3
