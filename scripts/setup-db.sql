-- Create database and user for diyski evaluation system
CREATE DATABASE diyski;
CREATE USER diyski WITH PASSWORD 'diyski';
GRANT ALL PRIVILEGES ON DATABASE diyski TO diyski;
\c diyski
GRANT ALL ON SCHEMA public TO diyski;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO diyski;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO diyski;
