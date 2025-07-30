-- Database initialization script
-- This will be run automatically when MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ${MYSQL_DB};

-- Create user if it doesn't exist (for any host)
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';

-- Create user if it doesn't exist (for localhost)
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';

-- Grant all privileges to the user (for any host)
GRANT ALL PRIVILEGES ON ${MYSQL_DB}.* TO '${MYSQL_USER}'@'%';

-- Grant all privileges to the user (for localhost)
GRANT ALL PRIVILEGES ON ${MYSQL_DB}.* TO '${MYSQL_USER}'@'localhost';

-- Apply changes
FLUSH PRIVILEGES; 