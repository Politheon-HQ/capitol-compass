#!/bin/bash
set -e

# Print some debug info
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Python path:"
echo $PYTHONPATH
echo "Django settings module:"
echo $DJANGO_SETTINGS_MODULE

# Try to import the WSGI application
echo "Trying to import WSGI application..."
python -c "from cc_project.wsgi import application"

# If we get here, the import worked, so start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn cc_project.wsgi:application --bind 0.0.0.0:80 --log-level debug
