"""
Loads cities.csv / sensors.csv / readings.csv into PostgreSQL using
fast COPY. Run generate_data.py first.

Usage:
    python load_to_postgres.py --dsn "postgresql://user:pass@localhost:5432/smellnet"
"""

import argparse
import csv
import psycopg2


def copy_csv(cur, table, csv_path, columns):
    with open(csv_path, "r") as f:
        next(f)  # skip header
        cur.copy_expert(
            f"COPY {table} ({', '.join(columns)}) FROM STDIN WITH CSV", f
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True, help="postgresql://user:pass@host:port/dbname")
    parser.add_argument("--dir", default=".")
    args = parser.parse_args()

    conn = psycopg2.connect(args.dsn)
    cur = conn.cursor()

    print("Loading cities...")
    copy_csv(cur, "cities", f"{args.dir}/cities.csv",
              ["city_id", "name", "state", "latitude", "longitude", "zone_type", "population_tier"])

    print("Loading sensors...")
    copy_csv(cur, "sensors", f"{args.dir}/sensors.csv",
              ["sensor_id", "city_id", "device_code", "install_date", "status"])

    print("Loading readings (this is the big one, may take a bit)...")
    copy_csv(cur, "readings", f"{args.dir}/readings.csv",
              ["sensor_id", "recorded_at", "h2s_ppb", "nh3_ppb", "voc_ppb", "ch4_ppm", "co_ppm", "oqi_score", "oqi_category"])

    # Reset sequences since we inserted explicit IDs
    cur.execute("SELECT setval('cities_city_id_seq', (SELECT MAX(city_id) FROM cities))")
    cur.execute("SELECT setval('sensors_sensor_id_seq', (SELECT MAX(sensor_id) FROM sensors))")

    conn.commit()
    cur.close()
    conn.close()
    print("Done. Data loaded into Postgres.")


if __name__ == "__main__":
    main()
