# SmellNet — AI & IoT Odour Monitoring System

India's first simulated **Odour Quality Index (OQI)**: synthetic IoT
Electronic Nose data across 100+ Indian cities, aggregated with SQL, and
visualized on an interactive dashboard (map heatmap + trend charts).

```
Python (data simulation) → PostgreSQL (SQL aggregation) → Express API → React dashboard
```

## Project structure

```
smellnet/
├── data-simulator/       # Python: generates realistic sensor + OQI data
│   ├── cities_india.py   # 130 Indian cities with coordinates & zone type
│   ├── generate_data.py  # builds cities.csv / sensors.csv / readings.csv
│   └── load_to_postgres.py
├── database/
│   └── schema.sql        # tables + reference SQL aggregation queries
├── backend/               # Node.js + Express REST API (PostgreSQL)
│   └── src/
├── frontend/               # React + Vite + Tailwind + Leaflet + Recharts
│   └── src/
└── README.md               (this file)
```

## 1. Set up PostgreSQL

```bash
# create the database
createdb smellnet

# load the schema
psql -d smellnet -f database/schema.sql
```

If you don't have Postgres locally, the quickest path is a free instance on
[Neon](https://neon.tech) or [Supabase](https://supabase.com) — copy the
connection string they give you and use it as `DATABASE_URL` below.

## 2. Generate and load the sensor data

```bash
cd data-simulator
pip install psycopg2-binary

# generate 30 days of hourly readings for 3 sensors per city (~700k rows)
python generate_data.py --days 30 --sensors-per-city 3

# load into Postgres
python load_to_postgres.py --dsn "postgresql://user:pass@localhost:5432/smellnet"
```

Tune `--days` and `--sensors-per-city` down (e.g. `--days 7`) if you want a
smaller, faster-loading dataset for a demo.

## 3. Run the backend API

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL to match your DB
npm start                   # runs on http://localhost:5000
```

Quick check: `curl http://localhost:5000/api/overview` should return JSON.

## 4. Run the frontend

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so just open
`http://localhost:5173`.

## How the OQI is calculated

Each sensor reports five gas channels (H2S, NH3, VOC, CH4, CO — the same
channels a real MQ-series electronic nose array reports). Each gas value is
converted to a 0–500 sub-index via breakpoint interpolation (same method
India's CPCB uses for AQI), and the **OQI is the maximum sub-index** — the
single worst pollutant decides the city's odour category, exactly like AQI:

| OQI range | Category |
|---|---|
| 0–50 | Good |
| 51–100 | Moderate |
| 101–200 | Poor |
| 201–300 | Severe |
| 301–500 | Hazardous |

The simulator biases gas levels by each city's zone type (Industrial /
Commercial / Residential / Mixed) and gives ~15% of sensors a "hotspot"
multiplier (near a drain, dump, or industrial outfall) so the map shows
realistic recurring clusters instead of uniform noise — this is what the
"recurring pollution hotspot" pattern in the resume bullet refers to.

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/overview` | National average OQI, sensor/city counts, category split |
| `GET /api/heatmap` | Latest OQI per city, for the map |
| `GET /api/hotspots?days=7&limit=10` | Worst cities ranked by avg OQI |
| `GET /api/cities?state=&zone=` | Filterable city list |
| `GET /api/city/:id` | City detail + recent raw readings |
| `GET /api/city/:id/trend?days=14` | Daily OQI trend for one city |
| `GET /api/city/:id/peak-hours` | Hour-of-day OQI pattern for one city |

## What to say about this in interviews / your resume

- You designed a **composite index** (OQI) using CPCB-AQI-style breakpoint
  interpolation across 5 gas channels — not just averaging raw values.
- You wrote **SQL aggregation queries** (window functions via `LATERAL`
  joins for "latest reading per city", `GROUP BY` + `AVG` for hotspot
  ranking, `EXTRACT(HOUR ...)` for peak-time analysis).
- You built a **geospatial dashboard** (Leaflet) and **trend visualizations**
  (Recharts) consuming a REST API you designed.
- Data is currently simulated (clearly documented as such) because you don't
  have physical e-nose hardware — the pipeline is built so real sensor data
  could be swapped in without changing the schema or API.

## Notes on scope

This is intentionally sized for a student portfolio project: one Postgres
database, one Express service, one React app. If you want to extend it:
- Swap the simulator for a real MQ-135/MQ-136 sensor + ESP32 publishing to
  the same `readings` table via a small ingestion endpoint.
- Add authentication for a "municipal team" login.
- Add a `POST /api/alerts` that fires when a city crosses into Severe/Hazardous.
