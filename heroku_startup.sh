#!/bin/bash

mkdir -p /tmp/

# Ensure a fresh CA certificate is always written at startup
echo "$DB_SSL_CA" | tr ' ' '\n' > /tmp/ca-certificate.crt
export DB_SSL_CA="/tmp/ca-certificate.crt"

echo "CA Certificate written to $DB_SSL_CA"
exec gunicorn gallop_project.wsgi --log-file -