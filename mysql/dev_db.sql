-- Create development environment database
CREATE DATABASE IF NOT EXISTS dev_environment;
USE dev_environment;

-- Table for development servers and services
CREATE TABLE IF NOT EXISTS dev_servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    port INT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for development credentials (intentionally leaked via SQLi)
CREATE TABLE IF NOT EXISTS dev_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    access_level VARCHAR(50),
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert development servers information
INSERT INTO dev_servers (server_name, hostname, service_type, port, description, status) VALUES
('Development Portal', 'dev.mbti.local', 'gitea', 3000, 'Internal Git repository hosting service', 'active'),
('CI/CD Pipeline', 'dev.mbti.local', 'jenkins', 8080, 'Continuous integration and deployment', 'active'),
('API Documentation', 'dev.mbti.local', 'swagger', 8081, 'REST API documentation portal', 'active'),
('Development Database', 'dev.mbti.local', 'mysql', 3306, 'Development MySQL instance', 'active'),
('Redis Cache', 'dev.mbti.local', 'redis', 6379, 'Development caching layer', 'active');

-- Insert development credentials (VULNERABLE DATA)
-- These will be discoverable through SQL injection
INSERT INTO dev_credentials (service_name, username, password, access_level, notes) VALUES
('Gitea', 'admin', 'MBTIGit2024!Admin', 'administrator', 'Main Gitea administrator account'),
('Gitea', 'developer', 'DevGit@MBTI2024', 'developer', 'Standard developer account for repository access'),
('Gitea', 'peter.schneider', 'GitAccess!2024', 'developer', 'Peter Schneider development account'),
('Jenkins', 'jenkins-admin', 'JenkinsMBTI!2024', 'administrator', 'CI/CD pipeline administrator'),
('MySQL Dev', 'dev_admin', 'DevDB@2024MBTI', 'administrator', 'Development database admin'),
('Redis', 'redis-user', 'RedisDev2024!', 'read-write', 'Redis cache access');

-- Create view for easier querying (makes SQLi exploitation simpler)
CREATE VIEW dev_access AS
SELECT 
    s.server_name,
    s.hostname,
    s.service_type,
    s.port,
    c.username,
    c.password,
    c.access_level
FROM dev_servers s
LEFT JOIN dev_credentials c ON s.service_type = c.service_name
WHERE s.status = 'active';

-- Grant permissions to the mbti_admin user for cross-database queries
GRANT ALL PRIVILEGES ON dev_environment.* TO 'mbti_admin'@'%';
FLUSH PRIVILEGES;
