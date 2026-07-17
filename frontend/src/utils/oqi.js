export const CATEGORY_COLORS = {
  Good: "#4FD1AE",
  Moderate: "#8FD14F",
  Poor: "#E8B23D",
  Severe: "#E85D3D",
  Hazardous: "#C23B4F",
};

export const CATEGORY_ORDER = ["Good", "Moderate", "Poor", "Severe", "Hazardous"];

export function colorForOqi(score) {
  if (score <= 50) return CATEGORY_COLORS.Good;
  if (score <= 100) return CATEGORY_COLORS.Moderate;
  if (score <= 200) return CATEGORY_COLORS.Poor;
  if (score <= 300) return CATEGORY_COLORS.Severe;
  return CATEGORY_COLORS.Hazardous;
}

export function colorForCategory(cat) {
  return CATEGORY_COLORS[cat] || "#8FA39A";
}
