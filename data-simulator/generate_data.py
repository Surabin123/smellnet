"""
SmellNet — synthetic IoT Electronic Nose data generator
=========================================================
Generates realistic multi-gas sensor readings for 100+ Indian cities and
computes a composite Odour Quality Index (OQI), CPCB-AQI style:
each gas gets a sub-index via piecewise-linear interpolation against
breakpoints, and OQI = the dominant (max) sub-index — the same
"worst pollutant decides the category" logic India's AQI uses.

Output: three CSVs (cities.csv, sensors.csv, readings.csv) that
load_to_postgres.py inserts into the schema in database/schema.sql.

Run:
    python generate_data.py --days 30 --sensors-per-city 3
"""

import argparse
import csv
import math
import random
from datetime import datetime, timedelta

from cities_india import CITIES

random.seed(42)

# ------------------------------------------------------------------
# OQI breakpoints per gas: (low, high, oqi_low, oqi_high)
# Categories: Good(0-50) Moderate(51-100) Poor(101-200) Severe(201-300) Hazardous(301-500)
# Values are illustrative (modeled loosely on CPCB AQI breakpoint logic,
# adapted for e-nose gas channels) — good enough for a demo/portfolio project.
# ------------------------------------------------------------------
BREAKPOINTS = {
    "h2s_ppb": [(0, 5, 0, 50), (5, 15, 51, 100), (15, 30, 101, 200), (30, 50, 201, 300), (50, 100, 301, 500)],
    "nh3_ppb": [(0, 25, 0, 50), (25, 50, 51, 100), (50, 100, 101, 200), (100, 200, 201, 300), (200, 400, 301, 500)],
    "voc_ppb": [(0, 50, 0, 50), (50, 150, 51, 100), (150, 300, 101, 200), (300, 500, 201, 300), (500, 1000, 301, 500)],
    "ch4_ppm": [(0, 2, 0, 50), (2, 5, 51, 100), (5, 10, 101, 200), (10, 20, 201, 300), (20, 40, 301, 500)],
    "co_ppm":  [(0, 1, 0, 50), (1, 2, 51, 100), (2, 4, 101, 200), (4, 8, 201, 300), (8, 15, 301, 500)],
}

CATEGORY_BANDS = [
    (0, 50, "Good"), (51, 100, "Moderate"), (101, 200, "Poor"),
    (201, 300, "Severe"), (301, 500, "Hazardous"),
]

# Baseline gas levels (mean, std) by zone type — industrial runs hotter on
# VOC/CO, residential stays low, mixed sits in between.
ZONE_PROFILES = {
    "Industrial":  {"h2s_ppb": (8, 5), "nh3_ppb": (35, 15), "voc_ppb": (180, 90), "ch4_ppm": (3.5, 2), "co_ppm": (2.2, 1.2)},
    "Commercial":  {"h2s_ppb": (3, 2), "nh3_ppb": (15, 8), "voc_ppb": (70, 35), "ch4_ppm": (1.5, 0.8), "co_ppm": (1.8, 0.9)},
    "Residential": {"h2s_ppb": (2, 1.5), "nh3_ppb": (10, 6), "voc_ppb": (30, 20), "ch4_ppm": (1.0, 0.6), "co_ppm": (0.8, 0.5)},
    "Mixed":       {"h2s_ppb": (5, 3), "nh3_ppb": (22, 10), "voc_ppb": (100, 55), "ch4_ppm": (2.2, 1.2), "co_ppm": (1.4, 0.8)},
}

# ~15% of sensors sit near a "hotspot" source (drainage/sewage line, landfill,
# waste dump) — this is what produces the recurring hotspot clusters the
# resume bullet references, instead of uniform random noise everywhere.
HOTSPOT_PROBABILITY = 0.15
HOTSPOT_MULTIPLIER = {"h2s_ppb": 4.5, "nh3_ppb": 3.0, "voc_ppb": 1.8, "ch4_ppm": 2.5, "co_ppm": 1.2}

