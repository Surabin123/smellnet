import { Router } from "express";
import {
  getOverview,
  getHeatmap,
  getHotspots,
  getCities,
  getCityTrend,
  getCityPeakHours,
  getCityDetail,
} from "../controllers/oqiController.js";

const router = Router();

router.get("/overview", getOverview);
router.get("/heatmap", getHeatmap);
router.get("/hotspots", getHotspots);
router.get("/cities", getCities);
router.get("/city/:id", getCityDetail);
router.get("/city/:id/trend", getCityTrend);
router.get("/city/:id/peak-hours", getCityPeakHours);

export default router;
