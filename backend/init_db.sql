-- Database initialization script
-- This will be run automatically when MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS emesa_db;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'emesa_user'@'%' IDENTIFIED BY 'Emesa@123';

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON emesa_db.* TO 'emesa_user'@'%';

-- Apply changes
FLUSH PRIVILEGES; 