# Hour-of-day multiplier curves (index = hour 0-23). Two humps: morning
# waste-collection/traffic (7-9am) and evening traffic/industrial-shift (6-9pm).
HOUR_CURVE = [
    0.55, 0.5, 0.45, 0.45, 0.5, 0.7, 1.0, 1.35, 1.4, 1.1, 0.95, 0.9,
    0.95, 0.9, 0.85, 0.9, 1.0, 1.25, 1.45, 1.4, 1.15, 0.9, 0.7, 0.6,
]


def sub_index(gas, value):
    bps = BREAKPOINTS[gas]
    lo, hi, oqi_lo, oqi_hi = bps[-1]
    if value <= bps[0][1]:
        for lo, hi, oqi_lo, oqi_hi in bps:
            if value <= hi:
                break
    for lo, hi, oqi_lo, oqi_hi in bps:
        if lo <= value <= hi:
            break
    if hi == lo:
        return oqi_lo
    return round(oqi_lo + (value - lo) * (oqi_hi - oqi_lo) / (hi - lo), 2)


def categorize(oqi):
    for lo, hi, label in CATEGORY_BANDS:
        if lo <= oqi <= hi:
            return label
    return "Hazardous"


def gen_reading(zone_type, hour, is_hotspot):
    profile = ZONE_PROFILES[zone_type]
    hour_mult = HOUR_CURVE[hour]
    values = {}
    for gas, (mean, std) in profile.items():
        v = max(0.0, random.gauss(mean, std)) * hour_mult
        if is_hotspot:
            v *= HOTSPOT_MULTIPLIER[gas]
        values[gas] = round(v, 2)

    sub_indices = {gas: sub_index(gas, v) for gas, v in values.items()}
    oqi = max(sub_indices.values())
    values["oqi_score"] = oqi
    values["oqi_category"] = categorize(oqi)
    return values


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30, help="Days of hourly history to generate")
    parser.add_argument("--sensors-per-city", type=int, default=3)
    parser.add_argument("--out-dir", default=".")
    args = parser.parse_args()

    cities_path = f"{args.out_dir}/cities.csv"
    sensors_path = f"{args.out_dir}/sensors.csv"
    readings_path = f"{args.out_dir}/readings.csv"

    with open(cities_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["city_id", "name", "state", "latitude", "longitude", "zone_type", "population_tier"])
        for i, (name, state, lat, lon, zone, tier) in enumerate(CITIES, start=1):
            w.writerow([i, name, state, lat, lon, zone, tier])

    sensors = []
    sensor_meta = {}  # sensor_id -> (zone_type, is_hotspot)
    sid = 1
    with open(sensors_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["sensor_id", "city_id", "device_code", "install_date", "status"])
        for i, (name, state, lat, lon, zone, tier) in enumerate(CITIES, start=1):
            for n in range(args.sensors_per_city):
                is_hotspot = random.random() < HOTSPOT_PROBABILITY
                device_code = f"SNET-{i:03d}-{n+1}"
                install_date = (datetime(2025, 8, 1) - timedelta(days=random.randint(0, 20))).date()
                w.writerow([sid, i, device_code, install_date, "active"])
                sensor_meta[sid] = (zone, is_hotspot)
                sid += 1

    start = datetime(2025, 8, 1)
    total_hours = args.days * 24
    with open(readings_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["sensor_id", "recorded_at", "h2s_ppb", "nh3_ppb", "voc_ppb", "ch4_ppm", "co_ppm", "oqi_score", "oqi_category"])
        for hour_offset in range(total_hours):
            ts = start + timedelta(hours=hour_offset)
            hour = ts.hour
            for sensor_id, (zone, is_hotspot) in sensor_meta.items():
                r = gen_reading(zone, hour, is_hotspot)
                w.writerow([
                    sensor_id, ts.isoformat(sep=" "),
                    r["h2s_ppb"], r["nh3_ppb"], r["voc_ppb"], r["ch4_ppm"], r["co_ppm"],
                    r["oqi_score"], r["oqi_category"],
                ])

    print(f"Generated {len(CITIES)} cities, {len(sensor_meta)} sensors, "
          f"{total_hours * len(sensor_meta):,} readings.")
    print(f"-> {cities_path}\n-> {sensors_path}\n-> {readings_path}")


if __name__ == "__main__":
    main()
