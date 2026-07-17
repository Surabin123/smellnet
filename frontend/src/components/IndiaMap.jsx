import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { colorForOqi } from "../utils/oqi";

export default function IndiaMap({ cities, onSelectCity, selectedCityId }) {
  const center = [22.9734, 78.6569]; // geographic center of India

  return (
    <div className="rounded-lg overflow-hidden border border-panelBorder h-full relative">
      <MapContainer
        center={center}
        zoom={5}
        minZoom={4}
        maxZoom={9}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {cities.map((c) => {
          const color = colorForOqi(c.oqi_score);
          const isSelected = c.city_id === selectedCityId;
          return (
            <CircleMarker
              key={c.city_id}
              center={[c.latitude, c.longitude]}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                color: isSelected ? "#EAF0EC" : color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => onSelectCity(c.city_id),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <div className="font-mono-data text-xs">
                  <strong>{c.name}</strong>, {c.state}
                  <br />
                  OQI {Math.round(c.oqi_score)} · {c.oqi_category}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-3 left-3 bg-panel/90 border border-panelBorder rounded-md px-3 py-2 font-mono-data text-[10px] z-[1000] flex gap-3">
        {[
          ["Good", "#4FD1AE"],
          ["Moderate", "#8FD14F"],
          ["Poor", "#E8B23D"],
          ["Severe", "#E85D3D"],
          ["Hazardous", "#C23B4F"],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-textMuted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
