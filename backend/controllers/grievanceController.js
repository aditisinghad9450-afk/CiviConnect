const Grievance = require("../models/Grievance");

const ALLOWED_STATUSES = ["Submitted", "In Progress", "Resolved"];

// POST /api/grievances
async function createGrievance(req, res) {
  try {
    const { grievanceText } = req.body;
    if (!grievanceText || grievanceText.trim().length < 5) {
      return res.status(400).json({ error: "grievanceText is required and must be at least 5 characters" });
    }

    // Ignore any trackingId/timeline/status the client tries to send
    const { trackingId, timeline, status, ...safeBody } = req.body;

    const grievance = await Grievance.create(safeBody);
    return res.status(201).json(grievance);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
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
    if (!grievance) return res.status(404).json({ error: "Grievance not found" });
    return res.status(200).json(grievance);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid grievance id" });
    console.error(err);
    return res.status(500).json({ error: "Something went wrong fetching the grievance" });
  }
}

// GET /api/grievances/track/:trackingId  (public lookup)
async function trackGrievance(req, res) {
  try {
    const raw = (req.params.trackingId || "").trim().toUpperCase();

    if (!/^CC-\d{4}-[A-Z2-9]{8}$/.test(raw)) {
      return res.status(400).json({
        error: "Invalid tracking ID format. Expected something like CC-2026-K7P2XQ4M",
      });
    }

    const grievance = await Grievance.findOne({ trackingId: raw });
    if (!grievance) return res.status(404).json({ error: "No grievance found with that tracking ID" });

    return res.status(200).json(grievance.toPublicJSON());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong looking up the grievance" });
  }
}

// PATCH /api/grievances/:id/status
async function updateGrievanceStatus(req, res) {
  try {
    const { status, note } = req.body;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) return res.status(404).json({ error: "Grievance not found" });

    grievance.status = status;
    grievance.timeline = [
      ...(grievance.timeline || []),
      { status, note: note || undefined, changedAt: new Date() },
    ];
    await grievance.save();

    return res.status(200).json(grievance);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid grievance id" });
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Something went wrong updating the grievance" });
  }
}

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
  trackGrievance,
  updateGrievanceStatus,
};