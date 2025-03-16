#!/bin/bash

mkdir -p /app/gallop_project

if [ ! -f "/app/gallop_project/ca-certificate.crt" ]; then
    echo "$DB_SSL_CA" | tr ' ' '\n' > /app/gallop_project/ca-certificate.crt
    echo "CA Certificate written to /app/gallop_project/ca-certificate.crt"
else
    echo "CA Certificate already exists. Skipping write."
fi

exec gunicorn gallop_project.wsgi --log-file -