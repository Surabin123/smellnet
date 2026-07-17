import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import GaugeDial from "./components/GaugeDial";
import IndiaMap from "./components/IndiaMap";
import HotspotTable from "./components/HotspotTable";
import CityDetailPanel from "./components/CityDetailPanel";
import FilterPanel from "./components/FilterPanel";
import { getOverview, getHeatmap, getHotspots } from "./api";

export default function App() {
  const [overview, setOverview] = useState(null);
  const [cities, setCities] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getOverview(), getHeatmap(), getHotspots(7, 12)])
      .then(([o, c, h]) => {
        setOverview(o);
        setCities(c);
        setHotspots(h);
      })
      .catch(() =>
        setError(
          "Can't reach the SmellNet API. Make sure the backend is running on port 5000 and the database is seeded."
        )
      );
  }, []);

  const states = useMemo(
    () => [...new Set(cities.map((c) => c.state))].sort(),
    [cities]
  );
  const zones = useMemo(
    () => [...new Set(cities.map((c) => c.zone_type))].sort(),
    [cities]
  );

  const filteredCities = useMemo(
    () =>
      cities.filter(
        (c) =>
          (!selectedState || c.state === selectedState) &&
          (!selectedZone || c.zone_type === selectedZone)
      ),
    [cities, selectedState, selectedZone]
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="border border-danger/40 bg-danger/10 rounded-lg p-6 max-w-md text-center">
          <p className="font-mono-data text-sm text-textPrimary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar overview={overview} />

      <main className="flex-1 p-5 grid grid-cols-12 gap-5">
        {/* Left column: national gauge + filters */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">
          <div className="border border-panelBorder rounded-lg bg-panel/40 p-5 flex justify-center">
            {overview ? (
              <GaugeDial
                value={overview.avgOqi}
                label="NATIONAL AVERAGE"
                sublabel={`ACROSS ${overview.cityCount} CITIES`}
                size={220}
              />
            ) : (
              <div className="text-textMuted text-sm font-mono-data py-12">Loading…</div>
            )}
          </div>
          <FilterPanel
            states={states}
            zones={zones}
            selectedState={selectedState}
            selectedZone={selectedZone}
            onStateChange={setSelectedState}
            onZoneChange={setSelectedZone}
            categoryBreakdown={overview?.categoryBreakdown}
          />
        </div>

        {/* Center column: map */}
        <div className="col-span-12 lg:col-span-5 h-[520px] lg:h-auto">
          <IndiaMap
            cities={filteredCities}
            onSelectCity={setSelectedCityId}
            selectedCityId={selectedCityId}
          />
        </div>

        {/* Right column: hotspots + detail */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 h-[520px] lg:h-auto">
          <div className="h-1/2 min-h-[220px]">
            <HotspotTable
              hotspots={hotspots}
              onSelectCity={setSelectedCityId}
              selectedCityId={selectedCityId}
            />
          </div>
          <div className="h-1/2 min-h-[320px]">
            <CityDetailPanel cityId={selectedCityId} />
          </div>
        </div>
      </main>

      <footer className="px-6 py-3 text-center text-textMuted text-[11px] font-mono-data border-t border-panelBorder">
        SmellNet — IoT Electronic Nose Network · Simulated demo data · Built with React, Express &amp; PostgreSQL
      </footer>
    </div>
  );
}
