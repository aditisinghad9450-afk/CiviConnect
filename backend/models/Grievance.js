const mongoose = require("mongoose");

const grievanceSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ["en", "hi", "ta"],
      default: "en",
    },
    gender: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    state: {
      type: String,
      trim: true,
    },
    grievanceText: {
      type: String,
      required: [true, "Grievance text is required"],
      trim: true,
      minlength: [5, "Grievance text is too short"],
    },
    category: {
      type: String,
      trim: true,
      default: "UNCATEGORIZED",
    },
    urgency: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    populationAffected: {
      type: String,
      enum: ["Individual", "Local Area", "Public"],
      default: "Individual",
    },
    status: {
      type: String,
      enum: ["Submitted", "In Progress", "Resolved"],
      default: "Submitted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grievance", grievanceSchema);
