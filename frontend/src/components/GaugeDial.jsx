import { colorForOqi } from "../utils/oqi";

// Analog instrument-panel gauge: a 270-degree arc, banded by OQI category,
// with a needle-less filled arc for the current reading. This is the page's
// signature element — it recurs at national scale and per-city scale so the
// whole dashboard reads like one instrument rather than a stack of widgets.
export default function GaugeDial({ value, label, size = 200, sublabel }) {
  const max = 500;
  const startAngle = -225; // degrees
  const sweep = 270;
  const pct = Math.min(value / max, 1);
  const valueAngle = startAngle + sweep * pct;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const polarToCartesian = (angleDeg) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
  };

  const arcPath = (a0, a1) => {
    const [x0, y0] = polarToCartesian(a0);
    const [x1, y1] = polarToCartesian(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  const bands = [
    { from: 0, to: 50, color: "#4FD1AE" },
    { from: 50, to: 100, color: "#8FD14F" },
    { from: 100, to: 200, color: "#E8B23D" },
    { from: 200, to: 300, color: "#E85D3D" },
    { from: 300, to: 500, color: "#C23B4F" },
  ];

  const color = colorForOqi(value);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size}`}>
        {/* background track */}
        <path
          d={arcPath(startAngle, startAngle + sweep)}
          fill="none"
          stroke="#1E2723"
          strokeWidth={size * 0.045}
          strokeLinecap="round"
        />
        {/* category bands, thin, behind the value arc */}
        {bands.map((b) => (
          <path
            key={b.from}
            d={arcPath(startAngle + sweep * (b.from / max), startAngle + sweep * (b.to / max))}
            fill="none"
            stroke={b.color}
            strokeOpacity="0.25"
            strokeWidth={size * 0.045}
          />
        ))}
        {/* value arc */}
        <path
          d={arcPath(startAngle, valueAngle)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.045}
          strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }}
        />
        <text
          x={cx}
          y={cy - size * 0.02}
          textAnchor="middle"
          className="font-display"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {Math.round(value)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          className="font-mono-data"
          fontSize={size * 0.055}
          fill="#8FA39A"
          letterSpacing="0.08em"
        >
          OQI / 500
        </text>
      </svg>
      <div className="text-center -mt-2">
        <div className="font-display text-lg font-semibold tracking-wide">{label}</div>
        {sublabel && <div className="text-textMuted text-xs font-mono-data mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
