import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { getCityDetail, getCityTrend, getCityPeakHours } from "../api";
import { colorForOqi, colorForCategory } from "../utils/oqi";
import GaugeDial from "./GaugeDial";

export default function CityDetailPanel({ cityId }) {
  const [detail, setDetail] = useState(null);
  const [trend, setTrend] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cityId) return;
    setLoading(true);
    Promise.all([getCityDetail(cityId), getCityTrend(cityId, 14), getCityPeakHours(cityId)])
      .then(([d, t, p]) => {
        setDetail(d);
        setTrend(t);
        setPeakHours(p);
      })
      .finally(() => setLoading(false));
  }, [cityId]);

  if (!cityId) {
    return (
      <div className="border border-panelBorder rounded-lg bg-panel/40 h-full flex items-center justify-center text-textMuted text-sm font-mono-data p-8 text-center">
        Select a city on the map or hotspot list to inspect its sensor trend and peak odour
        hours.
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className="border border-panelBorder rounded-lg bg-panel/40 h-full flex items-center justify-center text-textMuted text-sm font-mono-data">
        Loading city sensors…
      </div>
    );
  }

  const latest = detail.recentReadings?.[0];
  const busiestHour = peakHours.reduce(
    (max, h) => (h.avg_oqi > (max?.avg_oqi ?? -1) ? h : max),
    null
  );

  return (
    <div className="border border-panelBorder rounded-lg bg-panel/40 h-full overflow-y-auto p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide">{detail.city.name}</h2>
          <p className="text-textMuted text-xs font-mono-data mt-0.5">
            {detail.city.state} · {detail.city.zone_type.toUpperCase()} ZONE ·{" "}
            {detail.city.population_tier}
          </p>
        </div>
        {latest && (
          <span
            className="text-xs font-mono-data px-2 py-1 rounded border"
            style={{
              color: colorForCategory(latest.oqi_category),
              borderColor: colorForCategory(latest.oqi_category) + "55",
              background: colorForCategory(latest.oqi_category) + "15",
            }}
          >
            {latest.oqi_category}
          </span>
        )}
      </div>

      {latest && (
        <div className="flex items-center gap-6 mb-6">
          <GaugeDial value={Number(latest.oqi_score)} label="LATEST" size={140} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono-data text-xs flex-1">
            <GasReadout label="H2S" value={latest.h2s_ppb} unit="ppb" />
            <GasReadout label="NH3" value={latest.nh3_ppb} unit="ppb" />
            <GasReadout label="VOC" value={latest.voc_ppb} unit="ppb" />
            <GasReadout label="CH4" value={latest.ch4_ppm} unit="ppm" />
            <GasReadout label="CO" value={latest.co_ppm} unit="ppm" />
            {busiestHour && (
              <GasReadout
                label="PEAK HR"
                value={`${busiestHour.hour_of_day}:00`}
                unit=""
              />
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-mono-data text-xs text-textMuted mb-2 tracking-wider">
          14-DAY OQI TREND
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={trend}>
            <CartesianGrid stroke="#1E2723" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#8FA39A", fontSize: 10 }}
              tickFormatter={(d) => d?.slice(5)}
              axisLine={{ stroke: "#262F2B" }}
              tickLine={false}
            />
            <YAxis tick={{ fill: "#8FA39A", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#161D1A",
                border: "1px solid #262F2B",
                borderRadius: 6,
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="avg_oqi"
              stroke="#4FD1AE"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-mono-data text-xs text-textMuted mb-2 tracking-wider">
          ODOUR INTENSITY BY HOUR OF DAY
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={peakHours}>
            <XAxis
              dataKey="hour_of_day"
              tick={{ fill: "#8FA39A", fontSize: 9 }}
              axisLine={{ stroke: "#262F2B" }}
              tickLine={false}
              interval={2}
            />
            <Tooltip
              contentStyle={{
                background: "#161D1A",
                border: "1px solid #262F2B",
                borderRadius: 6,
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12,
              }}
              labelFormatter={(h) => `${h}:00`}
            />
            <Bar dataKey="avg_oqi" radius={[3, 3, 0, 0]}>
              {peakHours.map((h, i) => (
                <Cell key={i} fill={colorForOqi(h.avg_oqi)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GasReadout({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between border-b border-panelBorder/50 py-1">
      <span className="text-textMuted">{label}</span>
      <span className="text-textPrimary">
        {value} <span className="text-textMuted">{unit}</span>
      </span>
    </div>
  );
}
