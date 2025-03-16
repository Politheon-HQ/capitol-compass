#!/bin/bash

echo "Starting Heroku App..."

# Ensure the directory exists
mkdir -p /tmp/

# Define CA certificate path
export CA_CERT_PATH="/tmp/ca-certificate.crt"

# Debug: Show files before writing
echo "Before writing CA certificate:"
ls -l /tmp/

# Check if DB_SSL_CA exists before writing the file
if [[ -n "$DB_SSL_CA" ]]; then
    echo "$DB_SSL_CA" | tr ' ' '\n' > "$CA_CERT_PATH"
    echo "CA Certificate written to $CA_CERT_PATH"
else
    echo "DB_SSL_CA environment variable is empty! SSL connection might fail."
fi

# Debug: Show files after writing
echo "After writing CA certificate:"
ls -l /tmp/

# Start Gunicorn
exec gunicorn gallop_project.wsgi --log-file -