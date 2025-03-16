#!/bin/bash

mkdir -p /app/gallop_project
echo "$DB_SSL_CA" | tr ' ' '\n'  > /app/gallop_project/ca-certificate.crt
echo "CA Certificate written to /app/gallop_project/ca-certificate.crt"

exec gunicorn gallop_project.wsgi --log-file -