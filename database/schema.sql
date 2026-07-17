-- ============================================================
-- SmellNet Database Schema (PostgreSQL)
-- India's first Odour Quality Index (OQI) - data model
-- ============================================================

DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- ------------------------------------------------------------
-- Cities: the 100+ Indian cities covered by the sensor network
-- ------------------------------------------------------------
CREATE TABLE cities (
    city_id     SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    zone_type   VARCHAR(50) NOT NULL, -- Industrial, Residential, Commercial, Landfill, Mixed
    population_tier VARCHAR(20) NOT NULL -- Metro, Tier-1, Tier-2, Tier-3
);

-- ------------------------------------------------------------
-- Sensors: individual Electronic Nose (e-nose) IoT devices
-- ------------------------------------------------------------
CREATE TABLE sensors (
    sensor_id     SERIAL PRIMARY KEY,
    city_id       INTEGER NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
    device_code   VARCHAR(30) UNIQUE NOT NULL,
    install_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active' -- active, offline, maintenance
);

-- ------------------------------------------------------------
-- Readings: raw gas-concentration readings from each sensor
-- Gas channels modeled on real e-nose arrays (MQ-series style):
--   h2s_ppb   - Hydrogen Sulfide (sewage / rotten egg odour)
--   nh3_ppb   - Ammonia (waste, industrial)
--   voc_ppb   - Volatile Organic Compounds (chemical/industrial)
--   ch4_ppm   - Methane (landfill/organic decay)
--   co_ppm    - Carbon Monoxide (combustion/traffic)
-- ------------------------------------------------------------
CREATE TABLE readings (
    reading_id   BIGSERIAL PRIMARY KEY,
    sensor_id    INTEGER NOT NULL REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    recorded_at  TIMESTAMP NOT NULL,
    h2s_ppb      NUMERIC(8,2) NOT NULL,
    nh3_ppb      NUMERIC(8,2) NOT NULL,
    voc_ppb      NUMERIC(8,2) NOT NULL,
    ch4_ppm      NUMERIC(8,2) NOT NULL,
    co_ppm       NUMERIC(8,2) NOT NULL,
    oqi_score    NUMERIC(6,2) NOT NULL,       -- computed composite 0-500 (AQI-style scale)
    oqi_category VARCHAR(20) NOT NULL          -- Good, Moderate, Poor, Severe, Hazardous
);

CREATE INDEX idx_readings_sensor_time ON readings (sensor_id, recorded_at);
CREATE INDEX idx_readings_time ON readings (recorded_at);
CREATE INDEX idx_sensors_city ON sensors (city_id);

-- ============================================================
-- Core aggregation queries used by the backend API
-- (kept here as reference / can be wrapped as views)
-- ============================================================

-- 1. Latest OQI per city (for the heatmap)
-- SELECT c.city_id, c.name, c.state, c.latitude, c.longitude,
--        r.oqi_score, r.oqi_category, r.recorded_at
-- FROM cities c
-- JOIN sensors s ON s.city_id = c.city_id
-- JOIN LATERAL (
--     SELECT * FROM readings WHERE sensor_id = s.sensor_id
--     ORDER BY recorded_at DESC LIMIT 1
-- ) r ON true;

-- 2. City-wise average OQI over a time window (hotspot ranking)
-- SELECT c.name, c.state, c.zone_type, ROUND(AVG(r.oqi_score),1) AS avg_oqi,
--        COUNT(*) AS reading_count
-- FROM readings r
-- JOIN sensors s ON s.sensor_id = r.sensor_id
-- JOIN cities c ON c.city_id = s.city_id
-- WHERE r.recorded_at >= NOW() - INTERVAL '7 days'
-- GROUP BY c.city_id, c.name, c.state, c.zone_type
-- ORDER BY avg_oqi DESC
-- LIMIT 10;

-- 3. Peak odour hours per city (hour-of-day pattern)
-- SELECT c.name, EXTRACT(HOUR FROM r.recorded_at) AS hour_of_day,
--        ROUND(AVG(r.oqi_score),1) AS avg_oqi
-- FROM readings r
-- JOIN sensors s ON s.sensor_id = r.sensor_id
-- JOIN cities c ON c.city_id = s.city_id
-- WHERE c.name = 'Bengaluru'
-- GROUP BY c.name, hour_of_day
-- ORDER BY avg_oqi DESC;

-- 4. Trend of OQI for a city over the last N days (daily average)
-- SELECT DATE(r.recorded_at) AS day, ROUND(AVG(r.oqi_score),1) AS avg_oqi
-- FROM readings r
-- JOIN sensors s ON s.sensor_id = r.sensor_id
-- JOIN cities c ON c.city_id = s.city_id
-- WHERE c.city_id = $1 AND r.recorded_at >= NOW() - INTERVAL '30 days'
-- GROUP BY day
-- ORDER BY day;
