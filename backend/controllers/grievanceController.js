const Grievance = require("../models/Grievance");

// POST /api/grievances
async function createGrievance(req, res) {
  try {
    const { grievanceText } = req.body;

    if (!grievanceText || grievanceText.trim().length < 5) {
      return res.status(400).json({
        error: "grievanceText is required and must be at least 5 characters",
      });
    }

    const grievance = await Grievance.create(req.body);
    return res.status(201).json(grievance);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong creating the grievance" });
  }
}

// GET /api/grievances
async function getGrievances(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const grievances = await Grievance.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(grievances);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong fetching grievances" });
  }
}

// GET /api/grievances/:id
async function getGrievanceById(req, res) {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }
    return res.status(200).json(grievance);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid grievance id" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong fetching the grievance" });
  }
}

// PATCH /api/grievances/:id/status
async function updateGrievanceStatus(req, res) {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Submitted", "In Progress", "Resolved"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    return res.status(200).json(grievance);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid grievance id" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong updating the grievance" });
  }
}

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
};
