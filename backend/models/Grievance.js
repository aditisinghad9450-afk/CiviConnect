const mongoose = require("mongoose");
const { generateTrackingId } = require("../utils/trackingId");

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["Submitted", "In Progress", "Resolved"], required: true },
    note: { type: String, trim: true, maxlength: [300, "Note is too long"] },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    trackingId: { type: String, unique: true, index: true, default: () => generateTrackingId() },
    language: { type: String, enum: ["en", "hi", "ta"], default: "en" },
    gender: { type: String, trim: true },
    age: { type: Number, min: 0, max: 120 },
    state: { type: String, trim: true },
    grievanceText: {
      type: String,
      required: [true, "Grievance text is required"],
      trim: true,
      minlength: [5, "Grievance text is too short"],
    },
    category: { type: String, trim: true, default: "UNCATEGORIZED" },
    urgency: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    populationAffected: { type: String, enum: ["Individual", "Local Area", "Public"], default: "Individual" },
    status: { type: String, enum: ["Submitted", "In Progress", "Resolved"], default: "Submitted" },
    timeline: { type: [statusEventSchema], default: undefined },
  },
  { timestamps: true }
);

// Every new grievance starts with one timeline entry
grievanceSchema.pre("save", function (next) {
  if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
    this.timeline = [{ status: this.status || "Submitted", note: "Grievance received", changedAt: new Date() }];
  }
  next();
});

// Safe view for the public tracking page — no gender, age, or internal _id
grievanceSchema.methods.toPublicJSON = function () {
  return {
    trackingId: this.trackingId,
    grievanceText: this.grievanceText,
    category: this.category,
    urgency: this.urgency,
    populationAffected: this.populationAffected,
    status: this.status,
    submittedAt: this.createdAt,
    lastUpdatedAt: this.updatedAt,
    timeline: (this.timeline || []).map((e) => ({
      status: e.status,
      note: e.note,
      changedAt: e.changedAt,
    })),
  };
};

module.exports = mongoose.model("Grievance", grievanceSchema);