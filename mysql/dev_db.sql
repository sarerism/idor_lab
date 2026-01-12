CREATE DATABASE IF NOT EXISTS dev_environment;
USE dev_environment;


CREATE TABLE IF NOT EXISTS dev_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    port INT,
    username VARCHAR(100),
    password VARCHAR(255),
    access_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

INSERT INTO dev_access (server_name, hostname, service_type, port, username, password, access_level) VALUES
('Development Portal', 'dev.mbti.local', 'gitea', 3000, 'admin', 'cDjv8kFq67C1D1Yuhn8', 'administrator'),
('Development Portal', 'dev.mbti.local', 'gitea', 3000, 'developer', 'DevGit@MBTI2024', 'developer'),
('Development Portal', 'dev.mbti.local', 'gitea', 3000, 'peter.schneider', 'GitAccess!2024', 'developer'),
('CI/CD Pipeline', 'dev.mbti.local', 'jenkins', 8080, 'jenkins-admin', 'JenkinsMBTI!2024', 'administrator'),
('API Documentation', 'dev.mbti.local', 'swagger', 8081, NULL, NULL, NULL),
('Development Database', 'dev.mbti.local', 'mysql', 3306, NULL, NULL, NULL),
('Redis Cache', 'dev.mbti.local', 'redis', 6379, 'redis-user', 'RedisDev2024!', 'read-write');

GRANT ALL PRIVILEGES ON dev_environment.* TO 'mbti_admin'@'%';
FLUSH PRIVILEGES;
