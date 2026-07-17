import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import oqiRoutes from "./routes/oqiRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "SmellNet API" });
});

app.use("/api", oqiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SmellNet API running on http://localhost:${PORT}`);
});
