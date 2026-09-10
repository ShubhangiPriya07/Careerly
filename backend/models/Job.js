const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    jobType: {
      type: String,
      default: "",
    },

    workMode: {
      type: String,
      default: "",
    },

    experienceLevel: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    salary: {
      type: String,
      default: "",
    },

    applicationUrl: {
      type: String,
      default: "",
    },

    postedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index(
  { externalId: 1, source: 1 },
  { unique: true }
);

jobSchema.index({
  title: "text",
  company: "text",
  description: "text",
  skills: "text",
});

module.exports = mongoose.model("Job", jobSchema);