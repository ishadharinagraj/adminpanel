-- Horizon UI MySQL Schema Setup Script
-- Run this in MySQL Workbench, phpMyAdmin, or MySQL CLI

CREATE DATABASE IF NOT EXISTS horizon_db;

USE horizon_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whitelist_dns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dns VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify table structures
DESCRIBE users;
DESCRIBE whitelist_dns;

