const express = require("express");
const router = express.Router();
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  trackGrievance,
  updateGrievanceStatus,
} = require("../controllers/grievanceController");

router.post("/", createGrievance);
router.get("/", getGrievances);

// MUST come before "/:id" — otherwise Express treats "track" as an id
router.get("/track/:trackingId", trackGrievance);

router.get("/:id", getGrievanceById);
router.patch("/:id/status", updateGrievanceStatus);

module.exports = router;