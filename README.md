# SmellNet

SmellNet is a data-pipeline and dashboard prototype for exploring a simulated Odour Quality Index (OQI). A Python generator creates synthetic sensor readings for Indian cities, PostgreSQL stores and aggregates them, an Express API serves the data, and a React dashboard visualizes city-level patterns.

> **Data limitation:** This repository uses generated data, not measurements from deployed electronic-nose sensors. OQI breakpoints are illustrative and inspired by AQI-style interpolation; this is not a validated health, regulatory, or environmental monitoring index.

## Features

- Generate city, sensor, and hourly gas-reading CSV data with a Python simulator.
- Load the dataset into PostgreSQL using the schema and loader scripts.
- Calculate OQI values from H2S, NH3, VOC, CH4, and CO channels using piecewise breakpoint interpolation; the highest channel sub-index determines the composite value.
- Serve overview, heatmap, hotspot, city, trend, and peak-hour results through an Express API.
- Explore city readings on a React/Vite map and dashboard with Leaflet and Recharts.

The project does not ingest real IoT devices and does not provide alerting or decision support for public-health or municipal operations.

## Data flow and architecture

```mermaid
flowchart LR
  Sim[Python simulator] --> CSV[Cities, sensors, readings CSV]
  CSV --> Load[PostgreSQL loader]
  Schema[PostgreSQL schema and SQL] --> DB[(PostgreSQL)]
  Load --> DB
  DB --> API[Express API]
  API --> UI[React + Vite dashboard]
```

The frontend requests `/api/...` paths through the Vite development proxy. The backend uses `pg` and reads `DATABASE_URL`/`PORT` from its environment. Database aggregation lives in `database/schema.sql` and the backend query module.

## Repository structure

```text
data-simulator/   Python city/data generator and PostgreSQL loader
database/         PostgreSQL schema and aggregation queries
backend/src/      Express server, routes, controllers, and PostgreSQL pool
frontend/src/     React dashboard, map, charts, API client, and styling
```

## Prerequisites

- Python 3 (the repository does not pin a minimum version; the loader requires `psycopg2-binary`).
- Node.js 20+ and npm for the API and frontend.
- PostgreSQL with `createdb` and `psql` available on `PATH`.

## Local setup (PowerShell)

Run commands from the repository root unless a directory change is shown.

### 1. Create a local database and load the schema

```powershell
createdb smellnet
psql -d smellnet -f .\database\schema.sql
```

**Important:** `database/schema.sql` begins by dropping the `readings`, `sensors`, and `cities` tables. Use a new/empty database; rerunning it deletes those tables and their data.

### 2. Generate and import synthetic readings

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install psycopg2-binary
python .\data-simulator\generate_data.py --days 7 --sensors-per-city 3
python .\data-simulator\load_to_postgres.py --dsn "postgresql://postgres:YOUR_PASSWORD@localhost:5432/smellnet"
```

The generator accepts `--days` and `--sensors-per-city`; start with a smaller dataset while validating the local PostgreSQL setup.

### 3. Configure and run the API

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env`:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/smellnet` |
| `PORT` | API listening port | `5000` |

Then start the server:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`. A basic health response is available at `/`.

### 4. Run the dashboard

In another PowerShell window:

```powershell
Set-Location path\to\smellnet\frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite configuration proxies `/api` to the local API on port `5000`.

## API reference

All endpoints below are implemented under the `/api` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/overview` | Aggregate overview and city/sensor summary |
| `GET` | `/api/heatmap` | Latest city-level values for the map |
| `GET` | `/api/hotspots?days=7&limit=10` | Rank cities by recent average OQI |
| `GET` | `/api/cities?state=&zone=` | List/filter cities |
| `GET` | `/api/city/:id` | City details and recent readings |
| `GET` | `/api/city/:id/trend?days=14` | Daily trend for one city |
| `GET` | `/api/city/:id/peak-hours` | OQI grouping by hour of day |

The API is read-only for dashboard queries; no authentication or write endpoint for live sensor ingestion was found in the inspected routes.

## Testing and deployment

No test scripts or test suite were found in the backend or frontend package manifests. The manifests provide API `start`/`dev` and frontend `dev`/`build`/`preview` scripts. No Docker or hosted deployment configuration was found in the repository tree inspected.

```powershell
# Frontend production build
Set-Location frontend
npm run build
```

This only builds the frontend assets; it does not deploy the API or database. I have not run this build in the documentation-preparation workspace.

## License

No root `LICENSE` file was present in the inspected tree. The backend package declares ISC, but that alone does not establish a repository-wide license for the frontend, simulator, or data. Confirm project ownership and add an appropriate root license before inviting reuse.
