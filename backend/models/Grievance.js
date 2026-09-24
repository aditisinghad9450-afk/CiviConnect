const mongoose = require("mongoose");
const { generateTrackingId } = require("../utils/trackingId");

const statusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Submitted", "In Progress", "Resolved"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, "Note is too long"],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Optional validator: blank values are allowed, but if something IS given it must be valid.
function optional(regex, message) {
  return {
    validator: function (v) {
      if (v === undefined || v === null || v === "") return true;
      return regex.test(v);
    },
    message: message,
  };
}

const locationSchema = new mongoose.Schema(
  {
    area: { type: String, trim: true, maxlength: [200, "Area is too long"] },
    landmark: { type: String, trim: true, maxlength: [200, "Landmark is too long"] },
    pincode: {
      type: String,
      trim: true,
      validate: optional(/^\d{6}$/, "Pincode must be 6 digits"),
    },
    // Captured from the browser's geolocation API when the citizen allows it.
    lat: { type: Number, min: [-90, "Invalid latitude"], max: [90, "Invalid latitude"] },
    lng: { type: Number, min: [-180, "Invalid longitude"], max: [180, "Invalid longitude"] },
    accuracyMeters: { type: Number, min: [0, "Invalid accuracy"] },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      validate: optional(/^[0-9+\-\s()]{7,20}$/, "Phone number looks invalid"),
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: optional(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email looks invalid"),
    },
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      index: true,
      default: () => generateTrackingId(),
    },
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
    location: { type: locationSchema, default: undefined },
    contact: { type: contactSchema, default: undefined },
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
    timeline: {
      type: [statusEventSchema],
      default: undefined,
    },
  },
  { timestamps: true }
);

// Every grievance starts its timeline at "Submitted" so the citizen
// always sees at least one entry when they look it up.
grievanceSchema.pre("save", function (next) {
  if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
    this.timeline = [
      {
        status: this.status || "Submitted",
        note: "Grievance received",
        changedAt: new Date(),
      },
    ];
  }
  next();
});

/**
 * Public-safe view for the citizen tracking endpoint.
 * Deliberately excludes demographics (gender, age) and the internal _id:
 * the tracking ID is shareable, so anything returned here should be
 * safe for whoever holds that ID to see.
 */
grievanceSchema.methods.toPublicJSON = function () {
  const loc = this.location;

  return {
    trackingId: this.trackingId,
    grievanceText: this.grievanceText,
    category: this.category,
    urgency: this.urgency,
    populationAffected: this.populationAffected,
    status: this.status,
    // Coarse location only, so the citizen can recognise their own report.
    // Precise coordinates, pincode and contact details are NEVER returned here:
    // a tracking ID is meant to be shareable, so anything in this payload
    // should be safe for whoever holds it to read.
    location: loc && (loc.area || loc.landmark)
      ? { area: loc.area, landmark: loc.landmark }
      : undefined,
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