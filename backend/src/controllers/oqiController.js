import { pool } from "../db/pool.js";

// --------------------------------------------------------------
// GET /api/overview
// National-level snapshot: average OQI, worst city, sensor count,
// category breakdown — powers the top stat strip on the dashboard.
// --------------------------------------------------------------
export async function getOverview(req, res) {
  try {
    const latest = await pool.query(`
      SELECT DISTINCT ON (s.city_id) s.city_id, r.oqi_score, r.oqi_category
      FROM readings r
      JOIN sensors s ON s.sensor_id = r.sensor_id
      ORDER BY s.city_id, r.recorded_at DESC
    `);

    const rows = latest.rows;
    const avgOqi = rows.reduce((sum, r) => sum + Number(r.oqi_score), 0) / rows.length;

    const categoryBreakdown = rows.reduce((acc, r) => {
      acc[r.oqi_category] = (acc[r.oqi_category] || 0) + 1;
      return acc;
    }, {});

    const sensorCount = await pool.query("SELECT COUNT(*) FROM sensors");
    const cityCount = await pool.query("SELECT COUNT(*) FROM cities");
    const readingCount = await pool.query("SELECT COUNT(*) FROM readings");

    res.json({
      avgOqi: Math.round(avgOqi * 10) / 10,
      cityCount: Number(cityCount.rows[0].count),
      sensorCount: Number(sensorCount.rows[0].count),
      readingCount: Number(readingCount.rows[0].count),
      categoryBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
}

// --------------------------------------------------------------
// GET /api/heatmap
// Latest OQI reading per city, for the map layer.
// --------------------------------------------------------------
export async function getHeatmap(req, res) {
  try {
    const result = await pool.query(`
      SELECT c.city_id, c.name, c.state, c.latitude, c.longitude,
             c.zone_type, r.oqi_score, r.oqi_category, r.recorded_at
      FROM cities c
      JOIN sensors s ON s.city_id = c.city_id
      JOIN LATERAL (
        SELECT oqi_score, oqi_category, recorded_at
        FROM readings
        WHERE sensor_id = s.sensor_id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) r ON true
      GROUP BY c.city_id, c.name, c.state, c.latitude, c.longitude, c.zone_type,
               r.oqi_score, r.oqi_category, r.recorded_at
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
}

// --------------------------------------------------------------
// GET /api/hotspots?limit=10&days=7
// City-wise average OQI over a window, ranked worst-first.
// --------------------------------------------------------------
export async function getHotspots(req, res) {
  const limit = Number(req.query.limit) || 10;
  const days = Number(req.query.days) || 7;
  try {
    const result = await pool.query(
      `
      SELECT c.city_id, c.name, c.state, c.zone_type,
             ROUND(AVG(r.oqi_score), 1) AS avg_oqi,
             COUNT(*) AS reading_count,
             MODE() WITHIN GROUP (ORDER BY r.oqi_category) AS common_category
      FROM readings r
      JOIN sensors s ON s.sensor_id = r.sensor_id
      JOIN cities c ON c.city_id = s.city_id
      WHERE r.recorded_at >= (SELECT MAX(recorded_at) FROM readings) - ($1 || ' days')::interval
      GROUP BY c.city_id, c.name, c.state, c.zone_type
      ORDER BY avg_oqi DESC
      LIMIT $2
      `,
      [days, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hotspots" });
  }
}

// --------------------------------------------------------------
// GET /api/cities?state=Karnataka&zone=Industrial
// Full city list with latest OQI, filterable — powers the table/sidebar.
// --------------------------------------------------------------
export async function getCities(req, res) {
  const { state, zone } = req.query;
  const conditions = [];
  const params = [];

  if (state) {
    params.push(state);
    conditions.push(`c.state = $${params.length}`);
  }
  if (zone) {
    params.push(zone);
    conditions.push(`c.zone_type = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `
      SELECT c.city_id, c.name, c.state, c.zone_type, c.population_tier,
             r.oqi_score, r.oqi_category, r.recorded_at
      FROM cities c
      JOIN sensors s ON s.city_id = c.city_id
      JOIN LATERAL (
        SELECT oqi_score, oqi_category, recorded_at
        FROM readings WHERE sensor_id = s.sensor_id
        ORDER BY recorded_at DESC LIMIT 1
      ) r ON true
      ${whereClause}
      GROUP BY c.city_id, c.name, c.state, c.zone_type, c.population_tier,
               r.oqi_score, r.oqi_category, r.recorded_at
      ORDER BY r.oqi_score DESC
      `,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
}

// --------------------------------------------------------------
// GET /api/city/:id/trend?days=14
// Daily average OQI trend for one city, for the line chart.
// --------------------------------------------------------------
export async function getCityTrend(req, res) {
  const { id } = req.params;
  const days = Number(req.query.days) || 14;
  try {
    const result = await pool.query(
      `
      SELECT DATE(r.recorded_at) AS day, ROUND(AVG(r.oqi_score), 1) AS avg_oqi,
             ROUND(AVG(r.h2s_ppb), 1) AS avg_h2s, ROUND(AVG(r.nh3_ppb), 1) AS avg_nh3,
             ROUND(AVG(r.voc_ppb), 1) AS avg_voc
      FROM readings r
      JOIN sensors s ON s.sensor_id = r.sensor_id
      WHERE s.city_id = $1
        AND r.recorded_at >= (SELECT MAX(recorded_at) FROM readings) - ($2 || ' days')::interval
      GROUP BY day
      ORDER BY day
      `,
      [id, days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch city trend" });
  }
}

// --------------------------------------------------------------
// GET /api/city/:id/peak-hours
// Hour-of-day average OQI — identifies the peak odour windows.
// --------------------------------------------------------------
export async function getCityPeakHours(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT EXTRACT(HOUR FROM r.recorded_at)::int AS hour_of_day,
             ROUND(AVG(r.oqi_score), 1) AS avg_oqi
      FROM readings r
      JOIN sensors s ON s.sensor_id = r.sensor_id
      WHERE s.city_id = $1
      GROUP BY hour_of_day
      ORDER BY hour_of_day
      `,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch peak hours" });
  }
}

// --------------------------------------------------------------
// GET /api/city/:id
// Single city detail: metadata + latest reading + gas breakdown.
// --------------------------------------------------------------
export async function getCityDetail(req, res) {
  const { id } = req.params;
  try {
    const city = await pool.query("SELECT * FROM cities WHERE city_id = $1", [id]);
    if (city.rows.length === 0) return res.status(404).json({ error: "City not found" });

    const latest = await pool.query(
      `
      SELECT r.* FROM readings r
      JOIN sensors s ON s.sensor_id = r.sensor_id
      WHERE s.city_id = $1
      ORDER BY r.recorded_at DESC
      LIMIT 5
      `,
      [id]
    );

    res.json({ city: city.rows[0], recentReadings: latest.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch city detail" });
  }
}
