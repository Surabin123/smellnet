export default function TopBar({ overview }) {
  return (
    <header className="border-b border-panelBorder bg-panel/60 backdrop-blur px-6 py-4 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-safe/10 border border-safe/30 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8"
              stroke="#4FD1AE"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2" fill="#4FD1AE" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-700 leading-none tracking-wide">
            SMELL<span className="text-safe">NET</span>
          </h1>
          <p className="text-textMuted text-xs font-mono-data mt-0.5">
            ODOUR QUALITY INDEX — NATIONAL SENSOR NETWORK
          </p>
        </div>
      </div>

      {overview && (
        <div className="flex items-center gap-6 font-mono-data text-sm">
          <Stat label="CITIES" value={overview.cityCount} />
          <Stat label="SENSORS" value={overview.sensorCount} />
          <Stat label="READINGS" value={overview.readingCount?.toLocaleString()} />
          <div className="w-px h-8 bg-panelBorder" />
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-safe"
              style={{ boxShadow: "0 0 8px #4FD1AE" }}
            />
            <span className="text-textMuted text-xs">LIVE SIMULATION</span>
          </div>
        </div>
      )}
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-right">
      <div className="text-textPrimary text-lg leading-none">{value ?? "—"}</div>
      <div className="text-textMuted text-[10px] tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
