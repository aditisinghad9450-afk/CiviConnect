const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/adminAuth");
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  trackGrievance,
  updateGrievanceStatus,
} = require("../controllers/grievanceController");

// --- Public: anyone can file a grievance ---
router.post("/", createGrievance);

// Must come BEFORE "/:id", otherwise Express matches "track" as an id
router.get("/track/:trackingId", trackGrievance);

// --- Admin only ---
router.get("/", requireAdmin, getGrievances);
router.get("/:id", requireAdmin, getGrievanceById);
router.patch("/:id/status", requireAdmin, updateGrievanceStatus);

module.exports = router;