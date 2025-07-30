#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! python manage.py check --database default 2>&1; do
    echo "Database not ready, waiting..."
    sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create admin user if it doesn't exist
echo "Checking for admin user..."
python manage.py shell << EOF
from accounts.models import User
if not User.objects.filter(role='admin').exists():
    print("Creating admin user...")
    User.objects.create_user(
        username='admin',
        email='admin@emesa.com',
        password='admin123',
        role='admin',
        is_staff=True
    )
    print("Admin user created successfully!")
else:
    print("Admin user already exists.")
EOF

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn
echo "Starting Gunicorn..."
exec poetry run gunicorn backend.wsgi:application -b 0.0.0.0:8000 --workers=3 --timeout=120 