
-- Create read-only user for the application
-- This mitigates the impact of SQL Injection by preventing data modification

-- Connect to the database
\c lampa_db

-- Create the user
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'lampa_read') THEN

      CREATE ROLE lampa_read LOGIN PASSWORD 'lampa_read_secure';
   END IF;
END
$do$;

-- Grant permissions
GRANT CONNECT ON DATABASE lampa_db TO lampa_read;

-- Schema permissions
GRANT USAGE ON SCHEMA lampa TO lampa_read;
GRANT USAGE ON SCHEMA public TO lampa_read;

-- Table permissions (Read-Only)
GRANT SELECT ON ALL TABLES IN SCHEMA lampa TO lampa_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lampa_read;

-- Ensure future tables are also readable
ALTER DEFAULT PRIVILEGES IN SCHEMA lampa GRANT SELECT ON TABLES TO lampa_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO lampa_read;
