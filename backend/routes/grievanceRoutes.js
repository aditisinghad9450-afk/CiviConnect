const express = require("express");
const router = express.Router();
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
} = require("../controllers/grievanceController");

router.post("/", createGrievance);
router.get("/", getGrievances);
router.get("/:id", getGrievanceById);
router.patch("/:id/status", updateGrievanceStatus);

module.exports = router;
