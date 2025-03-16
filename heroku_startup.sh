#!/bin/bash

mkdir -p /app/gallop_project

if [ ! -f "/app/gallop_project/ca-certificate.crt" ]; then
    echo "$DB_SSL_CA" | tr ' ' '\n' > /app/gallop_project/ca-certificate.crt
    echo "CA certificate written to /app/gallop_project/ca-certificate.crt"
else
    echo "CA certificate already exists."
fi

exec gunicorn gallop_project.wsgi --log-file -