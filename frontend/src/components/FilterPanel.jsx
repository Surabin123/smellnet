export default function FilterPanel({
  states,
  zones,
  selectedState,
  selectedZone,
  onStateChange,
  onZoneChange,
  categoryBreakdown,
}) {
  return (
    <div className="border border-panelBorder rounded-lg bg-panel/40 p-4 space-y-5">
      <div>
        <h3 className="font-mono-data text-xs text-textMuted mb-2 tracking-wider">FILTER · STATE</h3>
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          className="w-full bg-bg border border-panelBorder rounded-md px-3 py-2 text-sm text-textPrimary"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="font-mono-data text-xs text-textMuted mb-2 tracking-wider">FILTER · ZONE TYPE</h3>
        <div className="flex flex-wrap gap-2">
          {["", ...zones].map((z) => (
            <button
              key={z || "all"}
              onClick={() => onZoneChange(z)}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                selectedZone === z
                  ? "border-safe text-safe bg-safe/10"
                  : "border-panelBorder text-textMuted hover:text-textPrimary"
              }`}
            >
              {z || "All zones"}
            </button>
          ))}
        </div>
      </div>

      {categoryBreakdown && (
        <div>
          <h3 className="font-mono-data text-xs text-textMuted mb-2 tracking-wider">
            NATIONAL CATEGORY SPLIT
          </h3>
          <div className="space-y-1.5">
            {Object.entries(categoryBreakdown).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-textMuted">{cat}</span>
                <span className="font-mono-data text-textPrimary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
