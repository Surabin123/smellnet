import { colorForOqi } from "../utils/oqi";

export default function HotspotTable({ hotspots, onSelectCity, selectedCityId }) {
  const maxOqi = Math.max(...hotspots.map((h) => Number(h.avg_oqi)), 1);

  return (
    <div className="border border-panelBorder rounded-lg bg-panel/40 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-panelBorder flex items-baseline justify-between">
        <h2 className="font-display text-lg tracking-wide">TOP ODOUR HOTSPOTS</h2>
        <span className="text-textMuted text-[10px] font-mono-data">7-DAY AVG</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-panelBorder">
        {hotspots.map((h, i) => {
          const color = colorForOqi(h.avg_oqi);
          const widthPct = (Number(h.avg_oqi) / maxOqi) * 100;
          const isSelected = h.city_id === selectedCityId;
          return (
            <button
              key={h.city_id}
              onClick={() => onSelectCity(h.city_id)}
              className={`w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors ${
                isSelected ? "bg-white/5" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono-data text-textMuted text-xs w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm font-medium">{h.name}</span>
                  <span className="text-textMuted text-xs shrink-0">{h.state}</span>
                </div>
                <span className="font-mono-data text-sm shrink-0" style={{ color }}>
                  {h.avg_oqi}
                </span>
              </div>
              <div className="h-1.5 bg-grid-line/50 rounded-full overflow-hidden bg-black/30">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, background: color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
