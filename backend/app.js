const express = require("express");
const cors = require("cors");
const grievanceRoutes = require("./routes/grievanceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/grievances", grievanceRoutes);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
